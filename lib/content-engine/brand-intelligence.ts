// ============================================================
// V3 Content Engine — Brand Intelligence Reports
// Post-campaign AI analysis: performance, insights, recommendations
// ============================================================

import type { SupabaseClient } from '@supabase/supabase-js';
import { CONTENT_TYPES, type ContentTypeId } from '@/config/content-types';

// ---- Types ----

export interface ContentTypePerformance {
  type_id: number;
  type_name: string;
  total_posts: number;
  avg_engagement_rate: number;
  avg_impressions: number;
  avg_voice_score: number;
  winners: number;
  best_format: string;
}

export interface PlatformPerformance {
  platform: string;
  total_posts: number;
  avg_engagement_rate: number;
  total_impressions: number;
  top_content_type: number;
}

export interface CampaignReportData {
  campaign_id: string;
  campaign_name: string;
  objective: string;
  date_range: { start: string; end: string };
  total_posts: number;
  published_posts: number;
  avg_engagement_rate: number;
  total_impressions: number;
  total_winners: number;
  content_type_performance: ContentTypePerformance[];
  platform_performance: PlatformPerformance[];
  top_posts: Array<{ id: string; topic: string; engagement_rate: number; impressions: number }>;
  recommendations: string[];
  generated_at: string;
}

// ---- Main functions ----

/**
 * Generate a brand intelligence report for a campaign.
 */
export async function generateCampaignReport(
  supabase: SupabaseClient,
  campaignId: string
): Promise<CampaignReportData | null> {
  // Get campaign
  const { data: campaign } = await supabase
    .from('campaigns')
    .select('id, name, objective, objective_category, start_date, end_date, organization_id')
    .eq('id', campaignId)
    .single();

  if (!campaign) return null;

  // Get published posts
  const { data: posts } = await supabase
    .from('content_posts')
    .select('id, content_type, content_type_name, format, platform, topic, hook, brand_voice_score, performance, is_winner, status, published_at')
    .eq('campaign_id', campaignId);

  if (!posts) return null;

  const published = posts.filter(p => p.status === 'published');
  const allPerf = published.filter(p => p.performance && Object.keys(p.performance as object).length > 0);

  // Content type performance
  const typeMap: Record<number, { posts: any[]; winners: number; formats: Record<string, number> }> = {};
  for (const p of published) {
    if (!typeMap[p.content_type]) {
      typeMap[p.content_type] = { posts: [], winners: 0, formats: {} };
    }
    typeMap[p.content_type].posts.push(p);
    if (p.is_winner) typeMap[p.content_type].winners++;
    typeMap[p.content_type].formats[p.format] = (typeMap[p.content_type].formats[p.format] || 0) + 1;
  }

  const contentTypePerformance: ContentTypePerformance[] = Object.entries(typeMap).map(([typeId, data]) => {
    const ct = CONTENT_TYPES[parseInt(typeId) as ContentTypeId];
    const engRates = data.posts.map(p => (p.performance as any)?.engagement_rate || 0);
    const impressions = data.posts.map(p => (p.performance as any)?.impressions || 0);
    const voiceScores = data.posts.map(p => p.brand_voice_score || 0).filter(v => v > 0);
    const bestFormat = Object.entries(data.formats).sort(([, a], [, b]) => b - a)[0]?.[0] || '';

    return {
      type_id: parseInt(typeId),
      type_name: ct?.name || `Type ${typeId}`,
      total_posts: data.posts.length,
      avg_engagement_rate: avg(engRates),
      avg_impressions: avg(impressions),
      avg_voice_score: voiceScores.length > 0 ? avg(voiceScores) : 0,
      winners: data.winners,
      best_format: bestFormat,
    };
  });

  // Platform performance
  const platMap: Record<string, { posts: any[]; typeCounts: Record<number, number> }> = {};
  for (const p of published) {
    if (!platMap[p.platform]) platMap[p.platform] = { posts: [], typeCounts: {} };
    platMap[p.platform].posts.push(p);
    platMap[p.platform].typeCounts[p.content_type] = (platMap[p.platform].typeCounts[p.content_type] || 0) + 1;
  }

  const platformPerformance: PlatformPerformance[] = Object.entries(platMap).map(([platform, data]) => {
    const engRates = data.posts.map(p => (p.performance as any)?.engagement_rate || 0);
    const impressions = data.posts.map(p => (p.performance as any)?.impressions || 0);
    const topType = Object.entries(data.typeCounts).sort(([, a], [, b]) => b - a)[0];

    return {
      platform,
      total_posts: data.posts.length,
      avg_engagement_rate: avg(engRates),
      total_impressions: sum(impressions),
      top_content_type: topType ? parseInt(topType[0]) : 1,
    };
  });

  // Top posts
  const topPosts = [...allPerf]
    .sort((a, b) => ((b.performance as any)?.engagement_rate || 0) - ((a.performance as any)?.engagement_rate || 0))
    .slice(0, 5)
    .map(p => ({
      id: p.id,
      topic: p.topic || 'Untitled',
      engagement_rate: (p.performance as any)?.engagement_rate || 0,
      impressions: (p.performance as any)?.impressions || 0,
    }));

  // Generate recommendations
  const recommendations = generateRecommendations(contentTypePerformance, platformPerformance, campaign.objective);

  // Overall stats
  const allEngRates = allPerf.map(p => (p.performance as any)?.engagement_rate || 0);
  const allImpressions = allPerf.map(p => (p.performance as any)?.impressions || 0);

  const report: CampaignReportData = {
    campaign_id: campaign.id,
    campaign_name: campaign.name,
    objective: campaign.objective,
    date_range: { start: campaign.start_date, end: campaign.end_date || '' },
    total_posts: posts.length,
    published_posts: published.length,
    avg_engagement_rate: avg(allEngRates),
    total_impressions: sum(allImpressions),
    total_winners: published.filter(p => p.is_winner).length,
    content_type_performance: contentTypePerformance,
    platform_performance: platformPerformance,
    top_posts: topPosts,
    recommendations,
    generated_at: new Date().toISOString(),
  };

  // Store in DB
  await supabase.from('brand_intelligence_reports').insert({
    campaign_id: campaignId,
    organization_id: campaign.organization_id,
    content_type_performance: contentTypePerformance,
    format_performance: platformPerformance,
    next_campaign_recommendation: { recommendations },
    generated_at: new Date().toISOString(),
  });

  return report;
}

// ---- Recommendation generator ----

function generateRecommendations(
  typePerf: ContentTypePerformance[],
  platPerf: PlatformPerformance[],
  objective: string
): string[] {
  const recs: string[] = [];

  // Best/worst content type
  const sorted = [...typePerf].sort((a, b) => b.avg_engagement_rate - a.avg_engagement_rate);
  if (sorted.length >= 2) {
    const best = sorted[0];
    const worst = sorted[sorted.length - 1];
    recs.push(
      `${best.type_name} (T${best.type_id}) is your best-performing content type at ${(best.avg_engagement_rate * 100).toFixed(1)}% engagement rate. Consider increasing its share in your next campaign.`
    );
    if (worst.avg_engagement_rate < best.avg_engagement_rate * 0.5 && worst.total_posts >= 2) {
      recs.push(
        `${worst.type_name} (T${worst.type_id}) is underperforming at ${(worst.avg_engagement_rate * 100).toFixed(1)}% ER. Consider reducing its ratio or testing different formats.`
      );
    }
  }

  // Best format per winning type
  if (sorted.length > 0 && sorted[0].best_format) {
    recs.push(
      `Your best content type performs best in ${sorted[0].best_format} format. Double down on this combination.`
    );
  }

  // Platform insights
  const platSorted = [...platPerf].sort((a, b) => b.avg_engagement_rate - a.avg_engagement_rate);
  if (platSorted.length >= 2) {
    const bestPlat = platSorted[0];
    recs.push(
      `${bestPlat.platform} is your strongest platform with ${(bestPlat.avg_engagement_rate * 100).toFixed(1)}% avg ER. Consider increasing posting frequency there.`
    );
  }

  // Winner insights
  const winnersTypes = typePerf.filter(t => t.winners > 0).sort((a, b) => b.winners - a.winners);
  if (winnersTypes.length > 0) {
    recs.push(
      `Most winners came from ${winnersTypes[0].type_name} content. This type resonates most with your audience for the ${objective} objective.`
    );
  }

  return recs;
}

// ---- Helpers ----

function avg(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((s, v) => s + v, 0) / arr.length;
}

function sum(arr: number[]): number {
  return arr.reduce((s, v) => s + v, 0);
}
