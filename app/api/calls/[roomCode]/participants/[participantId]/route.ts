import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

// PATCH — update participant status (admit, deny, leave)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ roomCode: string; participantId: string }> }
) {
  const { roomCode, participantId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const serviceClient = createServiceClient();

  // Find call by room code
  const { data: call } = await serviceClient
    .from('calls')
    .select('id, host_user_id')
    .eq('room_code', roomCode)
    .single();

  if (!call) {
    return NextResponse.json({ error: 'Call not found' }, { status: 404 });
  }

  const body = await request.json();
  const { status } = body as { status: string };

  // Only host can admit/deny
  if ((status === 'in_call' || status === 'denied') && (!user || user.id !== call.host_user_id)) {
    return NextResponse.json({ error: 'Only the host can admit or deny participants' }, { status: 403 });
  }

  const updateData: Record<string, unknown> = { status };
  if (status === 'in_call') {
    updateData.joined_at = new Date().toISOString();
  }
  if (status === 'left') {
    updateData.left_at = new Date().toISOString();
  }

  const { data: updated, error } = await serviceClient
    .from('call_participants')
    .update(updateData)
    .eq('id', participantId)
    .eq('call_id', call.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(updated);
}
