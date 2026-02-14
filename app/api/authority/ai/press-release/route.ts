import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkAuthorityAccess } from '@/lib/authority/auth';
import { resolveModel, getProviderAdapter, requireCredits, deductCredits, isSuperAdmin, calculateCreditCost } from '@/lib/ai/server';
import type { AIFeature } from '@/lib/ai/server';
import { buildPressReleasePrompt } from '@/lib/authority/prompts';

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { organizationId, category, storyAngle, outlet, additionalContext } = await request.json();
  if (!organizationId) return NextResponse.json({ error: 'organizationId required' }, { status: 400 });

  const access = await checkAuthorityAccess(supabase, user.id, organizationId);
  if (!access.authorized) return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  const db = access.queryClient;

  const resolvedModel = await resolveModel(organizationId, 'content_generation' as AIFeature);
  const adapter = getProviderAdapter(resolvedModel.provider);

  const creditCheck = await requireCredits(organizationId, resolvedModel.id, 1000, 2000, user.id);
  if (creditCheck) return creditCheck;

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

  const prompt = buildPressReleasePrompt({
    companyName: org?.name || 'the company',
    brandContext: brandContext || 'No brand data available.',
    storyAngle,
    category: category || 'press_release',
    outlet,
    additionalContext,
  });

  const response = await adapter.complete({
    messages: [{ role: 'user', content: prompt }],
    maxTokens: 2000,
    temperature: 0.7,
    modelId: resolvedModel.modelId,
  });

  const creditCost = calculateCreditCost(resolvedModel.id, response.inputTokens, response.outputTokens);
  const superAdmin = await isSuperAdmin(user.id);
  if (!superAdmin && creditCost > 0) {
    await deductCredits(organizationId, user.id, creditCost, null, `AI press release — ${resolvedModel.name}`);
  }

  return NextResponse.json({ text: response.text, model: resolvedModel.name });
}
