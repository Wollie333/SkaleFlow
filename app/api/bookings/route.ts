import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { createMeetingEvent, getAvailability } from '@/lib/google-calendar';

export async function POST(request: Request) {
  try {
    const { token, selectedSlot, timezone } = await request.json();

    if (!token || !selectedSlot) {
      return NextResponse.json({ error: 'Token and selectedSlot are required' }, { status: 400 });
    }

    const supabase = createServiceClient();

    // Look up meeting by token
    const { data: meeting, error: meetingError } = await supabase
      .from('meetings')
      .select('*, applications(full_name, business_name, email, id)')
      .eq('booking_token', token)
      .single();

    if (meetingError || !meeting) {
      return NextResponse.json({ error: 'Invalid booking link' }, { status: 404 });
    }

    // Validate token not expired
    if (new Date(meeting.token_expires_at) < new Date()) {
      return NextResponse.json({ error: 'This booking link has expired' }, { status: 410 });
    }

    // Validate meeting is still pending
    if (meeting.status !== 'pending') {
      return NextResponse.json({
        error: 'This booking has already been completed',
        meetLink: meeting.meet_link,
      }, { status: 409 });
    }

    // Re-check slot availability to prevent double-booking
    const slotStart = new Date(selectedSlot);
    const slotEnd = new Date(slotStart.getTime() + meeting.duration_minutes * 60 * 1000);

    try {
      const busySlots = await getAvailability({
        userId: meeting.host_user_id,
        startDate: slotStart,
        endDate: slotEnd,
      });

      const isConflict = busySlots.some((busy) => {
        const busyStart = new Date(busy.start).getTime();
        const busyEnd = new Date(busy.end).getTime();
        return slotStart.getTime() < busyEnd && slotEnd.getTime() > busyStart;
      });

      if (isConflict) {
        return NextResponse.json({ error: 'This time slot is no longer available. Please pick another.' }, { status: 409 });
      }
    } catch (err) {
      console.error('Failed to re-check availability:', err);
      // Proceed anyway — worst case is a double-booking which can be resolved manually
    }

    // Create Google Calendar event with Meet link
    const application = meeting.applications as unknown as { full_name: string; business_name: string; email: string; id: string } | null;
    const applicantName = application?.full_name || meeting.attendee_name;
    const businessName = application?.business_name || '';

    const { eventId, meetLink } = await createMeetingEvent({
      userId: meeting.host_user_id,
      summary: `SkaleFlow Onboarding: ${applicantName} (${businessName})`,
      startTime: selectedSlot,
      durationMinutes: meeting.duration_minutes,
      attendeeEmail: meeting.attendee_email,
      description: `Onboarding call with ${applicantName} from ${businessName}.\n\nTimezone: ${timezone || 'Not specified'}`,
    });

    // Update meeting record
    await supabase
      .from('meetings')
      .update({
        status: 'scheduled',
        scheduled_at: selectedSlot,
        google_event_id: eventId,
        meet_link: meetLink,
        booked_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', meeting.id);

    // Move application to booking_made
    const applicationId = application?.id || meeting.application_id;
    await supabase
      .from('applications')
      .update({ pipeline_stage: 'booking_made' })
      .eq('id', applicationId);

    // Log activities
    await supabase.from('application_activity').insert([
      {
        application_id: applicationId,
        action: 'booking_confirmed',
        description: `Onboarding call booked for ${new Date(selectedSlot).toLocaleDateString('en-ZA', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`,
        metadata: { meeting_id: meeting.id, meet_link: meetLink },
      },
      {
        application_id: applicationId,
        action: 'stage_changed',
        from_stage: 'approved',
        to_stage: 'booking_made',
        description: 'Automatically moved to Booking Made after call was booked',
      },
    ]);

    return NextResponse.json({ success: true, meetLink });
  } catch (error) {
    console.error('Booking POST error:', error);
    return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 });
  }
}
