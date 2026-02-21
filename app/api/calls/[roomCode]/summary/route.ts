import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

// GET — fetch call summary with expanded data
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
    .select('id, title, call_type, actual_start, actual_end, room_code, crm_contact_id, crm_deal_id, recording_url, organization_id, call_objective, host_user_id')
    .eq('room_code', roomCode)
    .single();

  if (!call) return NextResponse.json({ error: 'Call not found' }, { status: 404 });

  // Generate signed URL for recording if it exists
  let recordingSignedUrl: string | null = null;
  if (call.recording_url) {
    try {
      const serviceClient = createServiceClient();
      const { data: signedData } = await serviceClient.storage
        .from('call-recordings')
        .createSignedUrl(call.recording_url, 3600);
      recordingSignedUrl = signedData?.signedUrl || null;
    } catch {
      recordingSignedUrl = call.recording_url;
    }
  }

  // Fetch all data in parallel
  const [
    summaryResult,
    actionItemsResult,
    brandInsightsResult,
    participantsResult,
    transcriptCountResult,
    costDataResult,
  ] = await Promise.all([
    supabase
      .from('call_summaries')
      .select('*')
      .eq('call_id', call.id)
      .single(),

    supabase
      .from('call_action_items')
      .select('*')
      .eq('call_id', call.id)
      .order('created_at'),

    supabase
      .from('call_brand_insights')
      .select('*')
      .eq('call_id', call.id)
      .order('created_at'),

    supabase
      .from('call_participants')
      .select('id, role, guest_name, guest_email, user_id, joined_at, left_at, status')
      .eq('call_id', call.id),

    supabase
      .from('call_transcripts')
      .select('id', { count: 'exact', head: true })
      .eq('call_id', call.id),

    // AI usage cost data for this call
    supabase
      .from('ai_usage')
      .select('id, feature, model, credits_charged, provider, created_at')
      .eq('call_id', call.id)
      .order('created_at'),
  ]);

  // Fetch contact if linked
  let contact = null;
  if (call.crm_contact_id) {
    const { data } = await supabase
      .from('crm_contacts')
      .select('id, first_name, last_name, email, phone, company, job_title')
      .eq('id', call.crm_contact_id)
      .single();
    contact = data;
  }

  // Fetch deals for the linked contact
  let deals: Array<Record<string, unknown>> = [];
  if (call.crm_contact_id) {
    const { data } = await supabase
      .from('crm_deals')
      .select('id, title, status, value_cents, probability, expected_close_date, stage_id, pipeline_id, created_at')
      .eq('contact_id', call.crm_contact_id)
      .eq('organization_id', call.organization_id)
      .order('created_at', { ascending: false });
    deals = data || [];
  }

  // Fallback cost estimate from guidance count (for pre-migration calls)
  let guidanceCount = 0;
  if (!costDataResult.data?.length) {
    const { count } = await supabase
      .from('call_ai_guidance')
      .select('id', { count: 'exact', head: true })
      .eq('call_id', call.id);
    guidanceCount = count || 0;
  }

  // Enrich participants with user names
  const participants = participantsResult.data || [];
  const userIds = participants.filter(p => p.user_id).map(p => p.user_id!);
  let userNames: Record<string, string> = {};
  if (userIds.length > 0) {
    const { data: users } = await supabase
      .from('users')
      .select('id, full_name, email')
      .in('id', userIds);
    if (users) {
      for (const u of users) {
        userNames[u.id] = u.full_name || u.email;
      }
    }
  }

  const enrichedParticipants = participants.map(p => ({
    ...p,
    display_name: p.user_id ? (userNames[p.user_id] || 'Team Member') : (p.guest_name || 'Guest'),
  }));

  return NextResponse.json({
    call: { ...call, recording_url: recordingSignedUrl },
    summary: summaryResult.data,
    actionItems: actionItemsResult.data || [],
    brandInsights: brandInsightsResult.data || [],
    participants: enrichedParticipants,
    contact,
    deals,
    costData: {
      items: costDataResult.data || [],
      totalCredits: (costDataResult.data || []).reduce((sum, item) => sum + (item.credits_charged || 0), 0),
      guidanceCountFallback: guidanceCount,
    },
    transcriptCount: transcriptCountResult.count || 0,
  });
}
