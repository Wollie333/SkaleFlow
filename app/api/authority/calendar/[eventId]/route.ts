import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { eventId } = await params;
  const body = await request.json();

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (body.is_completed !== undefined) {
    updates.is_completed = body.is_completed;
    if (body.is_completed) updates.completed_at = new Date().toISOString();
  }
  if (body.event_date !== undefined) updates.event_date = body.event_date;
  if (body.event_time !== undefined) updates.event_time = body.event_time;
  if (body.title !== undefined) updates.title = body.title;
  if (body.description !== undefined) updates.description = body.description;

  const { data, error } = await supabase
    .from('authority_calendar_events')
    .update(updates)
    .eq('id', eventId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
