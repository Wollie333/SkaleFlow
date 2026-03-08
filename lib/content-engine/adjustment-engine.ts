// ============================================================
// V3 Content Engine — Adjustment Engine
// Mid-campaign AI recommendations for ratio/format/schedule changes
// Max 2 recommendations per week per campaign
// ============================================================

import type { SupabaseClient } from '@supabase/supabase-js';
import type { ContentTypeRatio } from '@/config/campaign-objectives';

// ---- Types ----

export type AdjustmentTrigger =
  | 'underperformance'
  | 'content_fatigue'
  | 'format_underperformance'
  | 'scheduling_gap'
  | 'objective_mismatch';

interface AdjustmentRecommendation {
  campaignId: string;
  adsetId: string | null;
  trigger: AdjustmentTrigger;
  title: string;
  description: string;
  recommendation: string;
  currentRatio: ContentTypeRatio | null;
  proposedRatio: ContentTypeRatio | null;
  affectedPostIds: string[];
}

// ---- Config ----

const MAX_ADJUSTMENTS_PER_WEEK = 2;
const MIN_PUBLISHED_POSTS = 5; // Need at least 5 published posts for meaningful analysis
const UNDERPERFORMANCE_THRESHOLD = 0.5; // Below 50% of baseline = underperforming
const FATIGUE_DECLINE_RATE = 0.3; // 30% decline in last 5 posts = fatigue

// ---- Main engine ----

/**
 * Analyze a campaign and generate adjustment recommendations.
 * Call weekly via cron or on-demand.
 */
export async function analyzeAndRecommend(
  supabase: SupabaseClient,
  campaignId: string
): Promise<AdjustmentRecommendation[]> {
  // Check how many adjustments already made this week
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const { count: recentCount } = await supabase
    .from('campaign_adjustments')
    .select('id', { count: 'exact', head: true })
    .eq('campaign_id', campaignId)
    .gt('created_at', weekAgo.toISOString());

  if ((recentCount || 0) >= MAX_ADJUSTMENTS_PER_WEEK) return [];

  // Get campaign data
  const { data: campaign } = await supabase
    .from('campaigns')
    .select('id, organization_id, objective, objective_category, status')
    .eq('id', campaignId)
    .single();

  if (!campaign || campaign.status !== 'active') return [];

  // Get published posts with performance
  const { data: posts } = await supabase
    .from('content_posts')
    .select('id, adset_id, content_type, format, platform, performance, scheduled_date, published_at, status')
    .eq('campaign_id', campaignId)
    .eq('status', 'published')
    .not('performance', 'eq', '{}')
    .order('published_at', { ascending: true });

  if (!posts || posts.length < MIN_PUBLISHED_POSTS) return [];

  // Get adsets
  const { data: adsets } = await supabase
    .from('campaign_adsets')
    .select('id, channel, content_type_ratio, aggressiveness')
    .eq('campaign_id', campaignId);

  const recommendations: AdjustmentRecommendation[] = [];
  const remaining = MAX_ADJUSTMENTS_PER_WEEK - (recentCount || 0);

  // Run each trigger check
  const checks = [
    checkUnderperformance(campaign, posts, adsets || []),
    checkContentFatigue(campaign, posts),
    checkFormatUnderperformance(campaign, posts, adsets || []),
    checkSchedulingGaps(campaign, posts),
  ];

  for (const check of checks) {
    if (recommendations.length >= remaining) break;
    const result = await check;
    if (result) recommendations.push(result);
  }

  // Write recommendations to DB
  for (const rec of recommendations) {
    await supabase.from('campaign_adjustments').insert({
      campaign_id: rec.campaignId,
      adset_id: rec.adsetId,
      organization_id: campaign.organization_id,
      trigger_condition: rec.trigger,
      recommendation_text: rec.recommendation,
      current_ratio: rec.currentRatio,
      proposed_ratio: rec.proposedRatio,
      affected_post_ids: rec.affectedPostIds,
      status: 'pending',
    });
  }

  return recommendations;
}

// ---- Trigger checks ----

async function checkUnderperformance(
  campaign: any,
  posts: any[],
  adsets: any[]
): Promise<AdjustmentRecommendation | null> {
  // Compare recent posts vs earlier posts
  const half = Math.floor(posts.length / 2);
  const earlier = posts.slice(0, half);
  const recent = posts.slice(half);

  const earlierAvg = avgEngagement(earlier);
  const recentAvg = avgEngagement(recent);

  if (earlierAvg <= 0) return null;
  const ratio = recentAvg / earlierAvg;

  if (ratio < UNDERPERFORMANCE_THRESHOLD) {
    // Find which content types are underperforming
    const typePerf = groupByContentType(recent);
    const worstType = Object.entries(typePerf)
      .sort(([, a], [, b]) => a - b)[0];

    return {
      campaignId: campaign.id,
      adsetId: null,
      trigger: 'underperformance',
      title: 'Campaign Underperformance Detected',
      description: `Recent posts are performing ${Math.round(ratio * 100)}% of your earlier average. Content Type ${worstType?.[0] || '?'} is particularly low.`,
      recommendation: `Consider reducing Content Type ${worstType?.[0] || '?'} and increasing your best-performing content types. Review your hooks and topics for freshness.`,
      currentRatio: null,
      proposedRatio: null,
      affectedPostIds: recent.map(p => p.id),
    };
  }

  return null;
}

async function checkContentFatigue(
  campaign: any,
  posts: any[]
): Promise<AdjustmentRecommendation | null> {
  if (posts.length < 10) return null;

  // Check last 5 posts for declining engagement
  const last5 = posts.slice(-5);
  let declining = true;
  for (let i = 1; i < last5.length; i++) {
    const prev = last5[i - 1].performance?.engagement_rate || 0;
    const curr = last5[i].performance?.engagement_rate || 0;
    if (curr >= prev) {
      declining = false;
      break;
    }
  }

  if (!declining) return null;

  const firstER = last5[0].performance?.engagement_rate || 0;
  const lastER = last5[last5.length - 1].performance?.engagement_rate || 0;
  const decline = firstER > 0 ? (firstER - lastER) / firstER : 0;

  if (decline >= FATIGUE_DECLINE_RATE) {
    // Find dominant content type in last 5
    const typeCounts: Record<number, number> = {};
    for (const p of last5) {
      typeCounts[p.content_type] = (typeCounts[p.content_type] || 0) + 1;
    }
    const dominantType = Object.entries(typeCounts).sort(([, a], [, b]) => b - a)[0];

    return {
      campaignId: campaign.id,
      adsetId: null,
      trigger: 'content_fatigue',
      title: 'Content Fatigue Detected',
      description: `Engagement has declined ${Math.round(decline * 100)}% over the last 5 posts. Type ${dominantType?.[0] || '?'} appears ${dominantType?.[1] || 0} times — your audience may need variety.`,
      recommendation: `Mix in different content types. If Type ${dominantType?.[0]} is dominant, try reducing it and adding more variety across the spectrum.`,
      currentRatio: null,
      proposedRatio: null,
      affectedPostIds: last5.map(p => p.id),
    };
  }

  return null;
}

async function checkFormatUnderperformance(
  campaign: any,
  posts: any[],
  adsets: any[]
): Promise<AdjustmentRecommendation | null> {
  // Group posts by format and compare engagement rates
  const formatPerf: Record<string, { total: number; count: number }> = {};
  for (const p of posts) {
    const er = p.performance?.engagement_rate || 0;
    if (!formatPerf[p.format]) formatPerf[p.format] = { total: 0, count: 0 };
    formatPerf[p.format].total += er;
    formatPerf[p.format].count++;
  }

  const formatAvgs = Object.entries(formatPerf)
    .filter(([, v]) => v.count >= 2) // Need at least 2 posts per format
    .map(([format, v]) => ({ format, avg: v.total / v.count, count: v.count }))
    .sort((a, b) => a.avg - b.avg);

  if (formatAvgs.length < 2) return null;

  const worst = formatAvgs[0];
  const best = formatAvgs[formatAvgs.length - 1];

  if (best.avg <= 0) return null;
  const ratio = worst.avg / best.avg;

  if (ratio < 0.4) { // Worst format is less than 40% of best
    return {
      campaignId: campaign.id,
      adsetId: null,
      trigger: 'format_underperformance',
      title: `${worst.format} Format Underperforming`,
      description: `${worst.format} posts average ${(worst.avg * 100).toFixed(1)}% engagement rate vs ${(best.avg * 100).toFixed(1)}% for ${best.format}.`,
      recommendation: `Consider shifting budget from ${worst.format} to ${best.format}. Update your ad set format ratios to reflect what's working.`,
      currentRatio: null,
      proposedRatio: null,
      affectedPostIds: posts.filter(p => p.format === worst.format).map(p => p.id),
    };
  }

  return null;
}

async function checkSchedulingGaps(
  campaign: any,
  posts: any[]
): Promise<AdjustmentRecommendation | null> {
  // Check for gaps longer than 5 days between published posts
  const sorted = [...posts]
    .filter(p => p.published_at)
    .sort((a, b) => new Date(a.published_at).getTime() - new Date(b.published_at).getTime());

  if (sorted.length < 3) return null;

  let maxGap = 0;
  let gapStart = '';
  let gapEnd = '';

  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1].published_at).getTime();
    const curr = new Date(sorted[i].published_at).getTime();
    const gap = (curr - prev) / (1000 * 60 * 60 * 24);
    if (gap > maxGap) {
      maxGap = gap;
      gapStart = sorted[i - 1].published_at;
      gapEnd = sorted[i].published_at;
    }
  }

  if (maxGap > 5) {
    return {
      campaignId: campaign.id,
      adsetId: null,
      trigger: 'scheduling_gap',
      title: `${Math.round(maxGap)}-Day Publishing Gap Detected`,
      description: `There was a ${Math.round(maxGap)}-day gap between posts. Consistent posting is key to algorithmic reach.`,
      recommendation: 'Review your posting schedule and ensure posts are evenly distributed. Consider pre-scheduling content to avoid gaps.',
      currentRatio: null,
      proposedRatio: null,
      affectedPostIds: [],
    };
  }

  return null;
}

// ---- Helpers ----

function avgEngagement(posts: any[]): number {
  if (posts.length === 0) return 0;
  const total = posts.reduce((sum, p) => sum + (p.performance?.engagement_rate || 0), 0);
  return total / posts.length;
}

function groupByContentType(posts: any[]): Record<string, number> {
  const groups: Record<string, { total: number; count: number }> = {};
  for (const p of posts) {
    const key = `T${p.content_type}`;
    if (!groups[key]) groups[key] = { total: 0, count: 0 };
    groups[key].total += p.performance?.engagement_rate || 0;
    groups[key].count++;
  }
  const result: Record<string, number> = {};
  for (const [key, val] of Object.entries(groups)) {
    result[key] = val.count > 0 ? val.total / val.count : 0;
  }
  return result;
}
