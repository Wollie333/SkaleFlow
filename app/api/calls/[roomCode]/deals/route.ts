import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// POST — create a deal from a call
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ roomCode: string }> }
) {
  const { roomCode } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: call } = await supabase
    .from('calls')
    .select('id, crm_contact_id, organization_id')
    .eq('room_code', roomCode)
    .single();

  if (!call) return NextResponse.json({ error: 'Call not found' }, { status: 404 });
  if (!call.crm_contact_id) {
    return NextResponse.json({ error: 'No contact linked to this call' }, { status: 400 });
  }

  const body = await request.json();
  const { title, valueCents, pipelineId, stageId } = body;

  if (!title) {
    return NextResponse.json({ error: 'Title is required' }, { status: 400 });
  }

  const { data: deal, error } = await supabase
    .from('crm_deals')
    .insert({
      organization_id: call.organization_id,
      title,
      contact_id: call.crm_contact_id,
      value_cents: valueCents || 0,
      pipeline_id: pipelineId || null,
      stage_id: stageId || null,
      status: 'open',
      assigned_to: user.id,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Optionally link deal to call
  if (deal) {
    await supabase
      .from('calls')
      .update({ crm_deal_id: deal.id, updated_at: new Date().toISOString() })
      .eq('id', call.id);
  }

  return NextResponse.json({ deal });
}
