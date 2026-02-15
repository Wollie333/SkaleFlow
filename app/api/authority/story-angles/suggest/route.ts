import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkAuthorityAccess } from '@/lib/authority/auth';
import { resolveModel, getProviderAdapterForUser, requireCredits, deductCredits, isSuperAdmin, calculateCreditCost } from '@/lib/ai/server';
import type { AIFeature } from '@/lib/ai/server';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { organizationId, modelId } = await request.json();
  if (!organizationId) return NextResponse.json({ error: 'organizationId required' }, { status: 400 });

  const access = await checkAuthorityAccess(supabase, user.id, organizationId);
  if (!access.authorized) return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  const db = access.queryClient;

  // Resolve model — use client-selected model if provided
  const resolvedModel = await resolveModel(organizationId, 'content_generation' as AIFeature, modelId || null, user.id);
  const { adapter, usingUserKey } = await getProviderAdapterForUser(resolvedModel.provider, user.id);

  // Check credits (skip when using user's own API key)
  if (!usingUserKey) {
    const creditCheck = await requireCredits(organizationId, resolvedModel.id, 500, 1500, user.id);
    if (creditCheck) return creditCheck;
  }

  // Fetch brand data for context — only the key variables needed for story angles
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
      // Truncate long values to keep within token limits
      return `${o.output_key}: ${val.length > 500 ? val.slice(0, 500) + '...' : val}`;
    });

  // Cap total brand context at ~6000 chars (~2000 tokens) to stay within model limits
  let brandContext = '';
  for (const line of brandLines) {
    if ((brandContext + line).length > 6000) break;
    brandContext += (brandContext ? '\n' : '') + line;
  }

  // Fetch existing angles to avoid duplicates
  const { data: existing } = await db
    .from('authority_story_angles')
    .select('title')
    .eq('organization_id', organizationId);

  const existingTitles = (existing || []).map((a) => a.title).join(', ');

  const prompt = `You are a PR strategist. Based on this brand profile, suggest 5 compelling story angles for media outreach.

BRAND PROFILE:
${brandContext || 'No brand data available.'}

${existingTitles ? `EXISTING ANGLES (avoid duplicating): ${existingTitles}` : ''}

For each angle, provide:
1. A compelling title (short, punchy)
2. A 1-2 sentence description explaining the angle
3. Suggested outlets (comma-separated media outlets to target)
4. Category/format (e.g., feature_article, podcast_episode, interview, news_piece)

Respond in JSON format:
[
  { "title": "...", "description": "...", "suggested_outlets": "...", "category": "..." }
]

Return ONLY the JSON array, no additional text.`;

  try {
    const response = await adapter.complete({
      messages: [{ role: 'user', content: prompt }],
      maxTokens: 1500,
      temperature: 0.8,
      modelId: resolvedModel.modelId,
    });

    // Deduct credits (skip when using user's own API key)
    const creditCost = calculateCreditCost(resolvedModel.id, response.inputTokens, response.outputTokens);
    const superAdmin = await isSuperAdmin(user.id);
    if (!superAdmin && !usingUserKey && creditCost > 0) {
      await deductCredits(organizationId, user.id, creditCost, null, `AI story angle suggestions — ${resolvedModel.name}`);
    }

    const text = response.text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const suggestions = JSON.parse(text);
    return NextResponse.json(suggestions);
  } catch (err) {
    console.error('Story angle AI generation failed:', err);
    const message = err instanceof Error ? err.message : 'AI generation failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
