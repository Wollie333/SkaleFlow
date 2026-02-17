import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// PATCH — reschedule/cancel booking
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { status, scheduledTime } = body;

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (status) updates.status = status;
  if (scheduledTime) updates.scheduled_time = scheduledTime;

  const { data, error } = await supabase
    .from('call_bookings')
    .update(updates)
    .eq('id', id)
    .select('*, calls(google_event_id, host_user_id, scheduled_duration_min)')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const linkedCall = data?.call_id ? (data as Record<string, unknown>).calls as {
    google_event_id: string | null;
    host_user_id: string;
    scheduled_duration_min: number;
  } | null : null;

  // If rescheduled, update the linked call too
  if (scheduledTime && data?.call_id) {
    await supabase
      .from('calls')
      .update({ scheduled_start: scheduledTime, updated_at: new Date().toISOString() })
      .eq('id', data.call_id);

    // Update Google Calendar event
    if (linkedCall?.google_event_id) {
      try {
        const { updateCalendarEvent } = await import('@/lib/google-calendar');
        await updateCalendarEvent(linkedCall.host_user_id, linkedCall.google_event_id, {
          startTime: scheduledTime,
          durationMinutes: linkedCall.scheduled_duration_min || 30,
        });
      } catch {
        console.error('Failed to update Google Calendar event');
      }
    }
  }

  // If cancelled, cancel the linked call too
  if (status === 'cancelled' && data?.call_id) {
    await supabase
      .from('calls')
      .update({ call_status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('id', data.call_id);

    // Delete Google Calendar event
    if (linkedCall?.google_event_id) {
      try {
        const { deleteCalendarEvent } = await import('@/lib/google-calendar');
        await deleteCalendarEvent(linkedCall.host_user_id, linkedCall.google_event_id);
      } catch {
        console.error('Failed to delete Google Calendar event');
      }
    }
  }

  return NextResponse.json(data);
}
