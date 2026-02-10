import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { getAdAccountTokens } from '@/lib/marketing/auth';
import { MetaAdsAdapter } from '@/lib/marketing/platforms/meta-ads';
import type { AdPlatform, AdPlatformAdapter, CampaignPayload, AdSetPayload, CreativePayload } from '@/lib/marketing/types';
import type { Json } from '@/types/database';

function getAdapter(platform: AdPlatform): AdPlatformAdapter {
  switch (platform) {
    case 'meta':
      return new MetaAdsAdapter();
    default:
      throw new Error(`Platform adapter not yet implemented: ${platform}`);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const serviceClient = createServiceClient();

  // Get campaign with related data
  const { data: campaign, error: campaignError } = await serviceClient
    .from('ad_campaigns')
    .select('*, ad_sets(*), ad_creatives(*)')
    .eq('id', id)
    .single();

  if (campaignError || !campaign) {
    return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
  }

  // Verify admin/owner
  const { data: member } = await supabase
    .from('org_members')
    .select('role')
    .eq('organization_id', campaign.organization_id)
    .eq('user_id', user.id)
    .single();

  if (!member || !['owner', 'admin'].includes(member.role)) {
    return NextResponse.json({ error: 'Only owners and admins can sync campaigns' }, { status: 403 });
  }

  // Get ad account tokens
  const accountData = await getAdAccountTokens(campaign.organization_id, campaign.platform as AdPlatform);
  if (!accountData) {
    return NextResponse.json({ error: `No active ${campaign.platform} ad account connected. Please connect your ad account first.` }, { status: 400 });
  }

  const adapter = getAdapter(campaign.platform as AdPlatform);
  const { tokens } = accountData;
  const syncResults: { step: string; success: boolean; platformId?: string; error?: string }[] = [];

  try {
    // 1. Sync campaign to platform (if not already synced)
    if (!campaign.platform_campaign_id) {
      const campaignPayload: CampaignPayload = {
        name: campaign.name,
        objective: campaign.objective,
        status: 'PAUSED', // Start paused so user can review on platform
        budgetType: campaign.budget_type as 'daily' | 'lifetime',
        budgetCents: campaign.budget_cents,
        currency: campaign.currency,
        startDate: campaign.start_date || undefined,
        endDate: campaign.end_date || undefined,
        specialAdCategory: campaign.special_ad_category,
      };

      const result = await adapter.createCampaign(tokens, campaignPayload);
      syncResults.push({ step: 'campaign', success: result.success, platformId: result.platformId, error: result.error });

      if (!result.success) {
        await serviceClient
          .from('ad_campaigns')
          .update({ status: 'rejected', compliance_notes: result.error || 'Sync failed', updated_at: new Date().toISOString() })
          .eq('id', id);
        return NextResponse.json({ error: `Failed to create campaign on ${campaign.platform}: ${result.error}`, syncResults }, { status: 500 });
      }

      await serviceClient
        .from('ad_campaigns')
        .update({ platform_campaign_id: result.platformId, updated_at: new Date().toISOString() })
        .eq('id', id);

      campaign.platform_campaign_id = result.platformId!;
    } else {
      syncResults.push({ step: 'campaign', success: true, platformId: campaign.platform_campaign_id });
    }

    // 2. Sync ad sets in draft status
    const adSets = campaign.ad_sets || [];
    for (const adSet of adSets) {
      if (adSet.platform_ad_set_id) {
        syncResults.push({ step: `ad_set:${adSet.id}`, success: true, platformId: adSet.platform_ad_set_id });
        continue;
      }

      const adSetPayload: AdSetPayload = {
        campaignPlatformId: campaign.platform_campaign_id,
        name: adSet.name,
        targetingConfig: (adSet.targeting_config || {}) as any,
        placements: adSet.placements || [],
        biddingStrategy: adSet.bidding_strategy || 'lowest_cost',
        bidAmountCents: adSet.bid_amount_cents || undefined,
        budgetType: adSet.budget_type || undefined,
        budgetCents: adSet.budget_cents || undefined,
      };

      const result = await adapter.createAdSet(tokens, adSetPayload);
      syncResults.push({ step: `ad_set:${adSet.id}`, success: result.success, platformId: result.platformId, error: result.error });

      if (result.success) {
        await serviceClient
          .from('ad_sets')
          .update({ platform_ad_set_id: result.platformId, status: 'pending_review', updated_at: new Date().toISOString() })
          .eq('id', adSet.id);
      }
    }

    // 3. Sync creatives in draft status
    const creatives = campaign.ad_creatives || [];
    for (const creative of creatives) {
      if (creative.platform_creative_id) {
        syncResults.push({ step: `creative:${creative.id}`, success: true, platformId: creative.platform_creative_id });
        continue;
      }

      const creativePayload: CreativePayload = {
        name: creative.name,
        format: creative.format || 'single_image',
        primaryText: creative.primary_text || '',
        headline: creative.headline || undefined,
        description: creative.description || undefined,
        ctaType: creative.cta_type || 'learn_more',
        targetUrl: creative.target_url || '',
        displayLink: creative.display_link || undefined,
      };

      const result = await adapter.createAdCreative(tokens, creativePayload);
      syncResults.push({ step: `creative:${creative.id}`, success: result.success, platformId: result.platformId, error: result.error });

      if (result.success) {
        await serviceClient
          .from('ad_creatives')
          .update({ platform_creative_id: result.platformId, status: 'pending_review', updated_at: new Date().toISOString() })
          .eq('id', creative.id);
      }
    }

    // Update campaign status
    await serviceClient
      .from('ad_campaigns')
      .update({ status: 'pending_review', sync_error: null, updated_at: new Date().toISOString() })
      .eq('id', id);

    return NextResponse.json({ success: true, syncResults });
  } catch (err) {
    console.error('Campaign sync error:', err);
    const message = err instanceof Error ? err.message : 'Sync failed';

    await serviceClient
      .from('ad_campaigns')
      .update({ sync_error: message, updated_at: new Date().toISOString() })
      .eq('id', id);

    return NextResponse.json({ error: message, syncResults }, { status: 500 });
  }
}
