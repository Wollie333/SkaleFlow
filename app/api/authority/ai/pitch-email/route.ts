import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkAuthorityAccess } from '@/lib/authority/auth';
import { resolveModel, getProviderAdapterForUser, requireCredits, deductCredits, isSuperAdmin, calculateCreditCost } from '@/lib/ai/server';
import type { AIFeature } from '@/lib/ai/server';
import { buildPitchEmailPrompt } from '@/lib/authority/prompts';

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { organizationId, contactName, contactOutlet, contactWarmth, storyAngle, category, additionalContext } = await request.json();
  if (!organizationId || !contactName) return NextResponse.json({ error: 'organizationId and contactName required' }, { status: 400 });

  const access = await checkAuthorityAccess(supabase, user.id, organizationId);
  if (!access.authorized) return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  const db = access.queryClient;

  const resolvedModel = await resolveModel(organizationId, 'content_generation' as AIFeature);
  const { adapter, usingUserKey } = await getProviderAdapterForUser(resolvedModel.provider, user.id);

  // Check credits (skip when using user's own API key)
  if (!usingUserKey) {
    const creditCheck = await requireCredits(organizationId, resolvedModel.id, 800, 1000, user.id);
    if (creditCheck) return creditCheck;
  }

  // Get org name
  const { data: org } = await db
    .from('organizations')
    .select('name')
    .eq('id', organizationId)
    .single();

  // Fetch brand data
  const { data: outputs } = await db
    .from('brand_outputs')
    .select('output_key, output_value')
    .eq('organization_id', organizationId);

  const brandContext = (outputs || [])
    .filter((o) => o.output_value)
    .map((o) => `${o.output_key}: ${typeof o.output_value === 'string' ? o.output_value : JSON.stringify(o.output_value)}`)
    .join('\n');

  const prompt = buildPitchEmailPrompt({
    companyName: org?.name || 'the company',
    brandContext: brandContext || 'No brand data available.',
    contactName,
    contactOutlet,
    contactWarmth: contactWarmth || 'cold',
    storyAngle,
    category: category || 'media_placement',
    additionalContext,
  });

  try {
    const response = await adapter.complete({
      messages: [{ role: 'user', content: prompt }],
      maxTokens: 1000,
      temperature: 0.7,
      modelId: resolvedModel.modelId,
    });

    // Deduct credits (skip when using user's own API key)
    const creditCost = calculateCreditCost(resolvedModel.id, response.inputTokens, response.outputTokens);
    const superAdmin = await isSuperAdmin(user.id);
    if (!superAdmin && !usingUserKey && creditCost > 0) {
      await deductCredits(organizationId, user.id, creditCost, null, `AI pitch email — ${resolvedModel.name}`);
    }

    return NextResponse.json({ text: response.text, model: resolvedModel.name });
  } catch (err) {
    console.error('Pitch email AI generation failed:', err);
    const message = err instanceof Error ? err.message : 'AI generation failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
