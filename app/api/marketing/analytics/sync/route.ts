import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { getAdAccountTokens } from '@/lib/marketing/auth';
import { getAdPlatformAdapter } from '@/lib/marketing/platforms/registry';
import type { AdPlatform, AdInsights } from '@/lib/marketing/types';
import type { Json } from '@/types/database';

// Allow up to 60s for fetching insights from multiple campaigns
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const serviceClient = createServiceClient();

  // Get all active campaigns that have been synced to a platform
  const { data: campaigns, error } = await serviceClient
    .from('ad_campaigns')
    .select('id, organization_id, platform, platform_campaign_id, ad_account_id')
    .eq('status', 'active')
    .not('platform_campaign_id', 'is', null);

  if (error || !campaigns) {
    return NextResponse.json({ error: 'Failed to fetch campaigns', details: error?.message }, { status: 500 });
  }

  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  let synced = 0;
  let failed = 0;

  // Group campaigns by org + platform to minimize token fetches
  const grouped: Record<string, typeof campaigns> = {};
  for (const c of campaigns) {
    const key = `${c.organization_id}:${c.platform}`;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(c);
  }

  for (const [key, orgCampaigns] of Object.entries(grouped)) {
    const [orgId, platform] = key.split(':');

    const accountData = await getAdAccountTokens(orgId, platform as AdPlatform);
    if (!accountData) {
      console.warn(`[AD-ANALYTICS-SYNC] No active ${platform} account for org ${orgId}`);
      failed += orgCampaigns.length;
      continue;
    }

    let adapter;
    try {
      adapter = getAdPlatformAdapter(platform as AdPlatform);
    } catch {
      console.warn(`[AD-ANALYTICS-SYNC] No adapter for platform: ${platform}`);
      failed += orgCampaigns.length;
      continue;
    }

    for (const campaign of orgCampaigns) {
      try {
        // Get creatives for this campaign that have been synced
        const { data: creatives } = await serviceClient
          .from('ad_creatives')
          .select('id, platform_ad_id')
          .eq('campaign_id', campaign.id)
          .not('platform_ad_id', 'is', null);

        if (!creatives || creatives.length === 0) {
          // No synced creatives — get campaign-level insights and store with a placeholder
          const insights: AdInsights = await adapter.getCampaignInsights(
            accountData.tokens,
            campaign.platform_campaign_id!,
            { since: yesterday, until: today }
          );

          // We need a creative_id for ad_metrics — find any creative for this campaign
          const { data: anyCreative } = await serviceClient
            .from('ad_creatives')
            .select('id')
            .eq('campaign_id', campaign.id)
            .limit(1)
            .single();

          if (anyCreative) {
            await serviceClient
              .from('ad_metrics')
              .upsert(
                {
                  creative_id: anyCreative.id,
                  campaign_id: campaign.id,
                  date: today,
                  impressions: insights.impressions,
                  reach: insights.reach,
                  frequency: insights.frequency,
                  clicks: insights.clicks,
                  likes: insights.likes,
                  comments: insights.comments,
                  shares: insights.shares,
                  saves: insights.saves,
                  video_views: insights.videoViews,
                  video_3s_views: insights.video3sViews,
                  ctr: insights.ctr,
                  engagement_rate: insights.engagementRate,
                  conversions: insights.conversions,
                  conversion_value_cents: insights.conversionValueCents,
                  spend_cents: insights.spendCents,
                  currency: insights.currency,
                  cpc_cents: insights.cpcCents,
                  cpm_cents: insights.cpmCents,
                  cpa_cents: insights.cpaCents,
                  roas: insights.roas,
                  metadata: (insights.metadata || {}) as unknown as Json,
                  synced_at: new Date().toISOString(),
                },
                { onConflict: 'creative_id,date' }
              );
          }

          synced++;
        } else {
          // Fetch per-creative insights
          for (const creative of creatives) {
            try {
              const insights = await adapter.getAdInsights(
                accountData.tokens,
                creative.platform_ad_id!,
                { since: yesterday, until: today }
              );

              await serviceClient
                .from('ad_metrics')
                .upsert(
                  {
                    creative_id: creative.id,
                    campaign_id: campaign.id,
                    date: today,
                    impressions: insights.impressions,
                    reach: insights.reach,
                    frequency: insights.frequency,
                    clicks: insights.clicks,
                    likes: insights.likes,
                    comments: insights.comments,
                    shares: insights.shares,
                    saves: insights.saves,
                    video_views: insights.videoViews,
                    video_3s_views: insights.video3sViews,
                    ctr: insights.ctr,
                    engagement_rate: insights.engagementRate,
                    conversions: insights.conversions,
                    conversion_value_cents: insights.conversionValueCents,
                    spend_cents: insights.spendCents,
                    currency: insights.currency,
                    cpc_cents: insights.cpcCents,
                    cpm_cents: insights.cpmCents,
                    cpa_cents: insights.cpaCents,
                    roas: insights.roas,
                    metadata: (insights.metadata || {}) as unknown as Json,
                    synced_at: new Date().toISOString(),
                  },
                  { onConflict: 'creative_id,date' }
                );
            } catch (err) {
              console.error(`[AD-ANALYTICS-SYNC] Creative ${creative.id} insight fetch failed:`, err);
            }
          }
          synced++;
        }
      } catch (err) {
        console.error(`[AD-ANALYTICS-SYNC] Failed for campaign ${campaign.id}:`, err);
        failed++;
      }
    }
  }

  console.log(`[AD-ANALYTICS-SYNC] Complete: ${synced} synced, ${failed} failed out of ${campaigns.length} campaigns`);

  return NextResponse.json({
    message: 'Ad analytics sync complete',
    campaignsProcessed: campaigns.length,
    synced,
    failed,
  });
}
