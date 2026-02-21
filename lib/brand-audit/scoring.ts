/**
 * Brand Audit AI scoring — Chain 5.
 * Loads sections → validates ≥5 complete → AI scoring → insert scores + update audit.
 */

import { createServiceClient } from '@/lib/supabase/server';
import { buildScoringPrompt } from './prompts';
import { CATEGORY_ORDER, AUDIT_CREDIT_COSTS } from './types';
import type { BrandAuditCategory, BrandAuditRating } from '@/types/database';

export async function scoreAudit(auditId: string, orgId: string, userId: string) {
  const supabase = createServiceClient();

  // 1. Load audit + sections
  const { data: audit } = await supabase
    .from('brand_audits')
    .select('id, organization_id, status, sections_completed')
    .eq('id', auditId)
    .single();

  if (!audit) throw new Error('Audit not found');
  if (audit.sections_completed < 5) {
    throw new Error('At least 5 sections must be complete before scoring');
  }

  // Transition to scoring
  await supabase.from('brand_audits').update({ status: 'scoring' }).eq('id', auditId);

  const { data: sections } = await supabase
    .from('brand_audit_sections')
    .select('section_key, data, is_complete')
    .eq('audit_id', auditId);

  if (!sections) throw new Error('No sections found');

  // Build section data map
  const sectionData: Record<string, Record<string, unknown>> = {};
  for (const s of sections) {
    sectionData[s.section_key] = (s.data || {}) as Record<string, unknown>;
  }

  // 2. Call AI
  const { resolveModel, deductCredits } = await import('@/lib/ai/server');
  const { getProviderAdapterForUser } = await import('@/lib/ai/providers/registry');
  const { isSuperAdmin } = await import('@/lib/ai/credits');

  const isAdmin = await isSuperAdmin(userId);

  // Credit check (unless super admin)
  if (!isAdmin) {
    const { requireCredits } = await import('@/lib/ai/middleware');
    const creditCheck = await requireCredits(orgId, 'brand_audit', AUDIT_CREDIT_COSTS.scoring, AUDIT_CREDIT_COSTS.scoring, userId);
    if (creditCheck) {
      await supabase.from('brand_audits').update({ status: 'review' }).eq('id', auditId);
      throw new Error('Insufficient credits for scoring');
    }
  }

  const resolved = await resolveModel(orgId, 'brand_audit', undefined, userId);
  const { adapter, usingUserKey } = await getProviderAdapterForUser(resolved.provider, userId);

  const prompt = buildScoringPrompt(sectionData);

  const response = await adapter.complete({
    systemPrompt: 'You are an expert brand auditor. Return only valid JSON, no markdown.',
    messages: [{ role: 'user', content: prompt }],
    maxTokens: 4000,
    temperature: 0.3,
    modelId: resolved.modelId,
    jsonMode: true,
  });

  // 3. Deduct credits
  if (!usingUserKey && !isAdmin) {
    const { calculateCreditCost } = await import('@/lib/ai/credits');
    const credits = calculateCreditCost(resolved.id, response.inputTokens, response.outputTokens);
    await deductCredits(orgId, userId, credits, null, 'Brand audit scoring');
  }

  // 4. Parse response
  let result: {
    categories: Record<string, { score: number; rating: string; analysis: string; key_finding: string; actionable_insight: string }>;
    overall_score: number;
    overall_rating: string;
    executive_summary: string;
  };

  try {
    const cleaned = response.text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    result = JSON.parse(cleaned);
  } catch {
    await supabase.from('brand_audits').update({ status: 'review' }).eq('id', auditId);
    throw new Error('Failed to parse AI scoring response');
  }

  // 5. Upsert scores
  for (const category of CATEGORY_ORDER) {
    const catData = result.categories[category];
    if (!catData) continue;

    await supabase
      .from('brand_audit_scores')
      .upsert({
        audit_id: auditId,
        category,
        score: catData.score,
        rating: catData.rating as BrandAuditRating,
        analysis: catData.analysis,
        key_finding: catData.key_finding,
        actionable_insight: catData.actionable_insight,
      }, { onConflict: 'audit_id,category' });
  }

  // 6. Update audit with overall results
  await supabase
    .from('brand_audits')
    .update({
      status: 'complete',
      overall_score: result.overall_score,
      overall_rating: result.overall_rating as BrandAuditRating,
      executive_summary: result.executive_summary,
    })
    .eq('id', auditId);

  return result;
}
