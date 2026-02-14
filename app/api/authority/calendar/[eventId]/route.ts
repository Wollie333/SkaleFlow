import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { checkAuthorityAccess } from '@/lib/authority/auth';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { eventId } = await params;
  const body = await request.json();

  // Look up organization_id from the record (service client to avoid RLS issues)
  const svc = createServiceClient();
  const { data: record } = await svc.from('authority_calendar_events').select('organization_id').eq('id', eventId).single();
  if (!record) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const access = await checkAuthorityAccess(supabase, user.id, record.organization_id);
  if (!access.authorized) return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  const db = access.queryClient;

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (body.is_completed !== undefined) {
    updates.is_completed = body.is_completed;
    if (body.is_completed) updates.completed_at = new Date().toISOString();
  }
  if (body.event_date !== undefined) updates.event_date = body.event_date;
  if (body.event_time !== undefined) updates.event_time = body.event_time;
  if (body.title !== undefined) updates.title = body.title;
  if (body.description !== undefined) updates.description = body.description;

  const { data, error } = await db
    .from('authority_calendar_events')
    .update(updates)
    .eq('id', eventId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
