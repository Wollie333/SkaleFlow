import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

// GET — fetch call summary
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
    .select('id, title, call_type, actual_start, actual_end, room_code, crm_contact_id, recording_url')
    .eq('room_code', roomCode)
    .single();

  if (!call) return NextResponse.json({ error: 'Call not found' }, { status: 404 });

  // Generate signed URL for recording if it exists (stored as storage path, not public URL)
  let recordingSignedUrl: string | null = null;
  if (call.recording_url) {
    try {
      const serviceClient = createServiceClient();
      const { data: signedData } = await serviceClient.storage
        .from('call-recordings')
        .createSignedUrl(call.recording_url, 3600); // 1 hour expiry
      recordingSignedUrl = signedData?.signedUrl || null;
    } catch {
      // If signing fails, try using the stored URL as-is (might be a legacy public URL)
      recordingSignedUrl = call.recording_url;
    }
  }

  const { data: summary } = await supabase
    .from('call_summaries')
    .select('*')
    .eq('call_id', call.id)
    .single();

  const { data: actionItems } = await supabase
    .from('call_action_items')
    .select('*')
    .eq('call_id', call.id)
    .order('created_at');

  const { data: insights } = await supabase
    .from('call_brand_insights')
    .select('*')
    .eq('call_id', call.id)
    .order('created_at');

  return NextResponse.json({
    call: { ...call, recording_url: recordingSignedUrl },
    summary,
    actionItems: actionItems || [],
    insights: insights || [],
  });
}
