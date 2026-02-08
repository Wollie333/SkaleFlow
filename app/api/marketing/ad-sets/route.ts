import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { Json } from '@/types/database';

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const {
    campaignId,
    name,
    targetingConfig,
    placements,
    biddingStrategy,
    bidAmountCents,
    budgetType,
    budgetCents,
  } = body;

  if (!campaignId || !name) {
    return NextResponse.json({ error: 'campaignId and name are required' }, { status: 400 });
  }

  // Look up campaign to get organization_id
  const { data: campaign } = await supabase
    .from('ad_campaigns')
    .select('id, organization_id')
    .eq('id', campaignId)
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
    return NextResponse.json({ error: 'Only owners and admins can create ad sets' }, { status: 403 });
  }

  const { data: adSet, error } = await supabase
    .from('ad_sets')
    .insert({
      campaign_id: campaignId,
      organization_id: campaign.organization_id,
      name,
      targeting_config: (targetingConfig || {}) as unknown as Json,
      placements: placements || [],
      bidding_strategy: biddingStrategy || 'lowest_cost',
      bid_amount_cents: bidAmountCents || null,
      budget_type: budgetType || null,
      budget_cents: budgetCents || null,
      status: 'draft',
    })
    .select()
    .single();

  if (error) {
    console.error('Failed to create ad set:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(adSet, { status: 201 });
}
