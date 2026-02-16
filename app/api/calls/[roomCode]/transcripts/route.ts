import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

// POST — insert a transcript chunk
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ roomCode: string }> }
) {
  const { roomCode } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Allow both authenticated users and service-level calls
  const serviceClient = createServiceClient();

  // Get the call
  const { data: call } = await serviceClient
    .from('calls')
    .select('id, organization_id')
    .eq('room_code', roomCode)
    .single();

  if (!call) {
    return NextResponse.json({ error: 'Call not found' }, { status: 404 });
  }

  const body = await request.json();
  const { participantId, speakerLabel, content, timestampStart, timestampEnd, confidence } = body;

  if (!participantId || !speakerLabel || !content) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const { data, error } = await serviceClient
    .from('call_transcripts')
    .insert({
      call_id: call.id,
      participant_id: participantId,
      speaker_label: speakerLabel,
      content,
      timestamp_start: timestampStart || 0,
      timestamp_end: timestampEnd || null,
      confidence: confidence || 1.0,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}

// GET — get transcripts for a call
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ roomCode: string }> }
) {
  const { roomCode } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: call } = await supabase
    .from('calls')
    .select('id')
    .eq('room_code', roomCode)
    .single();

  if (!call) return NextResponse.json({ error: 'Call not found' }, { status: 404 });

  const { data, error } = await supabase
    .from('call_transcripts')
    .select('*')
    .eq('call_id', call.id)
    .order('timestamp_start', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
