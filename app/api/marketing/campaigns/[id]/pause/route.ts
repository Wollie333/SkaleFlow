import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { getAdAccountTokens } from '@/lib/marketing/auth';
import { MetaAdsAdapter } from '@/lib/marketing/platforms/meta-ads';
import type { AdPlatform, AdPlatformAdapter } from '@/lib/marketing/types';

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

  // Get campaign
  const { data: campaign } = await supabase
    .from('ad_campaigns')
    .select('id, organization_id, platform, platform_campaign_id, status')
    .eq('id', id)
    .single();

  if (!campaign) return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });

  // Verify admin/owner
  const { data: member } = await supabase
    .from('org_members')
    .select('role')
    .eq('organization_id', campaign.organization_id)
    .eq('user_id', user.id)
    .single();

  if (!member || !['owner', 'admin'].includes(member.role)) {
    return NextResponse.json({ error: 'Only owners and admins can pause campaigns' }, { status: 403 });
  }

  if (!campaign.platform_campaign_id) {
    return NextResponse.json({ error: 'Campaign has not been synced to platform yet' }, { status: 400 });
  }

  if (campaign.status === 'paused' || campaign.status === 'draft') {
    return NextResponse.json({ error: `Campaign is already ${campaign.status}` }, { status: 400 });
  }

  try {
    const accountData = await getAdAccountTokens(campaign.organization_id, campaign.platform as AdPlatform);
    if (!accountData) {
      return NextResponse.json({ error: 'No active ad account connected' }, { status: 400 });
    }

    const adapter = getAdapter(campaign.platform as AdPlatform);
    await adapter.updateCampaignStatus(accountData.tokens, campaign.platform_campaign_id, 'PAUSED');

    const serviceClient = createServiceClient();
    await serviceClient
      .from('ad_campaigns')
      .update({ status: 'paused', updated_at: new Date().toISOString() })
      .eq('id', id);

    return NextResponse.json({ success: true, status: 'paused' });
  } catch (err) {
    console.error('Failed to pause campaign:', err);
    const message = err instanceof Error ? err.message : 'Failed to pause campaign';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
