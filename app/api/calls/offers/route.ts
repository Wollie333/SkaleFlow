import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: member } = await supabase
    .from('org_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .single();
  if (!member) return NextResponse.json({ error: 'No organization' }, { status: 403 });

  const { data, error } = await supabase
    .from('offers')
    .select('*')
    .eq('organization_id', member.organization_id)
    .order('sort_order')
    .order('created_at');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: member } = await supabase
    .from('org_members')
    .select('organization_id, role')
    .eq('user_id', user.id)
    .single();
  if (!member || !['owner', 'admin'].includes(member.role)) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
  }

  const body = await request.json();

  const { data, error } = await supabase
    .from('offers')
    .insert({
      organization_id: member.organization_id,
      name: body.name,
      description: body.description || null,
      tier: body.tier || null,
      price_display: body.priceDisplay || null,
      price_value: body.priceValue || null,
      currency: body.currency || 'ZAR',
      billing_frequency: body.billingFrequency || null,
      deliverables: body.deliverables || [],
      ideal_client_profile: body.idealClientProfile || null,
      value_propositions: body.valuePropositions || [],
      common_objections: body.commonObjections || [],
      roi_framing: body.roiFraming || null,
      comparison_points: body.comparisonPoints || [],
      sort_order: body.sortOrder || 0,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Sync to Brand Engine
  try {
    const { syncOfferToBrandEngine } = await import('@/lib/calls/offers/brand-sync');
    await syncOfferToBrandEngine(data, member.organization_id);
  } catch (err) {
    console.error('[Offers] Brand sync failed:', err);
  }

  return NextResponse.json(data, { status: 201 });
}
