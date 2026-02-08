import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { Json } from '@/types/database';

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

  let query = supabase
    .from('ad_creatives')
    .select('*')
    .eq('organization_id', organizationId);

  const campaignId = searchParams.get('campaignId');
  if (campaignId) {
    query = query.eq('campaign_id', campaignId);
  }

  const complianceStatus = searchParams.get('complianceStatus');
  if (complianceStatus) {
    query = query.eq('compliance_status', complianceStatus);
  }

  const status = searchParams.get('status');
  if (status) {
    query = query.eq('status', status);
  }

  const { data: creatives, error } = await query.order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(creatives || []);
}

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const {
    adSetId,
    campaignId,
    name,
    format,
    primaryText,
    headline,
    description,
    ctaType,
    targetUrl,
    utmParameters,
    displayLink,
    mediaUrls,
  } = body;

  if (!campaignId || !name || !primaryText) {
    return NextResponse.json({ error: 'campaignId, name, and primaryText are required' }, { status: 400 });
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
    return NextResponse.json({ error: 'Only owners and admins can create creatives' }, { status: 403 });
  }

  const { data: creative, error } = await supabase
    .from('ad_creatives')
    .insert({
      campaign_id: campaignId,
      ad_set_id: adSetId || null,
      organization_id: campaign.organization_id,
      name,
      format: format || 'single_image',
      primary_text: primaryText,
      headline: headline || null,
      description: description || null,
      cta_type: ctaType || 'learn_more',
      target_url: targetUrl || null,
      utm_parameters: (utmParameters || null) as unknown as Json,
      display_link: displayLink || null,
      media_urls: mediaUrls || [],
      status: 'draft',
      compliance_status: 'pending',
      created_by: user.id,
    })
    .select()
    .single();

  if (error) {
    console.error('Failed to create creative:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(creative, { status: 201 });
}
