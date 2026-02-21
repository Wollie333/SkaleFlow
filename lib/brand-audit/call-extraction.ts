/**
 * Brand Audit call extraction — Chain 4.
 * Full transcript → map to 8 sections with confidence scores.
 */

import { createServiceClient } from '@/lib/supabase/server';
import { buildPostCallExtractionPrompt } from './prompts';
import { SECTION_ORDER, AUDIT_CREDIT_COSTS } from './types';

export async function extractBrandAuditData(callId: string, orgId: string, userId: string) {
  const supabase = createServiceClient();

  // Get call + transcript
  const { data: transcripts } = await supabase
    .from('call_transcripts')
    .select('speaker_label, content')
    .eq('call_id', callId)
    .order('timestamp_start', { ascending: true });

  if (!transcripts || transcripts.length < 5) {
    console.log('[BrandAudit] Not enough transcript data for extraction');
    return null;
  }

  const fullTranscript = transcripts
    .map((t) => `${t.speaker_label}: ${t.content}`)
    .join('\n');

  // Get business context from the audit contact
  const { data: audit } = await supabase
    .from('brand_audits')
    .select('id, crm_contacts (first_name, last_name, crm_companies (name, industry))')
    .eq('call_id', callId)
    .single();

  const contact = audit?.crm_contacts as { first_name: string; last_name: string; crm_companies?: { name: string; industry: string } | null } | null;
  const businessContext = contact
    ? `${contact.first_name} ${contact.last_name}${contact.crm_companies ? ` at ${contact.crm_companies.name} (${contact.crm_companies.industry || 'unknown industry'})` : ''}`
    : 'Unknown business';

  // AI extraction
  const { resolveModel, deductCredits } = await import('@/lib/ai/server');
  const { getProviderAdapterForUser } = await import('@/lib/ai/providers/registry');
  const { isSuperAdmin } = await import('@/lib/ai/credits');

  const isAdmin = await isSuperAdmin(userId);

  if (!isAdmin) {
    const { requireCredits } = await import('@/lib/ai/middleware');
    const creditCheck = await requireCredits(orgId, 'brand_audit', AUDIT_CREDIT_COSTS.post_call_extraction, AUDIT_CREDIT_COSTS.post_call_extraction, userId);
    if (creditCheck) {
      console.error('[BrandAudit] Insufficient credits for call extraction');
      return null;
    }
  }

  const resolved = await resolveModel(orgId, 'brand_audit', undefined, userId);
  const { adapter, usingUserKey } = await getProviderAdapterForUser(resolved.provider, userId);

  const prompt = buildPostCallExtractionPrompt(fullTranscript, businessContext);

  const response = await adapter.complete({
    systemPrompt: 'You are an expert brand analyst extracting data from a discovery call. Return only valid JSON.',
    messages: [{ role: 'user', content: prompt }],
    maxTokens: 4000,
    temperature: 0.3,
    modelId: resolved.modelId,
    jsonMode: true,
  });

  if (!usingUserKey && !isAdmin) {
    const { calculateCreditCost } = await import('@/lib/ai/credits');
    const credits = calculateCreditCost(resolved.id, response.inputTokens, response.outputTokens);
    await deductCredits(orgId, userId, credits, null, 'Brand audit call extraction');
  }

  // Parse
  let extracted: Record<string, Record<string, unknown>> & { extraction_confidence?: Record<string, number> };
  try {
    const cleaned = response.text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    extracted = JSON.parse(cleaned);
  } catch {
    console.error('[BrandAudit] Failed to parse call extraction response');
    return null;
  }

  if (!audit?.id) return extracted;

  // Update sections
  const confidences = extracted.extraction_confidence || {};
  let completedCount = 0;

  for (const sectionKey of SECTION_ORDER) {
    const sectionData = extracted[sectionKey];
    if (!sectionData || Object.keys(sectionData).length === 0) continue;

    const confidence = confidences[sectionKey] || 0.5;
    const hasSubstantialData = Object.values(sectionData).filter((v) => v !== null && v !== undefined && v !== '').length >= 2;

    await supabase
      .from('brand_audit_sections')
      .update({
        data: sectionData as unknown as import('@/types/database').Json,
        data_source: 'call_extracted',
        extraction_confidence: confidence,
        is_complete: hasSubstantialData && confidence >= 0.6,
      })
      .eq('audit_id', audit.id)
      .eq('section_key', sectionKey);

    if (hasSubstantialData && confidence >= 0.6) completedCount++;
  }

  // Update audit
  await supabase
    .from('brand_audits')
    .update({
      sections_completed: completedCount,
      status: 'call_complete',
    })
    .eq('id', audit.id);

  return extracted;
}
