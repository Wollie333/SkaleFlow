import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// GET — load all messages for a call
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ roomCode: string }> }
) {
  const { roomCode } = await params;
  const serviceClient = createServiceClient();

  const { data: call } = await serviceClient
    .from('calls')
    .select('id')
    .eq('room_code', roomCode)
    .single();

  if (!call) {
    return NextResponse.json({ error: 'Call not found' }, { status: 404 });
  }

  const { data: messages, error } = await serviceClient
    .from('call_messages')
    .select('id, participant_id, sender_name, content, created_at')
    .eq('call_id', call.id)
    .order('created_at', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(messages || []);
}

// POST — save a new message
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ roomCode: string }> }
) {
  const { roomCode } = await params;
  const serviceClient = createServiceClient();

  const { data: call } = await serviceClient
    .from('calls')
    .select('id')
    .eq('room_code', roomCode)
    .single();

  if (!call) {
    return NextResponse.json({ error: 'Call not found' }, { status: 404 });
  }

  const body = await request.json();
  const { participantId, senderName, content } = body as {
    participantId?: string;
    senderName: string;
    content: string;
  };

  if (!content?.trim()) {
    return NextResponse.json({ error: 'Content is required' }, { status: 400 });
  }

  const { data: message, error } = await serviceClient
    .from('call_messages')
    .insert({
      call_id: call.id,
      participant_id: participantId || null,
      sender_name: senderName || 'Unknown',
      content: content.trim(),
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(message, { status: 201 });
}
