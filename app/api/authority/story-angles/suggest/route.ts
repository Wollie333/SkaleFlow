import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkAuthorityAccess } from '@/lib/authority/auth';
import { resolveModel, getProviderAdapter, requireCredits, deductCredits, isSuperAdmin, calculateCreditCost } from '@/lib/ai/server';
import type { AIFeature } from '@/lib/ai/server';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { organizationId } = await request.json();
  if (!organizationId) return NextResponse.json({ error: 'organizationId required' }, { status: 400 });

  const access = await checkAuthorityAccess(supabase, user.id, organizationId);
  if (!access.authorized) return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  const db = access.queryClient;

  // Resolve model
  const resolvedModel = await resolveModel(organizationId, 'content_generation' as AIFeature);
  const adapter = getProviderAdapter(resolvedModel.provider);

  // Check credits
  const creditCheck = await requireCredits(organizationId, resolvedModel.id, 500, 1500, user.id);
  if (creditCheck) return creditCheck;

  // Fetch brand data for context
  const { data: outputs } = await db
    .from('brand_outputs')
    .select('output_key, output_value')
    .eq('organization_id', organizationId);

  const brandContext = (outputs || [])
    .filter((o) => o.output_value)
    .map((o) => `${o.output_key}: ${typeof o.output_value === 'string' ? o.output_value : JSON.stringify(o.output_value)}`)
    .join('\n');

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
3. Suggested target outlets (comma-separated)
4. Recommended format (e.g., feature_article, podcast_episode, interview, news_piece)

Respond in JSON format:
[
  { "title": "...", "description": "...", "target_outlets": "...", "recommended_format": "..." }
]

Return ONLY the JSON array, no additional text.`;

  const response = await adapter.complete({
    messages: [{ role: 'user', content: prompt }],
    maxTokens: 1500,
    temperature: 0.8,
    modelId: resolvedModel.modelId,
  });

  // Deduct credits
  const creditCost = calculateCreditCost(resolvedModel.id, response.inputTokens, response.outputTokens);
  const superAdmin = await isSuperAdmin(user.id);
  if (!superAdmin && creditCost > 0) {
    await deductCredits(organizationId, user.id, creditCost, null, `AI story angle suggestions — ${resolvedModel.name}`);
  }

  try {
    const text = response.text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const suggestions = JSON.parse(text);
    return NextResponse.json(suggestions);
  } catch {
    return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 });
  }
}
