/**
 * Brand Audit input assistance — Chain 1.
 * Refines user's rough section data with AI.
 */

import { createServiceClient } from '@/lib/supabase/server';
import { buildInputRefinementPrompt } from './prompts';
import { AUDIT_CREDIT_COSTS } from './types';
import type { BrandAuditSectionKey } from '@/types/database';

export async function refineSection(
  sectionKey: BrandAuditSectionKey,
  rawData: Record<string, unknown>,
  businessContext: string,
  orgId: string,
  userId: string
): Promise<{
  refined_data: Record<string, unknown>;
  gaps: string[];
  suggestions: string[];
}> {
  const { resolveModel, deductCredits } = await import('@/lib/ai/server');
  const { getProviderAdapterForUser } = await import('@/lib/ai/providers/registry');
  const { isSuperAdmin } = await import('@/lib/ai/credits');

  const isAdmin = await isSuperAdmin(userId);

  if (!isAdmin) {
    const { requireCredits } = await import('@/lib/ai/middleware');
    const creditCheck = await requireCredits(orgId, 'brand_audit', AUDIT_CREDIT_COSTS.section_refine, AUDIT_CREDIT_COSTS.section_refine, userId);
    if (creditCheck) {
      throw new Error('Insufficient credits for AI refinement');
    }
  }

  const resolved = await resolveModel(orgId, 'brand_audit', undefined, userId);
  const { adapter, usingUserKey } = await getProviderAdapterForUser(resolved.provider, userId);

  const prompt = buildInputRefinementPrompt(sectionKey, rawData, businessContext);

  const response = await adapter.complete({
    systemPrompt: 'You are a brand strategist. Return only valid JSON, no markdown.',
    messages: [{ role: 'user', content: prompt }],
    maxTokens: 1500,
    temperature: 0.4,
    modelId: resolved.modelId,
  });

  if (!usingUserKey && !isAdmin) {
    const { calculateCreditCost } = await import('@/lib/ai/credits');
    const credits = calculateCreditCost(resolved.id, response.inputTokens, response.outputTokens);
    await deductCredits(orgId, userId, credits, null, `Brand audit section refinement: ${sectionKey}`);
  }

  try {
    const cleaned = response.text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleaned);
  } catch {
    throw new Error('Failed to parse AI refinement response');
  }
}
