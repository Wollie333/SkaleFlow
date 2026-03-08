// Consistency Scorer — Calculates platform-level and cross-platform consistency scores
// 5 dimensions per platform, 5 factors for cross-platform consistency

import { createServiceClient } from '@/lib/supabase/server';
import { readBrandOutputsForPresence } from './brand-variable-reader';
import type { PlatformKey, ConsistencyScore, PlatformScore, ConsistencyFlag } from '@/types/presence';

/**
 * Calculate completion/quality score for a single platform (0-100).
 * Dimensions: Completeness (30%), Brand Alignment (25%), ICP Relevance (20%),
 * CTA Clarity (15%), Voice Consistency (10%)
 */
export async function calculatePlatformScore(
  orgId: string,
  platformKey: PlatformKey
): Promise<PlatformScore> {
  const supabase = createServiceClient();
  const brandOutputs = await readBrandOutputsForPresence(orgId);

  // Get all presence outputs for this platform
  const prefix = getPlatformPrefix(platformKey);
  const { data: outputs } = await supabase
    .from('presence_outputs')
    .select('output_key, output_value, is_locked')
    .eq('organization_id', orgId)
    .like('output_key', `${prefix}%`);

  const outputMap: Record<string, unknown> = {};
  for (const o of outputs || []) {
    outputMap[o.output_key] = o.output_value;
  }

  const gaps: ConsistencyFlag[] = [];

  // 1. Completeness (30%) — are all required fields filled?
  const requiredFields = getRequiredFields(platformKey);
  const filledRequired = requiredFields.filter(f => outputMap[f] && String(outputMap[f]).trim().length > 0);
  const completeness = requiredFields.length > 0
    ? Math.round((filledRequired.length / requiredFields.length) * 100)
    : 0;

  if (completeness < 100) {
    const missing = requiredFields.filter(f => !outputMap[f] || String(outputMap[f]).trim().length === 0);
    gaps.push({
      severity: completeness < 50 ? 'critical' : 'warning',
      field: 'completeness',
      message: `${missing.length} required field(s) incomplete`,
      recommendation: `Complete: ${missing.join(', ')}`,
    });
  }

  // 2. Brand Alignment (25%) — does copy reflect brand positioning?
  const brandAlignment = scoreBrandAlignment(outputMap, brandOutputs, platformKey);
  if (brandAlignment < 70) {
    gaps.push({
      severity: 'warning',
      field: 'brand_alignment',
      message: 'Profile copy doesn\'t strongly reflect brand positioning',
      recommendation: 'Ensure your one-liner and category claim appear in your profile copy',
    });
  }

  // 3. ICP Relevance (20%) — does profile speak to ideal client?
  const icpRelevance = scoreICPRelevance(outputMap, brandOutputs);
  if (icpRelevance < 70) {
    gaps.push({
      severity: 'warning',
      field: 'icp_relevance',
      message: 'Profile doesn\'t clearly speak to your ideal client',
      recommendation: 'Include language that addresses your ICP\'s pain points and desires',
    });
  }

  // 4. CTA Clarity (15%) — is there a clear call to action?
  const ctaClarity = scoreCTAClarity(outputMap, platformKey);
  if (ctaClarity < 70) {
    gaps.push({
      severity: 'warning',
      field: 'cta_clarity',
      message: 'No clear call to action in profile',
      recommendation: 'Add a specific, singular CTA (book a call, download resource, visit website)',
    });
  }

  // 5. Voice Consistency (10%) — does tone match brand?
  const voiceConsistency = scoreVoiceConsistency(outputMap, brandOutputs);

  const score = Math.round(
    completeness * 0.30 +
    brandAlignment * 0.25 +
    icpRelevance * 0.20 +
    ctaClarity * 0.15 +
    voiceConsistency * 0.10
  );

  return {
    platformKey,
    score,
    dimensions: {
      completeness,
      brand_alignment: brandAlignment,
      icp_relevance: icpRelevance,
      cta_clarity: ctaClarity,
      voice_consistency: voiceConsistency,
    },
    gaps,
  };
}

/**
 * Calculate cross-platform consistency score (0-100).
 * Factors: Headline/Bio Alignment (35%), CTA Consistency (25%),
 * Category Claim (20%), Visual Identity (10%), Tone Match (10%)
 */
export async function calculateConsistencyScore(orgId: string): Promise<ConsistencyScore> {
  const supabase = createServiceClient();
  const brandOutputs = await readBrandOutputsForPresence(orgId);

  // Get active platforms
  const { data: platforms } = await supabase
    .from('presence_platforms')
    .select('platform_key')
    .eq('organization_id', orgId)
    .eq('is_active', true);

  const activePlatforms = (platforms || []).map(p => p.platform_key as PlatformKey);

  // Get all presence outputs
  const { data: allOutputs } = await supabase
    .from('presence_outputs')
    .select('output_key, output_value')
    .eq('organization_id', orgId);

  const outputMap: Record<string, unknown> = {};
  for (const o of allOutputs || []) {
    outputMap[o.output_key] = o.output_value;
  }

  // Calculate individual platform scores
  const platformScores: PlatformScore[] = [];
  for (const pk of activePlatforms) {
    const score = await calculatePlatformScore(orgId, pk);
    platformScores.push(score);
  }

  // Cross-platform consistency dimensions
  const headlineBioAlignment = scoreHeadlineBioAlignment(outputMap, activePlatforms, brandOutputs);
  const ctaConsistency = scoreCTACrossPlatform(outputMap, activePlatforms);
  const categoryClaim = scoreCategoryClaim(outputMap, activePlatforms, brandOutputs);
  const visualIdentity = scoreVisualIdentity(outputMap, activePlatforms, brandOutputs);
  const toneMatch = scoreToneMatch(outputMap, activePlatforms, brandOutputs);

  const overall = Math.round(
    headlineBioAlignment * 0.35 +
    ctaConsistency * 0.25 +
    categoryClaim * 0.20 +
    visualIdentity * 0.10 +
    toneMatch * 0.10
  );

  // Update org with consistency score
  await supabase
    .from('organizations')
    .update({ presence_consistency_score: overall })
    .eq('id', orgId);

  return {
    overall,
    dimensions: {
      headline_bio_alignment: headlineBioAlignment,
      cta_consistency: ctaConsistency,
      category_claim: categoryClaim,
      visual_identity: visualIdentity,
      tone_match: toneMatch,
    },
    platformScores,
  };
}

// ─── Scoring Helpers ────────────────────────────────────────────────────────

function getPlatformPrefix(key: PlatformKey): string {
  const prefixMap: Record<PlatformKey, string> = {
    linkedin: 'linkedin_',
    facebook: 'facebook_',
    instagram: 'instagram_',
    google_my_business: 'gmb_',
    tiktok: 'tiktok_',
    youtube: 'youtube_',
    twitter_x: 'twitter_',
    pinterest: 'pinterest_',
  };
  return prefixMap[key];
}

function getRequiredFields(key: PlatformKey): string[] {
  const requiredMap: Record<PlatformKey, string[]> = {
    linkedin: ['linkedin_headline', 'linkedin_about_full', 'linkedin_cta_primary'],
    facebook: ['facebook_page_name', 'facebook_about_short', 'facebook_cta_button'],
    instagram: ['instagram_bio', 'instagram_link_bio_strategy'],
    google_my_business: ['gmb_primary_category', 'gmb_description', 'gmb_service_areas'],
    tiktok: ['tiktok_bio', 'tiktok_username'],
    youtube: ['youtube_channel_description', 'youtube_channel_name'],
    twitter_x: ['twitter_bio'],
    pinterest: ['pinterest_bio'],
  };
  return requiredMap[key] || [];
}

function scoreBrandAlignment(
  outputs: Record<string, unknown>,
  brandOutputs: Record<string, unknown>,
  _platformKey: PlatformKey
): number {
  const brandName = String(brandOutputs.brand_name || '').toLowerCase();
  const oneLiner = String(brandOutputs.brand_one_liner || '').toLowerCase();
  const category = String(brandOutputs.category_name || '').toLowerCase();

  const allText = Object.values(outputs).map(v => String(v).toLowerCase()).join(' ');

  let score = 50; // base
  if (brandName && allText.includes(brandName)) score += 15;
  if (oneLiner && containsSubstring(allText, oneLiner, 0.5)) score += 20;
  if (category && allText.includes(category)) score += 15;

  return Math.min(100, score);
}

function scoreICPRelevance(
  outputs: Record<string, unknown>,
  brandOutputs: Record<string, unknown>
): number {
  const icpName = String(brandOutputs.icp_name || '').toLowerCase();
  const painPoints = String(brandOutputs.icp_pain_points || '').toLowerCase();

  const allText = Object.values(outputs).map(v => String(v).toLowerCase()).join(' ');

  let score = 60;
  if (icpName && allText.includes(icpName)) score += 20;
  if (painPoints && containsSubstring(allText, painPoints, 0.3)) score += 20;

  return Math.min(100, score);
}

function scoreCTAClarity(outputs: Record<string, unknown>, platformKey: PlatformKey): number {
  const ctaFields: Record<PlatformKey, string[]> = {
    linkedin: ['linkedin_cta_primary'],
    facebook: ['facebook_cta_button'],
    instagram: ['instagram_link_bio_strategy', 'instagram_link_bio_urls'],
    google_my_business: ['gmb_services_list'],
    tiktok: ['tiktok_bio'],
    youtube: ['youtube_channel_description'],
    twitter_x: ['twitter_bio'],
    pinterest: ['pinterest_bio'],
  };

  const fields = ctaFields[platformKey] || [];
  const hasCTA = fields.some(f => outputs[f] && String(outputs[f]).trim().length > 0);

  return hasCTA ? 85 : 30;
}

function scoreVoiceConsistency(
  outputs: Record<string, unknown>,
  brandOutputs: Record<string, unknown>
): number {
  // Simple heuristic — check if tone descriptors appear in copy
  const toneDescriptors = String(brandOutputs.tone_descriptors || '').toLowerCase();
  if (!toneDescriptors) return 70; // neutral if no tone defined

  const allText = Object.values(outputs).map(v => String(v).toLowerCase()).join(' ');
  const toneWords = toneDescriptors.split(',').map(t => t.trim()).filter(Boolean);
  const matches = toneWords.filter(w => allText.includes(w));

  return Math.min(100, 50 + (matches.length / Math.max(toneWords.length, 1)) * 50);
}

function scoreHeadlineBioAlignment(
  outputs: Record<string, unknown>,
  platforms: PlatformKey[],
  brandOutputs: Record<string, unknown>
): number {
  const oneLiner = String(brandOutputs.brand_one_liner || '').toLowerCase();
  if (!oneLiner) return 60;

  const bioFields: Partial<Record<PlatformKey, string>> = {
    linkedin: 'linkedin_headline',
    facebook: 'facebook_about_short',
    instagram: 'instagram_bio',
    tiktok: 'tiktok_bio',
    youtube: 'youtube_channel_description',
    twitter_x: 'twitter_bio',
  };

  let matches = 0;
  let total = 0;
  for (const pk of platforms) {
    const field = bioFields[pk];
    if (!field) continue;
    total++;
    const value = String(outputs[field] || '').toLowerCase();
    if (containsSubstring(value, oneLiner, 0.4)) matches++;
  }

  return total > 0 ? Math.round((matches / total) * 100) : 60;
}

function scoreCTACrossPlatform(
  outputs: Record<string, unknown>,
  platforms: PlatformKey[]
): number {
  const ctaFields: Partial<Record<PlatformKey, string>> = {
    linkedin: 'linkedin_cta_primary',
    facebook: 'facebook_cta_button',
    instagram: 'instagram_link_bio_urls',
  };

  const ctas: string[] = [];
  for (const pk of platforms) {
    const field = ctaFields[pk];
    if (field && outputs[field]) {
      ctas.push(String(outputs[field]).toLowerCase());
    }
  }

  if (ctas.length <= 1) return 80;

  // Check similarity between CTAs
  const first = ctas[0];
  const similar = ctas.filter(c => containsSubstring(c, first, 0.3));
  return Math.round((similar.length / ctas.length) * 100);
}

function scoreCategoryClaim(
  outputs: Record<string, unknown>,
  platforms: PlatformKey[],
  brandOutputs: Record<string, unknown>
): number {
  const category = String(brandOutputs.category_name || '').toLowerCase();
  if (!category) return 60;

  let mentions = 0;
  let total = 0;
  for (const pk of platforms) {
    const prefix = getPlatformPrefix(pk);
    const platformOutputs = Object.entries(outputs)
      .filter(([k]) => k.startsWith(prefix))
      .map(([, v]) => String(v).toLowerCase())
      .join(' ');

    if (platformOutputs.length > 0) {
      total++;
      if (platformOutputs.includes(category)) mentions++;
    }
  }

  return total > 0 ? Math.round((mentions / total) * 100) : 60;
}

function scoreVisualIdentity(
  _outputs: Record<string, unknown>,
  _platforms: PlatformKey[],
  _brandOutputs: Record<string, unknown>
): number {
  // Visual identity is harder to score programmatically
  // Return a neutral score — the AI audit in Phase 7 handles this qualitatively
  return 70;
}

function scoreToneMatch(
  outputs: Record<string, unknown>,
  platforms: PlatformKey[],
  brandOutputs: Record<string, unknown>
): number {
  const toneDescriptors = String(brandOutputs.tone_descriptors || '').toLowerCase();
  if (!toneDescriptors) return 70;

  const toneWords = toneDescriptors.split(',').map(t => t.trim()).filter(Boolean);
  let totalScore = 0;
  let count = 0;

  for (const pk of platforms) {
    const prefix = getPlatformPrefix(pk);
    const platformText = Object.entries(outputs)
      .filter(([k]) => k.startsWith(prefix))
      .map(([, v]) => String(v).toLowerCase())
      .join(' ');

    if (platformText.length > 0) {
      const matches = toneWords.filter(w => platformText.includes(w));
      totalScore += (matches.length / Math.max(toneWords.length, 1)) * 100;
      count++;
    }
  }

  return count > 0 ? Math.round(totalScore / count) : 70;
}

/**
 * Simple substring containment check with a threshold.
 * Checks if enough words from `needle` appear in `haystack`.
 */
function containsSubstring(haystack: string, needle: string, threshold: number): boolean {
  if (!needle) return false;
  const words = needle.split(/\s+/).filter(w => w.length > 3);
  if (words.length === 0) return false;
  const matches = words.filter(w => haystack.includes(w));
  return (matches.length / words.length) >= threshold;
}
