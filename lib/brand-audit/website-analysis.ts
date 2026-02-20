/**
 * Brand Audit website analysis — Chain 2.
 * Fetches website content and AI-analyses for auto-population.
 */

import { createServiceClient } from '@/lib/supabase/server';
import { buildWebsiteAnalysisPrompt } from './prompts';
import { SECTION_ORDER, AUDIT_CREDIT_COSTS } from './types';

export async function analyzeWebsite(
  url: string,
  auditId: string,
  orgId: string,
  userId: string
): Promise<Record<string, Record<string, unknown>>> {
  // Credit check
  const { resolveModel, deductCredits } = await import('@/lib/ai/server');
  const { getProviderAdapterForUser } = await import('@/lib/ai/providers/registry');
  const { isSuperAdmin } = await import('@/lib/ai/credits');

  const isAdmin = await isSuperAdmin(userId);

  if (!isAdmin) {
    const { requireCredits } = await import('@/lib/ai/middleware');
    const creditCheck = await requireCredits(orgId, 'brand_audit', AUDIT_CREDIT_COSTS.website_analysis, AUDIT_CREDIT_COSTS.website_analysis, userId);
    if (creditCheck) throw new Error('Insufficient credits for website analysis');
  }

  // Fetch website content (simple text extraction)
  let websiteContent = '';
  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'SkaleFlow Brand Audit Bot/1.0' },
      signal: AbortSignal.timeout(10000),
    });
    const html = await response.text();
    // Basic HTML to text
    websiteContent = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 10000);
  } catch (error) {
    throw new Error(`Failed to fetch website: ${url}`);
  }

  if (websiteContent.length < 100) {
    throw new Error('Website content too short for analysis');
  }

  const resolved = await resolveModel(orgId, 'brand_audit', undefined, userId);
  const { adapter, usingUserKey } = await getProviderAdapterForUser(resolved.provider, userId);

  const prompt = buildWebsiteAnalysisPrompt(websiteContent, `Website: ${url}`);

  const aiResponse = await adapter.complete({
    systemPrompt: 'You are a brand analyst. Return only valid JSON.',
    messages: [{ role: 'user', content: prompt }],
    maxTokens: 3000,
    temperature: 0.3,
    modelId: resolved.modelId,
  });

  if (!usingUserKey && !isAdmin) {
    const { calculateCreditCost } = await import('@/lib/ai/credits');
    const credits = calculateCreditCost(resolved.id, aiResponse.inputTokens, aiResponse.outputTokens);
    await deductCredits(orgId, userId, credits, null, 'Brand audit website analysis');
  }

  let extracted: Record<string, Record<string, unknown>>;
  try {
    const cleaned = aiResponse.text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    extracted = JSON.parse(cleaned);
  } catch {
    throw new Error('Failed to parse AI website analysis response');
  }

  // Update sections if auditId provided
  if (auditId) {
    const supabase = createServiceClient();
    for (const sectionKey of SECTION_ORDER) {
      const sectionData = extracted[sectionKey];
      if (!sectionData || Object.keys(sectionData).length === 0) continue;

      await supabase
        .from('brand_audit_sections')
        .update({
          data: sectionData as unknown as import('@/types/database').Json,
          data_source: 'website_extracted',
        })
        .eq('audit_id', auditId)
        .eq('section_key', sectionKey);
    }
  }

  return extracted;
}
