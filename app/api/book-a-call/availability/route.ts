import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { getAvailability } from '@/lib/google-calendar';

const WORK_START_HOUR = 9;
const WORK_END_HOUR = 17;
const SLOT_DURATION_MINUTES = 30;
const SAST_OFFSET_HOURS = 2;
const GOOGLE_API_TIMEOUT_MS = 8000; // 8 second timeout

function generateSlots(startDate: Date, endDate: Date, busySlots: { start: string; end: string }[]) {
  const slots: { date: string; time: string; iso: string }[] = [];

  const current = new Date(startDate);
  current.setUTCHours(0, 0, 0, 0);

  while (current < endDate) {
    const dayOfWeek = current.getUTCDay();

    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      for (let hour = WORK_START_HOUR; hour < WORK_END_HOUR; hour++) {
        for (let min = 0; min < 60; min += SLOT_DURATION_MINUTES) {
          const slotStart = new Date(current);
          slotStart.setUTCHours(hour - SAST_OFFSET_HOURS, min, 0, 0);
          const slotEnd = new Date(slotStart.getTime() + SLOT_DURATION_MINUTES * 60 * 1000);

          if (slotStart.getTime() <= Date.now() + 60 * 60 * 1000) continue;

          const isBusy = busySlots.some((busy) => {
            const busyStart = new Date(busy.start).getTime();
            const busyEnd = new Date(busy.end).getTime();
            return slotStart.getTime() < busyEnd && slotEnd.getTime() > busyStart;
          });

          if (!isBusy) {
            const dateStr = current.toISOString().split('T')[0];
            const timeStr = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
            slots.push({ date: dateStr, time: timeStr, iso: slotStart.toISOString() });
          }
        }
      }
    }

    current.setUTCDate(current.getUTCDate() + 1);
  }

  return slots;
}

// Race a promise against a timeout
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`Timed out after ${ms}ms`)), ms)
    ),
  ]);
}

export async function GET() {
  try {
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

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 14);

    // Fetch busy slots with a timeout — if Google is slow, return all working-hour slots
    let busySlots: { start: string; end: string }[] = [];
    try {
      busySlots = await withTimeout(
        getAvailability({ userId: admin.id, startDate, endDate }),
        GOOGLE_API_TIMEOUT_MS
      );
    } catch (err) {
      console.error('Google Calendar availability skipped (slow/error):', err);
    }

    const slots = generateSlots(startDate, endDate, busySlots);

    const grouped: Record<string, { time: string; iso: string }[]> = {};
    for (const slot of slots) {
      if (!grouped[slot.date]) grouped[slot.date] = [];
      grouped[slot.date].push({ time: slot.time, iso: slot.iso });
    }

    const response = NextResponse.json({
      durationMinutes: SLOT_DURATION_MINUTES,
      slots: grouped,
    });

    // Cache for 2 minutes so repeat visits / refreshes are instant
    response.headers.set('Cache-Control', 'public, s-maxage=120, stale-while-revalidate=60');

    return response;
  } catch (error) {
    console.error('Book-a-call availability error:', error);
    return NextResponse.json({ error: 'Failed to fetch availability' }, { status: 500 });
  }
}
