import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = params;

  const { data: campaign, error } = await supabase
    .from('ad_campaigns')
    .select('*, ad_sets(*), ad_creatives(*)')
    .eq('id', id)
    .single();

  if (error || !campaign) {
    return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
  }

  // Verify membership
  const { data: member } = await supabase
    .from('org_members')
    .select('role')
    .eq('organization_id', campaign.organization_id)
    .eq('user_id', user.id)
    .single();

  if (!member) return NextResponse.json({ error: 'Not a member of this organization' }, { status: 403 });

  return NextResponse.json(campaign);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = params;

  // Get campaign to find org
  const { data: campaign } = await supabase
    .from('ad_campaigns')
    .select('id, organization_id')
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
    return NextResponse.json({ error: 'Only owners and admins can update campaigns' }, { status: 403 });
  }

  const body = await request.json();
  const allowedFields = [
    'name', 'objective', 'budget_type', 'budget_cents', 'currency',
    'start_date', 'end_date', 'special_ad_category', 'status',
  ];

  const updateData: Record<string, any> = { updated_at: new Date().toISOString() };
  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      updateData[field] = body[field];
    }
  }
  // Also support camelCase from client
  if (body.budgetType !== undefined) updateData.budget_type = body.budgetType;
  if (body.budgetCents !== undefined) updateData.budget_cents = body.budgetCents;
  if (body.startDate !== undefined) updateData.start_date = body.startDate;
  if (body.endDate !== undefined) updateData.end_date = body.endDate;
  if (body.specialAdCategory !== undefined) updateData.special_ad_category = body.specialAdCategory;

  const { data: updated, error } = await supabase
    .from('ad_campaigns')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(updated);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = params;

  // Get campaign
  const { data: campaign } = await supabase
    .from('ad_campaigns')
    .select('id, organization_id, status')
    .eq('id', id)
    .single();

  if (!campaign) return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });

  // Can only delete drafts
  if (campaign.status !== 'draft') {
    return NextResponse.json(
      { error: 'Only draft campaigns can be deleted. Pause or archive active campaigns instead.' },
      { status: 400 }
    );
  }

  // Verify admin/owner
  const { data: member } = await supabase
    .from('org_members')
    .select('role')
    .eq('organization_id', campaign.organization_id)
    .eq('user_id', user.id)
    .single();

  if (!member || !['owner', 'admin'].includes(member.role)) {
    return NextResponse.json({ error: 'Only owners and admins can delete campaigns' }, { status: 403 });
  }

  // Delete associated ad sets and creatives first
  await supabase.from('ad_creatives').delete().eq('campaign_id', id);
  await supabase.from('ad_sets').delete().eq('campaign_id', id);

  const { error } = await supabase
    .from('ad_campaigns')
    .delete()
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
