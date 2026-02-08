import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const supabase = createClient();
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

  // Build filters
  const campaignId = searchParams.get('campaignId');
  const creativeId = searchParams.get('creativeId');
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  let query = supabase
    .from('ad_metrics')
    .select('*')
    .eq('organization_id', organizationId);

  if (campaignId) {
    query = query.eq('campaign_id', campaignId);
  }

  if (creativeId) {
    query = query.eq('creative_id', creativeId);
  }

  if (startDate) {
    query = query.gte('date', startDate);
  }

  if (endDate) {
    query = query.lte('date', endDate);
  }

  const { data: metrics, error } = await query.order('date', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Aggregate into time series
  const dateMap: Record<string, {
    date: string;
    impressions: number;
    reach: number;
    clicks: number;
    spend_cents: number;
    conversions: number;
    video_views: number;
    engagement_rate: number;
    ctr: number;
    entries: number;
  }> = {};

  for (const m of (metrics || [])) {
    const dateKey = m.date;
    if (!dateMap[dateKey]) {
      dateMap[dateKey] = {
        date: dateKey,
        impressions: 0,
        reach: 0,
        clicks: 0,
        spend_cents: 0,
        conversions: 0,
        video_views: 0,
        engagement_rate: 0,
        ctr: 0,
        entries: 0,
      };
    }

    const d = dateMap[dateKey];
    d.impressions += m.impressions || 0;
    d.reach += m.reach || 0;
    d.clicks += m.clicks || 0;
    d.spend_cents += m.spend_cents || 0;
    d.conversions += m.conversions || 0;
    d.video_views += m.video_views || 0;
    d.engagement_rate += m.engagement_rate || 0;
    d.ctr += m.ctr || 0;
    d.entries += 1;
  }

  // Average engagement_rate and ctr per day
  const timeSeries = Object.values(dateMap).map(d => ({
    ...d,
    engagement_rate: d.entries > 0 ? Math.round((d.engagement_rate / d.entries) * 100) / 100 : 0,
    ctr: d.entries > 0 ? Math.round((d.ctr / d.entries) * 100) / 100 : 0,
    entries: undefined,
  }));

  // Calculate totals
  const totals = {
    impressions: 0,
    reach: 0,
    clicks: 0,
    spend_cents: 0,
    conversions: 0,
    video_views: 0,
  };

  for (const d of timeSeries) {
    totals.impressions += d.impressions;
    totals.reach += d.reach;
    totals.clicks += d.clicks;
    totals.spend_cents += d.spend_cents;
    totals.conversions += d.conversions;
    totals.video_views += d.video_views;
  }

  const avgCtr = totals.impressions > 0
    ? Math.round((totals.clicks / totals.impressions) * 10000) / 100
    : 0;

  const avgCpc = totals.clicks > 0
    ? Math.round(totals.spend_cents / totals.clicks)
    : 0;

  const avgCpm = totals.impressions > 0
    ? Math.round((totals.spend_cents / totals.impressions) * 1000)
    : 0;

  return NextResponse.json({
    timeSeries,
    totals: {
      ...totals,
      ctr: avgCtr,
      cpc_cents: avgCpc,
      cpm_cents: avgCpm,
    },
  });
}
