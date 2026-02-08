import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { getAvailability, createMeetingEvent } from '@/lib/google-calendar';

const SLOT_DURATION_MINUTES = 30;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, selectedSlot, timezone } = body;

    if (!name || !email || !selectedSlot) {
      return NextResponse.json(
        { error: 'Name, email, and selected slot are required' },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    // Find the super_admin user
    const { data: admin, error: adminError } = await supabase
      .from('users')
      .select('id')
      .eq('role', 'super_admin')
      .limit(1)
      .single();

    if (adminError || !admin) {
      return NextResponse.json({ error: 'No admin found' }, { status: 500 });
    }

    // Re-check availability to prevent double-booking
    const slotStart = new Date(selectedSlot);
    const slotEnd = new Date(slotStart.getTime() + SLOT_DURATION_MINUTES * 60 * 1000);

    try {
      const busySlots = await getAvailability({
        userId: admin.id,
        startDate: slotStart,
        endDate: slotEnd,
      });

      const isConflict = busySlots.some((busy) => {
        const busyStart = new Date(busy.start).getTime();
        const busyEnd = new Date(busy.end).getTime();
        return slotStart.getTime() < busyEnd && slotEnd.getTime() > busyStart;
      });

      if (isConflict) {
        return NextResponse.json(
          { error: 'This time slot is no longer available. Please pick another time.' },
          { status: 409 }
        );
      }
    } catch (err) {
      console.error('Failed to re-check availability:', err);
    }

    // Create the Google Calendar event
    const { eventId, meetLink } = await createMeetingEvent({
      userId: admin.id,
      summary: `SkaleFlow Call: ${name}`,
      startTime: selectedSlot,
      durationMinutes: SLOT_DURATION_MINUTES,
      attendeeEmail: email,
      description: `Booking via SkaleFlow book-a-call page.\n\nName: ${name}\nEmail: ${email}\nTimezone: ${timezone || 'Unknown'}`,
    });

    // Create application record in the pipeline at 'booking_made' stage
    const { data: application, error: appError } = await supabase
      .from('applications')
      .insert({
        full_name: name,
        email,
        phone: 'Not provided',
        business_name: 'Not provided',
        team_size: 'Not provided',
        annual_revenue: 'Not provided',
        biggest_challenge: 'Direct booking',
        why_applying: 'Direct booking via book-a-call page',
        pipeline_stage: 'booking_made',
      })
      .select('id')
      .single();

    if (appError) {
      console.error('Failed to create application:', appError);
      // Still return success — the calendar event was created
      return NextResponse.json({ success: true, meetLink });
    }

    // Create meeting record linked to the application
    const now = new Date().toISOString();
    const tokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const { error: meetingError } = await supabase
      .from('meetings')
      .insert({
        application_id: application.id,
        host_user_id: admin.id,
        google_event_id: eventId,
        meet_link: meetLink,
        scheduled_at: selectedSlot,
        duration_minutes: SLOT_DURATION_MINUTES,
        attendee_email: email,
        attendee_name: name,
        status: 'scheduled',
        booking_token: `bac-${crypto.randomUUID()}`,
        token_expires_at: tokenExpiry,
        booked_at: now,
      });

    if (meetingError) {
      console.error('Failed to create meeting record:', meetingError);
    }

    // Log activity
    await supabase.from('application_activity').insert([
      {
        application_id: application.id,
        action: 'submitted',
        to_stage: 'booking_made',
        description: `Direct booking via book-a-call page by ${name} (${email})`,
      },
      {
        application_id: application.id,
        action: 'booking_confirmed',
        description: `Call booked for ${new Date(selectedSlot).toLocaleString('en-ZA')}`,
        metadata: { meeting_id: application.id, meet_link: meetLink },
      },
    ]);

    return NextResponse.json({ success: true, meetLink });
  } catch (error) {
    console.error('Book-a-call POST error:', error);
    return NextResponse.json({ error: 'Failed to book call' }, { status: 500 });
  }
}
