import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkAuthorityAccess } from '@/lib/authority/auth';
import { resolveModel, getProviderAdapterForUser, requireCredits, deductCredits, isSuperAdmin, calculateCreditCost } from '@/lib/ai/server';
import type { AIFeature } from '@/lib/ai/server';

export const maxDuration = 60;

const FIELD_PROMPTS: Record<string, { system: string; instruction: string }> = {
  company_overview: {
    system: 'You are an expert PR copywriter who writes concise, compelling company overviews for press kits.',
    instruction: 'Write a professional company overview (150-250 words) suitable for a press kit. It should explain what the company does, who it serves, and what makes it unique. Write in third person, journalistic tone.',
  },
  mission_statement: {
    system: 'You are an expert brand strategist who crafts inspiring mission statements.',
    instruction: 'Write a concise, powerful mission statement (1-3 sentences) that captures the company\'s purpose and impact. It should be memorable and actionable.',
  },
  founder_bio: {
    system: 'You are an expert PR writer who specialises in founder and executive biographies.',
    instruction: 'Write a professional founder/CEO biography (150-250 words) suitable for media use. Include their vision, expertise, and what drives them. Write in third person.',
  },
  speaking_topics: {
    system: 'You are a PR strategist who identifies compelling speaking topics for thought leaders.',
    instruction: 'Suggest 5-7 speaking topics this founder/company could present at conferences, podcasts, and media appearances. Each topic should be a short, catchy title (5-10 words). Return ONLY a JSON array of strings, e.g. ["Topic 1", "Topic 2"]. No other text.',
  },
  milestones: {
    system: 'You are a PR strategist who identifies compelling company milestones.',
    instruction: 'Suggest 5 key milestones that would be impressive for media coverage. Each should be a short phrase (e.g., "Launched in 3 African markets, 2023"). Return ONLY a JSON array of strings. No other text.',
  },
  awards: {
    system: 'You are a PR strategist who helps companies identify potential awards and recognition.',
    instruction: 'Suggest 3-5 realistic awards or recognition this type of company might pursue or have received. Each should be a short phrase. Return ONLY a JSON array of strings. No other text.',
  },
  key_stats: {
    system: 'You are a PR strategist who identifies compelling statistics for press kits.',
    instruction: 'Suggest 4-6 types of key statistics this company should highlight in their press kit (e.g., "10,000+ users served"). Frame them as templates with realistic-sounding numbers. Return ONLY a JSON array of strings. No other text.',
  },
};

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { organizationId, fieldName, modelId, currentValue } = await request.json();
  if (!organizationId || !fieldName) {
    return NextResponse.json({ error: 'organizationId and fieldName required' }, { status: 400 });
  }

  const fieldConfig = FIELD_PROMPTS[fieldName];
  if (!fieldConfig) {
    return NextResponse.json({ error: `Unknown field: ${fieldName}` }, { status: 400 });
  }

  const access = await checkAuthorityAccess(supabase, user.id, organizationId);
  if (!access.authorized) return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  const db = access.queryClient;

  // Resolve model
  const resolvedModel = await resolveModel(organizationId, 'content_generation' as AIFeature, modelId || null, user.id);
  const { adapter, usingUserKey } = await getProviderAdapterForUser(resolvedModel.provider, user.id);

  // Check credits (skip when using user's own API key)
  if (!usingUserKey) {
    const creditCheck = await requireCredits(organizationId, resolvedModel.id, 300, 1000, user.id);
    if (creditCheck) return creditCheck;
  }

  // Fetch brand data
  const PR_RELEVANT_KEYS = [
    'brand_positioning', 'brand_promise', 'brand_story', 'brand_voice',
    'target_audience', 'ideal_customer', 'unique_value_proposition',
    'competitive_advantage', 'founder_story', 'brand_mission', 'brand_vision',
    'brand_archetype', 'key_messages', 'industry', 'niche',
    'content_pillars', 'brand_personality', 'brand_values',
  ];

  const { data: outputs } = await db
    .from('brand_outputs')
    .select('output_key, output_value')
    .eq('organization_id', organizationId)
    .in('output_key', PR_RELEVANT_KEYS);

  const brandLines = (outputs || [])
    .filter((o) => o.output_value)
    .map((o) => {
      const val = typeof o.output_value === 'string' ? o.output_value : JSON.stringify(o.output_value);
      return `${o.output_key}: ${val.length > 500 ? val.slice(0, 500) + '...' : val}`;
    });

  let brandContext = '';
  for (const line of brandLines) {
    if ((brandContext + line).length > 6000) break;
    brandContext += (brandContext ? '\n' : '') + line;
  }

  // Get org name
  const { data: org } = await db
    .from('organizations')
    .select('name')
    .eq('id', organizationId)
    .single();

  // Try to get industry from brand outputs
  const industryOutput = (outputs || []).find((o) => o.output_key === 'industry');
  const industryVal = industryOutput?.output_value
    ? (typeof industryOutput.output_value === 'string' ? industryOutput.output_value : JSON.stringify(industryOutput.output_value))
    : 'Not specified';

  const prompt = `${fieldConfig.instruction}

COMPANY: ${org?.name || 'Unknown'}
INDUSTRY: ${industryVal}

BRAND PROFILE:
${brandContext || 'No brand data available.'}

${currentValue ? `CURRENT CONTENT (improve or rewrite this):\n${currentValue}` : ''}

${fieldName === 'speaking_topics' || fieldName === 'milestones' || fieldName === 'awards' || fieldName === 'key_stats'
    ? 'Return ONLY a valid JSON array of strings. No markdown, no explanation.'
    : 'Return ONLY the text content. No markdown formatting, no headers, no explanation.'}`;

  try {
    const response = await adapter.complete({
      messages: [
        { role: 'system', content: fieldConfig.system },
        { role: 'user', content: prompt },
      ],
      maxTokens: 1000,
      temperature: 0.7,
      modelId: resolvedModel.modelId,
    });

    // Deduct credits (skip when using user's own API key)
    const creditCost = calculateCreditCost(resolvedModel.id, response.inputTokens, response.outputTokens);
    const superAdmin = await isSuperAdmin(user.id);
    if (!superAdmin && !usingUserKey && creditCost > 0) {
      await deductCredits(organizationId, user.id, creditCost, null, `AI press kit field: ${fieldName} — ${resolvedModel.name}`);
    }

    let result = response.text.trim();

    // For list fields, try to parse as JSON array
    if (['speaking_topics', 'milestones', 'awards', 'key_stats'].includes(fieldName)) {
      result = result.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      try {
        const parsed = JSON.parse(result);
        return NextResponse.json({ items: parsed, type: 'list' });
      } catch {
        return NextResponse.json({ error: 'AI returned invalid format. Try again.' }, { status: 500 });
      }
    }

    return NextResponse.json({ text: result, type: 'text' });
  } catch (err) {
    console.error('Press kit field AI generation failed:', err);
    const message = err instanceof Error ? err.message : 'AI generation failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
