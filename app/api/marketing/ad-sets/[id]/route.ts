import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { Json } from '@/types/database';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  const { data: adSet, error } = await supabase
    .from('ad_sets')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !adSet) return NextResponse.json({ error: 'Ad set not found' }, { status: 404 });

  // Verify membership
  const { data: member } = await supabase
    .from('org_members')
    .select('role')
    .eq('organization_id', adSet.organization_id)
    .eq('user_id', user.id)
    .single();

  if (!member) return NextResponse.json({ error: 'Not a member of this organization' }, { status: 403 });

  return NextResponse.json(adSet);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  const { data: adSet } = await supabase
    .from('ad_sets')
    .select('id, organization_id')
    .eq('id', id)
    .single();

  if (!adSet) return NextResponse.json({ error: 'Ad set not found' }, { status: 404 });

  // Verify admin/owner
  const { data: member } = await supabase
    .from('org_members')
    .select('role')
    .eq('organization_id', adSet.organization_id)
    .eq('user_id', user.id)
    .single();

  if (!member || !['owner', 'admin'].includes(member.role)) {
    return NextResponse.json({ error: 'Only owners and admins can update ad sets' }, { status: 403 });
  }

  const body = await request.json();
  const updateData: Record<string, any> = { updated_at: new Date().toISOString() };

  if (body.name !== undefined) updateData.name = body.name;
  if (body.targetingConfig !== undefined) updateData.targeting_config = body.targetingConfig as unknown as Json;
  if (body.targeting_config !== undefined) updateData.targeting_config = body.targeting_config as unknown as Json;
  if (body.placements !== undefined) updateData.placements = body.placements;
  if (body.biddingStrategy !== undefined) updateData.bidding_strategy = body.biddingStrategy;
  if (body.bidding_strategy !== undefined) updateData.bidding_strategy = body.bidding_strategy;
  if (body.bidAmountCents !== undefined) updateData.bid_amount_cents = body.bidAmountCents;
  if (body.bid_amount_cents !== undefined) updateData.bid_amount_cents = body.bid_amount_cents;
  if (body.budgetType !== undefined) updateData.budget_type = body.budgetType;
  if (body.budget_type !== undefined) updateData.budget_type = body.budget_type;
  if (body.budgetCents !== undefined) updateData.budget_cents = body.budgetCents;
  if (body.budget_cents !== undefined) updateData.budget_cents = body.budget_cents;
  if (body.status !== undefined) updateData.status = body.status;

  const { data: updated, error } = await supabase
    .from('ad_sets')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(updated);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  const { data: adSet } = await supabase
    .from('ad_sets')
    .select('id, organization_id')
    .eq('id', id)
    .single();

  if (!adSet) return NextResponse.json({ error: 'Ad set not found' }, { status: 404 });

  // Verify admin/owner
  const { data: member } = await supabase
    .from('org_members')
    .select('role')
    .eq('organization_id', adSet.organization_id)
    .eq('user_id', user.id)
    .single();

  if (!member || !['owner', 'admin'].includes(member.role)) {
    return NextResponse.json({ error: 'Only owners and admins can delete ad sets' }, { status: 403 });
  }

  const { error } = await supabase
    .from('ad_sets')
    .delete()
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
