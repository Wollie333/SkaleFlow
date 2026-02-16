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
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // If rescheduled, update the linked call too
  if (scheduledTime && data?.call_id) {
    await supabase
      .from('calls')
      .update({ scheduled_start: scheduledTime, updated_at: new Date().toISOString() })
      .eq('id', data.call_id);
  }

  // If cancelled, cancel the linked call too
  if (status === 'cancelled' && data?.call_id) {
    await supabase
      .from('calls')
      .update({ call_status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('id', data.call_id);
  }

  return NextResponse.json(data);
}
