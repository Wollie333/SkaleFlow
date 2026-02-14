import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

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

  // Get cards with relations
  const { data: cards, error } = await supabase
    .from('authority_pipeline_cards')
    .select(`
      *,
      authority_pipeline_stages(id, name, slug, stage_order, stage_type, color),
      authority_contacts(id, full_name, outlet, warmth),
      authority_story_angles(id, title),
      authority_commercial(id, engagement_type, deal_value, currency, payment_status)
    `)
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(cards || []);
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { organizationId, opportunity_name, category, stage_id, ...rest } = body;

  if (!organizationId || !opportunity_name || !category) {
    return NextResponse.json({ error: 'organizationId, opportunity_name, and category required' }, { status: 400 });
  }

  // Verify owner/admin
  const { data: member } = await supabase
    .from('org_members')
    .select('role')
    .eq('organization_id', organizationId)
    .eq('user_id', user.id)
    .single();
  if (!member || !['owner', 'admin'].includes(member.role)) {
    return NextResponse.json({ error: 'Only owners and admins can create PR opportunities' }, { status: 403 });
  }

  // Lazy-seed stages if first access
  const serviceClient = createServiceClient();
  await serviceClient.rpc('seed_authority_stages', { p_org_id: organizationId });

  // If no stage_id provided, use the default (Prospect)
  let resolvedStageId = stage_id;
  if (!resolvedStageId) {
    const { data: defaultStage } = await supabase
      .from('authority_pipeline_stages')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('is_default', true)
      .single();
    resolvedStageId = defaultStage?.id;

    // Fallback to Prospect if no default
    if (!resolvedStageId) {
      const { data: prospectStage } = await supabase
        .from('authority_pipeline_stages')
        .select('id')
        .eq('organization_id', organizationId)
        .eq('slug', 'prospect')
        .single();
      resolvedStageId = prospectStage?.id;
    }
  }

  if (!resolvedStageId) {
    return NextResponse.json({ error: 'Could not resolve pipeline stage' }, { status: 500 });
  }

  const { data: card, error } = await supabase
    .from('authority_pipeline_cards')
    .insert({
      organization_id: organizationId,
      opportunity_name,
      category,
      stage_id: resolvedStageId,
      created_by: user.id,
      priority: rest.priority || 'medium',
      target_outlet: rest.target_outlet || null,
      contact_id: rest.contact_id || null,
      story_angle_id: rest.story_angle_id || null,
      custom_story_angle: rest.custom_story_angle || null,
      target_date: rest.target_date || null,
      reach_tier: rest.reach_tier || 'local',
      notes: rest.notes || null,
    })
    .select(`
      *,
      authority_pipeline_stages(id, name, slug, stage_order, stage_type, color),
      authority_contacts(id, full_name, outlet, warmth),
      authority_story_angles(id, title)
    `)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Create commercial record if engagement type provided
  if (rest.engagement_type) {
    await supabase.from('authority_commercial').insert({
      organization_id: organizationId,
      card_id: card.id,
      engagement_type: rest.engagement_type,
      deal_value: rest.deal_value || 0,
      currency: rest.currency || 'ZAR',
      payment_terms: rest.payment_terms || null,
    });
  }

  return NextResponse.json(card, { status: 201 });
}
