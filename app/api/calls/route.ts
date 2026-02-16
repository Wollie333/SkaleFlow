import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateRoomCode } from '@/lib/calls/config';

// GET — list calls for org
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
    .from('calls')
    .select('*')
    .eq('organization_id', member.organization_id)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// POST — create ad-hoc call
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: member } = await supabase
    .from('org_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .single();
  if (!member) return NextResponse.json({ error: 'No organization' }, { status: 403 });

  const body = await request.json();
  const roomCode = generateRoomCode();

  const { data, error } = await supabase
    .from('calls')
    .insert({
      organization_id: member.organization_id,
      host_user_id: user.id,
      title: body.title || 'Untitled Call',
      call_type: body.callType || 'discovery',
      call_status: 'scheduled',
      template_id: body.templateId || null,
      call_objective: body.callObjective || null,
      scheduled_start: body.scheduledStart || new Date().toISOString(),
      scheduled_duration_min: body.durationMin || 30,
      room_code: roomCode,
      crm_contact_id: body.crmContactId || null,
      crm_deal_id: body.crmDealId || null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Add host as participant
  await supabase.from('call_participants').insert({
    call_id: data.id,
    user_id: user.id,
    role: 'host',
    status: 'invited',
    invite_method: 'direct',
  });

  return NextResponse.json(data, { status: 201 });
}
