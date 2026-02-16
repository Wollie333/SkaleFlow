import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { generatePreCallBrief } from '@/lib/calls/pre-call/brief';

export const maxDuration = 60;

// GET — fetch existing brief (stored in call metadata)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ roomCode: string }> }
) {
  const { roomCode } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Brief is stored as call_objective extended or we can check a cache
  // For now, generate on demand
  return NextResponse.json({ brief: null, message: 'Use POST to generate' });
}

// POST — generate brief on demand
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
    .select('id, organization_id, host_user_id')
    .eq('room_code', roomCode)
    .single();

  if (!call) return NextResponse.json({ error: 'Call not found' }, { status: 404 });

  const brief = await generatePreCallBrief(call.id, call.organization_id, call.host_user_id);

  return NextResponse.json({ brief });
}
