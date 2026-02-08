import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { getAvailability } from '@/lib/google-calendar';

// Working hours in SAST (UTC+2): 9 AM to 5 PM
const WORK_START_HOUR = 9;
const WORK_END_HOUR = 17;
const SLOT_DURATION_MINUTES = 30;
const SAST_OFFSET_HOURS = 2;

function generateSlots(startDate: Date, endDate: Date, busySlots: { start: string; end: string }[]) {
  const slots: { date: string; time: string; iso: string }[] = [];

  const current = new Date(startDate);
  current.setUTCHours(0, 0, 0, 0);

  while (current < endDate) {
    const dayOfWeek = current.getUTCDay();

    // Skip weekends
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      // Generate slots for this day (SAST working hours)
      for (let hour = WORK_START_HOUR; hour < WORK_END_HOUR; hour++) {
        for (let min = 0; min < 60; min += SLOT_DURATION_MINUTES) {
          const slotStart = new Date(current);
          // Convert SAST to UTC: SAST hour - 2 = UTC hour
          slotStart.setUTCHours(hour - SAST_OFFSET_HOURS, min, 0, 0);
          const slotEnd = new Date(slotStart.getTime() + SLOT_DURATION_MINUTES * 60 * 1000);

          // Skip slots in the past (with 1-hour buffer)
          if (slotStart.getTime() <= Date.now() + 60 * 60 * 1000) continue;

          // Check if slot overlaps with any busy period
          const isBusy = busySlots.some((busy) => {
            const busyStart = new Date(busy.start).getTime();
            const busyEnd = new Date(busy.end).getTime();
            return slotStart.getTime() < busyEnd && slotEnd.getTime() > busyStart;
          });

          if (!isBusy) {
            const dateStr = current.toISOString().split('T')[0];
            const timeStr = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
            slots.push({
              date: dateStr,
              time: timeStr,
              iso: slotStart.toISOString(),
            });
          }
        }
      }
    }

    current.setUTCDate(current.getUTCDate() + 1);
  }

  return slots;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    const supabase = createServiceClient();

    // Look up meeting by token
    const { data: meeting, error: meetingError } = await supabase
      .from('meetings')
      .select('*, applications(full_name, business_name)')
      .eq('booking_token', token)
      .single();

    if (meetingError || !meeting) {
      return NextResponse.json({ error: 'Invalid booking link' }, { status: 404 });
    }

    // Check token is not expired
    if (new Date(meeting.token_expires_at) < new Date()) {
      return NextResponse.json({ error: 'This booking link has expired' }, { status: 410 });
    }

    // Check meeting is still pending
    if (meeting.status !== 'pending') {
      return NextResponse.json({
        error: 'This booking has already been completed',
        status: meeting.status,
        meetLink: meeting.meet_link,
      }, { status: 409 });
    }

    // Get availability from Google Calendar
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 14);

    let busySlots: { start: string; end: string }[] = [];
    try {
      busySlots = await getAvailability({
        userId: meeting.host_user_id,
        startDate,
        endDate,
      });
    } catch (err) {
      console.error('Failed to fetch Google Calendar availability:', err);
      // Continue without busy slots — all working hours will be available
    }

    // Generate available slots
    const slots = generateSlots(startDate, endDate, busySlots);

    // Group by date
    const grouped: Record<string, { time: string; iso: string }[]> = {};
    for (const slot of slots) {
      if (!grouped[slot.date]) grouped[slot.date] = [];
      grouped[slot.date].push({ time: slot.time, iso: slot.iso });
    }

    const application = meeting.applications as unknown as { full_name: string; business_name: string } | null;

    return NextResponse.json({
      applicantName: application?.full_name || meeting.attendee_name,
      businessName: application?.business_name || '',
      durationMinutes: meeting.duration_minutes,
      slots: grouped,
    });
  } catch (error) {
    console.error('Availability GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch availability' }, { status: 500 });
  }
}
