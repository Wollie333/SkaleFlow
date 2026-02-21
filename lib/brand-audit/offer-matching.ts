/**
 * Brand Audit offer matching — matches audit gaps to org's service offers.
 */

import { createServiceClient } from '@/lib/supabase/server';
import { buildRoadmapPrompt } from './prompts';
import { TAG_CATEGORY_MAP, CATEGORY_ORDER, AUDIT_CREDIT_COSTS } from './types';
import type { BrandAuditCategory } from '@/types/database';

interface Offer {
  id: string;
  name: string;
  description: string | null;
  service_tags: string[];
  price_display: string | null;
}

/** Tag-overlap match: returns offers sorted by relevance */
export function findMatchingOffers(category: BrandAuditCategory, offers: Offer[]): Offer[] {
  const targetTags = TAG_CATEGORY_MAP[category] || [];
  if (targetTags.length === 0) return [];

  return offers
    .map((offer) => {
      const overlap = (offer.service_tags || []).filter((t) => targetTags.includes(t)).length;
      return { offer, overlap };
    })
    .filter(({ overlap }) => overlap > 0)
    .sort((a, b) => b.overlap - a.overlap)
    .map(({ offer }) => offer);
}

/** Generate full roadmap with AI descriptions */
export async function generateRoadmap(auditId: string, orgId: string, userId: string) {
  const supabase = createServiceClient();

  // Load scores
  const { data: scores } = await supabase
    .from('brand_audit_scores')
    .select('category, score, rating, actionable_insight')
    .eq('audit_id', auditId)
    .order('score', { ascending: true });

  if (!scores || scores.length === 0) throw new Error('No scores found — run scoring first');

  // Load active offers
  const { data: offers } = await supabase
    .from('offers')
    .select('id, name, description, service_tags, price_display')
    .eq('organization_id', orgId)
    .eq('is_active', true);

  if (!offers || offers.length === 0) {
    throw new Error('No active offers found — add service offers first');
  }

  // AI roadmap generation
  const { resolveModel, deductCredits } = await import('@/lib/ai/server');
  const { getProviderAdapterForUser } = await import('@/lib/ai/providers/registry');
  const { isSuperAdmin } = await import('@/lib/ai/credits');

  const isAdmin = await isSuperAdmin(userId);

  if (!isAdmin) {
    const { requireCredits } = await import('@/lib/ai/middleware');
    const creditCheck = await requireCredits(orgId, 'brand_audit', AUDIT_CREDIT_COSTS.roadmap, AUDIT_CREDIT_COSTS.roadmap, userId);
    if (creditCheck) throw new Error('Insufficient credits for roadmap generation');
  }

  const resolved = await resolveModel(orgId, 'brand_audit', undefined, userId);
  const { adapter, usingUserKey } = await getProviderAdapterForUser(resolved.provider, userId);

  const prompt = buildRoadmapPrompt(scores, offers as Offer[]);

  const response = await adapter.complete({
    systemPrompt: 'You are a brand strategist creating a prioritised improvement roadmap. Return only valid JSON.',
    messages: [{ role: 'user', content: prompt }],
    maxTokens: 2000,
    temperature: 0.4,
    modelId: resolved.modelId,
    jsonMode: true,
  });

  if (!usingUserKey && !isAdmin) {
    const { calculateCreditCost } = await import('@/lib/ai/credits');
    const credits = calculateCreditCost(resolved.id, response.inputTokens, response.outputTokens);
    await deductCredits(orgId, userId, credits, null, 'Brand audit roadmap generation');
  }

  // Parse
  let roadmap: { roadmap: Array<{ category: string; priority: number; offer_name: string | null; relevance_description: string }> };
  try {
    const cleaned = response.text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    roadmap = JSON.parse(cleaned);
  } catch {
    throw new Error('Failed to parse AI roadmap response');
  }

  // Insert offer matches
  for (const item of roadmap.roadmap) {
    const matchedOffer = item.offer_name
      ? (offers as Offer[]).find((o) => o.name.toLowerCase() === item.offer_name!.toLowerCase())
      : null;

    await supabase
      .from('brand_audit_offer_matches')
      .upsert({
        audit_id: auditId,
        audit_category: item.category as any,
        offer_id: matchedOffer?.id || null,
        priority: item.priority,
        relevance_description: item.relevance_description,
      }, { onConflict: 'audit_id,audit_category' });
  }

  // Store roadmap on audit
  await supabase
    .from('brand_audits')
    .update({ priority_roadmap: roadmap.roadmap as unknown as import('@/types/database').Json })
    .eq('id', auditId);

  return roadmap.roadmap;
}
