import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { Json } from '@/types/database';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const organizationId = searchParams.get('organizationId');
  if (!organizationId) return NextResponse.json({ error: 'organizationId required' }, { status: 400 });

  // Verify membership
  const { data: member } = await supabase
    .from('org_members')
    .select('role')
    .eq('organization_id', organizationId)
    .eq('user_id', user.id)
    .single();

  if (!member) return NextResponse.json({ error: 'Not a member of this organization' }, { status: 403 });

  // Build query with optional filters
  let query = supabase
    .from('ad_campaigns')
    .select('*, ad_accounts!inner(account_name, platform), ad_sets(id), ad_creatives(id)')
    .eq('organization_id', organizationId);

  const status = searchParams.get('status');
  if (status) {
    query = query.eq('status', status);
  }

  const platform = searchParams.get('platform');
  if (platform) {
    query = query.eq('platform', platform);
  }

  const { data: campaigns, error } = await query.order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Attach counts
  const result = (campaigns || []).map(c => ({
    ...c,
    ad_set_count: c.ad_sets?.length || 0,
    creative_count: c.ad_creatives?.length || 0,
    account_name: c.ad_accounts?.account_name || null,
    ad_sets: undefined,
    ad_creatives: undefined,
    ad_accounts: undefined,
  }));

  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const {
    organizationId,
    adAccountId,
    name,
    platform,
    objective,
    budgetType,
    budgetCents,
    currency,
    startDate,
    endDate,
    specialAdCategory,
  } = body;

  if (!organizationId || !adAccountId || !name || !platform || !objective) {
    return NextResponse.json({ error: 'organizationId, adAccountId, name, platform, and objective are required' }, { status: 400 });
  }

  // Verify admin/owner
  const { data: member } = await supabase
    .from('org_members')
    .select('role')
    .eq('organization_id', organizationId)
    .eq('user_id', user.id)
    .single();

  if (!member || !['owner', 'admin'].includes(member.role)) {
    return NextResponse.json({ error: 'Only owners and admins can create campaigns' }, { status: 403 });
  }

  // Verify the ad account belongs to this org
  const { data: adAccount } = await supabase
    .from('ad_accounts')
    .select('id')
    .eq('id', adAccountId)
    .eq('organization_id', organizationId)
    .eq('is_active', true)
    .single();

  if (!adAccount) {
    return NextResponse.json({ error: 'Ad account not found or not active' }, { status: 404 });
  }

  const { data: campaign, error } = await supabase
    .from('ad_campaigns')
    .insert({
      organization_id: organizationId,
      ad_account_id: adAccountId,
      name,
      platform,
      objective,
      budget_type: budgetType || 'daily',
      budget_cents: budgetCents || 0,
      currency: currency || 'ZAR',
      start_date: startDate || null,
      end_date: endDate || null,
      special_ad_category: specialAdCategory || null,
      status: 'draft',
      created_by: user.id,
    })
    .select()
    .single();

  if (error) {
    console.error('Failed to create campaign:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(campaign, { status: 201 });
}
