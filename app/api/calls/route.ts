import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
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

  // Find or create CRM contact if guest info provided and no crmContactId given
  let crmContactId: string | null = body.crmContactId || null;
  if (!crmContactId && body.guestEmail) {
    const normalizedEmail = body.guestEmail.toLowerCase().trim();

    const { data: existingContact } = await supabase
      .from('crm_contacts')
      .select('id')
      .eq('organization_id', member.organization_id)
      .eq('email_normalised', normalizedEmail)
      .single();

    if (existingContact) {
      crmContactId = existingContact.id;
    } else {
      const nameParts = (body.guestName || '').trim().split(/\s+/);
      const firstName = nameParts[0] || body.guestName || 'Unknown';
      const lastName = nameParts.slice(1).join(' ') || '';

      const { data: newContact } = await supabase
        .from('crm_contacts')
        .insert({
          organization_id: member.organization_id,
          first_name: firstName,
          last_name: lastName || '(Unknown)',
          email: body.guestEmail,
          email_normalised: normalizedEmail,
          source: 'call',
          lifecycle_stage: 'lead',
        })
        .select('id')
        .single();

      if (newContact) crmContactId = newContact.id;
    }
  }

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
      crm_contact_id: crmContactId,
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

  // Add guest as participant if provided
  if (body.guestName && body.guestEmail) {
    await supabase.from('call_participants').insert({
      call_id: data.id,
      guest_name: body.guestName,
      guest_email: body.guestEmail,
      role: 'guest',
      status: 'invited',
      invite_method: 'calendar',
    });
  }

  // Add team members as participants
  if (body.teamMemberIds && Array.isArray(body.teamMemberIds)) {
    for (const teamUserId of body.teamMemberIds) {
      if (teamUserId === user.id) continue; // skip host, already added
      await supabase.from('call_participants').insert({
        call_id: data.id,
        user_id: teamUserId,
        role: 'team_member',
        status: 'invited',
        invite_method: 'direct',
      });
    }
  }

  // Create Google Calendar event if connected
  try {
    const { createMeetingEvent } = await import('@/lib/google-calendar');
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const gcalResult = await createMeetingEvent({
      userId: user.id,
      summary: data.title,
      startTime: data.scheduled_start || new Date().toISOString(),
      durationMinutes: data.scheduled_duration_min || 30,
      attendeeEmail: body.guestEmail || '',
      description: `SkaleFlow Call\nJoin: ${siteUrl}/call/${roomCode}`,
    });
    await supabase
      .from('calls')
      .update({
        google_event_id: gcalResult.eventId,
        meet_link: gcalResult.meetLink,
      })
      .eq('id', data.id);
    data.google_event_id = gcalResult.eventId;
    data.meet_link = gcalResult.meetLink;
  } catch {
    // Don't fail call creation if Google Calendar fails
  }

  return NextResponse.json(data, { status: 201 });
}

// DELETE — super admin only: delete a call and all related data
export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Super admin check
  const serviceClient = createServiceClient();
  const { data: userData } = await serviceClient
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!userData || userData.role !== 'super_admin') {
    return NextResponse.json({ error: 'Forbidden — super admin only' }, { status: 403 });
  }

  const { callId } = await request.json();
  if (!callId) {
    return NextResponse.json({ error: 'callId is required' }, { status: 400 });
  }

  // Verify call exists
  const { data: call } = await serviceClient
    .from('calls')
    .select('id, recording_url')
    .eq('id', callId)
    .single();

  if (!call) {
    return NextResponse.json({ error: 'Call not found' }, { status: 404 });
  }

  // Delete in dependency order (children first)
  // 1. call_ai_guidance (depends on call_transcripts)
  await serviceClient.from('call_ai_guidance').delete().eq('call_id', callId);
  // 2. call_brand_insights (depends on call_transcripts)
  await serviceClient.from('call_brand_insights').delete().eq('call_id', callId);
  // 3. call_transcripts (depends on call_participants)
  await serviceClient.from('call_transcripts').delete().eq('call_id', callId);
  // 4. call_action_items (depends on call_summaries)
  await serviceClient.from('call_action_items').delete().eq('call_id', callId);
  // 5. call_summaries
  await serviceClient.from('call_summaries').delete().eq('call_id', callId);
  // 6. call_participants
  await serviceClient.from('call_participants').delete().eq('call_id', callId);
  // 7. Unlink bookings (set call_id to null, don't delete the booking)
  await serviceClient.from('call_bookings').update({ call_id: null }).eq('call_id', callId);
  // 8. Delete the call itself
  const { error } = await serviceClient.from('calls').delete().eq('id', callId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Try to delete recording from storage (non-blocking)
  if (call.recording_url) {
    try {
      const path = call.recording_url.split('/call-recordings/').pop();
      if (path) {
        await serviceClient.storage.from('call-recordings').remove([path]);
      }
    } catch {
      // Non-blocking
    }
  }

  return NextResponse.json({ success: true });
}
