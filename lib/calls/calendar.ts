import { createServiceClient } from '@/lib/supabase/server';

interface TimeSlot {
  start: Date;
  end: Date;
}

interface AvailableHours {
  start: string; // "09:00"
  end: string; // "17:00"
  timezone: string;
  days: number[]; // 0=Sun, 1=Mon, ..., 6=Sat
}

/**
 * Get available time slots for a booking page within a date range.
 * Checks existing bookings and call schedule for conflicts.
 */
export async function getAvailableSlots(
  orgId: string,
  bookingPageId: string,
  startDate: Date,
  endDate: Date,
  durationMin: number
): Promise<TimeSlot[]> {
  const supabase = createServiceClient();

  // 1. Get booking page config
  const { data: page } = await supabase
    .from('booking_pages')
    .select('available_hours, buffer_minutes')
    .eq('id', bookingPageId)
    .single();

  if (!page) return [];

  const hours = (page.available_hours || {
    start: '09:00',
    end: '17:00',
    timezone: 'Africa/Johannesburg',
    days: [1, 2, 3, 4, 5],
  }) as unknown as AvailableHours;
  const bufferMin = page.buffer_minutes || 15;

  // 2. Get existing bookings in range
  const { data: existingBookings } = await supabase
    .from('call_bookings')
    .select('scheduled_time, duration_min')
    .eq('organization_id', orgId)
    .gte('scheduled_time', startDate.toISOString())
    .lte('scheduled_time', endDate.toISOString())
    .neq('status', 'cancelled');

  // 3. Get existing calls in range
  const { data: existingCalls } = await supabase
    .from('calls')
    .select('scheduled_start, scheduled_duration_min')
    .eq('organization_id', orgId)
    .gte('scheduled_start', startDate.toISOString())
    .lte('scheduled_start', endDate.toISOString())
    .neq('call_status', 'cancelled');

  // Build conflict list
  const conflicts: TimeSlot[] = [];
  for (const booking of existingBookings || []) {
    const start = new Date(booking.scheduled_time);
    const end = new Date(start.getTime() + (booking.duration_min + bufferMin) * 60_000);
    conflicts.push({ start, end });
  }
  for (const call of existingCalls || []) {
    if (!call.scheduled_start) continue;
    const start = new Date(call.scheduled_start);
    const end = new Date(start.getTime() + ((call.scheduled_duration_min || 30) + bufferMin) * 60_000);
    conflicts.push({ start, end });
  }

  // 3b. Check Google Calendar busy times for org owner
  try {
    const { data: ownerMember } = await supabase
      .from('org_members')
      .select('user_id')
      .eq('organization_id', orgId)
      .eq('role', 'owner')
      .single();

    if (ownerMember) {
      const { data: googleIntegration } = await supabase
        .from('google_integrations')
        .select('id')
        .eq('user_id', ownerMember.user_id)
        .single();

      if (googleIntegration) {
        const { getAvailability } = await import('@/lib/google-calendar');
        const busySlots = await getAvailability({
          userId: ownerMember.user_id,
          startDate,
          endDate,
        });
        for (const slot of busySlots) {
          conflicts.push({
            start: new Date(slot.start),
            end: new Date(slot.end),
          });
        }
      }
    }
  } catch {
    // If Google Calendar check fails, proceed with internal conflicts only
  }

  // 4. Generate available slots
  const slots: TimeSlot[] = [];
  const current = new Date(startDate);
  current.setHours(0, 0, 0, 0);

  while (current <= endDate) {
    const dayOfWeek = current.getDay();

    if (hours.days.includes(dayOfWeek)) {
      const [startH, startM] = hours.start.split(':').map(Number);
      const [endH, endM] = hours.end.split(':').map(Number);

      const dayStart = new Date(current);
      dayStart.setHours(startH, startM, 0, 0);

      const dayEnd = new Date(current);
      dayEnd.setHours(endH, endM, 0, 0);

      const slotStart = new Date(dayStart);
      while (slotStart.getTime() + durationMin * 60_000 <= dayEnd.getTime()) {
        const slotEnd = new Date(slotStart.getTime() + durationMin * 60_000);

        // Check for conflicts
        const hasConflict = conflicts.some(
          (c) => slotStart < c.end && slotEnd > c.start
        );

        // Don't show past slots
        if (!hasConflict && slotStart > new Date()) {
          slots.push({ start: new Date(slotStart), end: new Date(slotEnd) });
        }

        // Move to next slot (duration + buffer)
        slotStart.setTime(slotStart.getTime() + (durationMin + bufferMin) * 60_000);
      }
    }

    current.setDate(current.getDate() + 1);
  }

  return slots;
}
