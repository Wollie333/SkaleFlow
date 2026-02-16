import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: member } = await supabase
    .from('org_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .single();
  if (!member) return NextResponse.json({ error: 'No organization' }, { status: 403 });

  const url = new URL(request.url);
  const status = url.searchParams.get('status');

  let query = supabase
    .from('call_brand_insights')
    .select('*, calls(title, room_code)')
    .eq('organization_id', member.organization_id)
    .order('created_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query.limit(100);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// PATCH — accept or dismiss an insight
export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { insightId, action } = body;

  if (!insightId || !['accept', 'dismiss'].includes(action)) {
    return NextResponse.json({ error: 'Missing insightId or invalid action' }, { status: 400 });
  }

  const serviceClient = createServiceClient();

  if (action === 'accept') {
    // Get the insight
    const { data: insight } = await serviceClient
      .from('call_brand_insights')
      .select('*')
      .eq('id', insightId)
      .single();

    if (!insight) return NextResponse.json({ error: 'Insight not found' }, { status: 404 });

    // Update insight status
    await serviceClient
      .from('call_brand_insights')
      .update({ status: 'accepted', accepted_at: new Date().toISOString() })
      .eq('id', insightId);

    // If there's a brand_engine_field, update brand_outputs
    if (insight.brand_engine_field) {
      const { data: existing } = await serviceClient
        .from('brand_outputs')
        .select('id, value')
        .eq('organization_id', insight.organization_id)
        .eq('variable_key', insight.brand_engine_field)
        .single();

      if (existing) {
        // Append to existing value
        const currentValue = typeof existing.value === 'string' ? existing.value : '';
        const newValue = currentValue ? `${currentValue}\n[From call insight]: ${insight.content}` : insight.content;
        await serviceClient
          .from('brand_outputs')
          .update({ value: newValue, updated_at: new Date().toISOString() })
          .eq('id', existing.id);
      } else {
        await serviceClient
          .from('brand_outputs')
          .insert({
            organization_id: insight.organization_id,
            variable_key: insight.brand_engine_field,
            value: insight.content,
          });
      }
    }

    return NextResponse.json({ status: 'accepted' });
  } else {
    await serviceClient
      .from('call_brand_insights')
      .update({ status: 'dismissed' })
      .eq('id', insightId);

    return NextResponse.json({ status: 'dismissed' });
  }
}
