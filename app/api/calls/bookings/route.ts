import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { generateRoomCode } from '@/lib/calls/config';
import type { BookingStatus } from '@/types/database';

// GET — list bookings for authenticated org
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
    .from('call_bookings')
    .select('*, booking_pages(title, slug)')
    .eq('organization_id', member.organization_id)
    .order('scheduled_time', { ascending: true });

  if (status) {
    query = query.eq('status', status as BookingStatus);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}

// POST — create booking (public, uses service client)
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { bookingPageId, guestName, guestEmail, guestCompany, guestNotes, scheduledTime, durationMin, intakeResponses } = body;

  if (!bookingPageId || !guestName || !guestEmail || !scheduledTime) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const supabase = createServiceClient();

  // Get booking page to find org
  const { data: page } = await supabase
    .from('booking_pages')
    .select('organization_id, default_call_type, title')
    .eq('id', bookingPageId)
    .eq('is_active', true)
    .single();

  if (!page) return NextResponse.json({ error: 'Booking page not found' }, { status: 404 });

  // Find or create CRM contact
  let crmContactId: string | null = null;
  const normalizedEmail = guestEmail.toLowerCase().trim();

  const { data: existingContact } = await supabase
    .from('crm_contacts')
    .select('id')
    .eq('organization_id', page.organization_id)
    .eq('email_normalised', normalizedEmail)
    .single();

  if (existingContact) {
    crmContactId = existingContact.id;
  } else {
    // Create new CRM contact
    const nameParts = guestName.trim().split(/\s+/);
    const firstName = nameParts[0] || guestName;
    const lastName = nameParts.slice(1).join(' ') || '';

    const { data: newContact } = await supabase
      .from('crm_contacts')
      .insert({
        organization_id: page.organization_id,
        first_name: firstName,
        last_name: lastName || '(Unknown)',
        email: guestEmail,
        email_normalised: normalizedEmail,
        source: 'website',
        lifecycle_stage: 'lead',
      })
      .select('id')
      .single();

    if (newContact) crmContactId = newContact.id;
  }

  // Get org host (owner)
  const { data: owner } = await supabase
    .from('org_members')
    .select('user_id')
    .eq('organization_id', page.organization_id)
    .eq('role', 'owner')
    .single();

  // Create the call record
  const roomCode = generateRoomCode();
  const { data: call } = await supabase
    .from('calls')
    .insert({
      organization_id: page.organization_id,
      host_user_id: owner?.user_id || '',
      title: `${page.title} with ${guestName}`,
      call_type: page.default_call_type,
      call_status: 'scheduled',
      scheduled_start: scheduledTime,
      scheduled_duration_min: durationMin || 30,
      room_code: roomCode,
      crm_contact_id: crmContactId,
    })
    .select('id')
    .single();

  // Create booking record
  const { data: booking, error } = await supabase
    .from('call_bookings')
    .insert({
      organization_id: page.organization_id,
      booking_page_id: bookingPageId,
      guest_name: guestName,
      guest_email: guestEmail,
      guest_company: guestCompany || null,
      guest_notes: guestNotes || null,
      scheduled_time: scheduledTime,
      duration_min: durationMin || 30,
      crm_contact_id: crmContactId,
      call_id: call?.id || null,
      intake_responses: intakeResponses || {},
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Update call with booking_id
  if (call && booking) {
    await supabase.from('calls').update({ booking_id: booking.id }).eq('id', call.id);
  }

  // Add guest as participant
  if (call) {
    await supabase.from('call_participants').insert({
      call_id: call.id,
      guest_name: guestName,
      guest_email: guestEmail,
      role: 'guest',
      status: 'invited',
      invite_method: 'calendar',
    });

    // Add host as participant
    if (owner) {
      await supabase.from('call_participants').insert({
        call_id: call.id,
        user_id: owner.user_id,
        role: 'host',
        status: 'invited',
        invite_method: 'direct',
      });
    }
  }

  // Create Google Calendar event for org owner
  if (call && owner?.user_id) {
    try {
      const { createMeetingEvent } = await import('@/lib/google-calendar');
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
      const gcalResult = await createMeetingEvent({
        userId: owner.user_id,
        summary: `${page.title} with ${guestName}`,
        startTime: scheduledTime,
        durationMinutes: durationMin || 30,
        attendeeEmail: guestEmail,
        description: `SkaleFlow Call\nJoin: ${siteUrl}/call/${roomCode}`,
      });
      await supabase
        .from('calls')
        .update({
          google_event_id: gcalResult.eventId,
          meet_link: gcalResult.meetLink,
        })
        .eq('id', call.id);
    } catch {
      // Don't fail booking if Google Calendar fails
      console.error('Failed to create Google Calendar event for booking');
    }
  }

  // Notify org admins
  const { notifyOrgAdmins } = await import('@/lib/notifications');
  await notifyOrgAdmins(
    supabase,
    page.organization_id,
    'call_booked',
    'New call booked',
    `${guestName} booked a ${page.title} for ${new Date(scheduledTime).toLocaleString()}.`,
    call ? `/calls/${roomCode}` : undefined,
    { booking_id: booking.id, guest_name: guestName }
  );

  return NextResponse.json({
    booking,
    roomCode,
    callId: call?.id
  }, { status: 201 });
}
