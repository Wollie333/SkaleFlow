import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { runPostCallPipeline } from '@/lib/calls/post-call';

export const maxDuration = 120;

// POST — end call and trigger post-call pipeline
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ roomCode: string }> }
) {
  const { roomCode } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const serviceClient = createServiceClient();

  const { data: call } = await serviceClient
    .from('calls')
    .select('id, organization_id, host_user_id, call_status')
    .eq('room_code', roomCode)
    .single();

  if (!call) return NextResponse.json({ error: 'Call not found' }, { status: 404 });

  if (call.call_status === 'completed') {
    return NextResponse.json({ message: 'Call already completed' });
  }

  // Update call end time
  await serviceClient
    .from('calls')
    .update({
      call_status: 'completed',
      actual_end: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', call.id);

  // Update all in-call participants to left
  await serviceClient
    .from('call_participants')
    .update({ status: 'left', left_at: new Date().toISOString() })
    .eq('call_id', call.id)
    .eq('status', 'in_call');

  // Run post-call pipeline (awaited — this is a long-running operation)
  await runPostCallPipeline(call.id, call.organization_id, call.host_user_id);

  return NextResponse.json({ success: true, callId: call.id });
}
