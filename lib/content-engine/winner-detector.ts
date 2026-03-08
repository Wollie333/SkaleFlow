// ============================================================
// V3 Content Engine — Winner Detector
// Identifies top-performing posts across 5 winner categories
// ============================================================

import type { SupabaseClient } from '@supabase/supabase-js';

// ---- Types ----

export type WinnerCategory = 'awareness' | 'engagement' | 'traffic' | 'conversion' | 'viral';

interface PostPerformance {
  id: string;
  campaign_id: string;
  adset_id: string;
  organization_id: string;
  content_type: number;
  format: string;
  platform: string;
  scheduled_date: string | null;
  scheduled_time: string | null;
  hook: string | null;
  performance: Record<string, number>;
  is_winner: boolean;
}

interface WinnerResult {
  postId: string;
  category: WinnerCategory;
  metricValue: number;
  baselineValue: number;
  multiplier: number;
}

// ---- Thresholds ----

const WINNER_THRESHOLDS: Record<WinnerCategory, {
  metrics: string[];
  percentile: number;     // top X% of org posts
  minMultiplier: number;  // minimum multiplier over baseline
}> = {
  awareness: {
    metrics: ['impressions', 'reach', 'follower_change'],
    percentile: 10,
    minMultiplier: 2.5,
  },
  engagement: {
    metrics: ['engagement_rate', 'comments', 'shares', 'saves'],
    percentile: 10,
    minMultiplier: 2.5,
  },
  traffic: {
    metrics: ['clicks', 'link_clicks'],
    percentile: 10,
    minMultiplier: 2.5,
  },
  conversion: {
    metrics: ['conversions', 'booking_rate'],
    percentile: 10,
    minMultiplier: 2.5,
  },
  viral: {
    metrics: ['shares', 'reach'],
    percentile: 5,
    minMultiplier: 4.0,
  },
};

// ---- Main detector ----

/**
 * Scans published posts for an organization and flags winners.
 * Call this daily via cron or after analytics sync.
 */
export async function detectWinners(
  supabase: SupabaseClient,
  organizationId: string
): Promise<WinnerResult[]> {
  // Get all published posts with performance data
  const { data: posts, error } = await supabase
    .from('content_posts')
    .select('id, campaign_id, adset_id, organization_id, content_type, format, platform, scheduled_date, scheduled_time, hook, performance, is_winner')
    .eq('organization_id', organizationId)
    .eq('status', 'published')
    .not('performance', 'eq', '{}');

  if (error || !posts || posts.length < 5) return []; // Need minimum 5 posts for meaningful comparison

  const results: WinnerResult[] = [];

  for (const [category, threshold] of Object.entries(WINNER_THRESHOLDS) as [WinnerCategory, typeof WINNER_THRESHOLDS[WinnerCategory]][]) {
    const winners = detectCategoryWinners(posts as PostPerformance[], category, threshold);
    results.push(...winners);
  }

  // Write winners to DB
  for (const result of results) {
    const post = (posts as PostPerformance[]).find(p => p.id === result.postId);
    if (!post || post.is_winner) continue; // Already a winner

    // Update post
    await supabase
      .from('content_posts')
      .update({
        is_winner: true,
        winner_category: result.category,
        updated_at: new Date().toISOString(),
      })
      .eq('id', result.postId);

    // Add to winner pool
    const scheduledDate = post.scheduled_date ? new Date(post.scheduled_date) : null;
    const dayName = scheduledDate
      ? ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][scheduledDate.getDay()]
      : null;

    await supabase.from('winner_pool').insert({
      post_id: result.postId,
      campaign_id: post.campaign_id,
      organization_id: organizationId,
      winner_category: result.category,
      performance_snapshot: post.performance,
      hook_pattern: post.hook,
      content_type: post.content_type,
      format: post.format,
      posting_time: post.scheduled_time,
      posting_day: dayName,
    });
  }

  return results;
}

function detectCategoryWinners(
  posts: PostPerformance[],
  category: WinnerCategory,
  threshold: typeof WINNER_THRESHOLDS[WinnerCategory]
): WinnerResult[] {
  const results: WinnerResult[] = [];

  for (const metric of threshold.metrics) {
    // Get all values for this metric
    const values = posts
      .map(p => ({ id: p.id, campaign_id: p.campaign_id, value: (p.performance?.[metric] as number) || 0 }))
      .filter(v => v.value > 0)
      .sort((a, b) => b.value - a.value);

    if (values.length < 5) continue;

    // Calculate baseline (median)
    const mid = Math.floor(values.length / 2);
    const baseline = values.length % 2 === 0
      ? (values[mid - 1].value + values[mid].value) / 2
      : values[mid].value;

    if (baseline <= 0) continue;

    // Find top X percentile
    const topN = Math.max(1, Math.ceil(values.length * threshold.percentile / 100));
    const topPosts = values.slice(0, topN);

    for (const top of topPosts) {
      const multiplier = top.value / baseline;
      if (multiplier >= threshold.minMultiplier) {
        // Check not already flagged
        if (!results.some(r => r.postId === top.id)) {
          results.push({
            postId: top.id,
            category,
            metricValue: top.value,
            baselineValue: baseline,
            multiplier,
          });
        }
      }
    }
  }

  return results;
}

/**
 * Get winner statistics for an organization.
 */
export async function getWinnerStats(
  supabase: SupabaseClient,
  organizationId: string
): Promise<Record<WinnerCategory, number>> {
  const { data, error } = await supabase
    .from('winner_pool')
    .select('winner_category')
    .eq('organization_id', organizationId);

  const stats: Record<WinnerCategory, number> = {
    awareness: 0,
    engagement: 0,
    traffic: 0,
    conversion: 0,
    viral: 0,
  };

  if (data) {
    for (const row of data) {
      const cat = row.winner_category as WinnerCategory;
      if (stats[cat] !== undefined) stats[cat]++;
    }
  }

  return stats;
}
