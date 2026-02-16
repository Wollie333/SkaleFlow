import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { getCopilotProvider } from '@/lib/calls/copilot';

export const maxDuration = 30;

// POST — process a transcript turn and return guidance
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ roomCode: string }> }
) {
  const { roomCode } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const serviceClient = createServiceClient();

  // Get call
  const { data: call } = await serviceClient
    .from('calls')
    .select('id, organization_id, template_id, call_objective, call_templates(phases)')
    .eq('room_code', roomCode)
    .single();

  if (!call) return NextResponse.json({ error: 'Call not found' }, { status: 404 });

  const body = await request.json();
  const { transcriptTurn, speakerLabel, currentPhase, currentStep } = body;

  if (!transcriptTurn) {
    return NextResponse.json({ error: 'Missing transcriptTurn' }, { status: 400 });
  }

  // Get previous guidance
  const { data: prevGuidance } = await serviceClient
    .from('call_ai_guidance')
    .select('guidance_type, content')
    .eq('call_id', call.id)
    .order('created_at', { ascending: false })
    .limit(20);

  const templatePhases = call.call_templates
    ? ((call.call_templates as { phases: unknown[] }).phases || [])
    : [];

  // Process via copilot provider
  const provider = await getCopilotProvider();
  const guidance = await provider.processTranscriptTurn({
    callId: call.id,
    orgId: call.organization_id,
    userId: user.id,
    templatePhases,
    currentPhase: currentPhase || '',
    currentStep: currentStep || '',
    callObjective: call.call_objective || '',
    transcriptTurn,
    speakerLabel: speakerLabel || 'Unknown',
    previousGuidance: (prevGuidance || []).map(g => ({
      type: g.guidance_type,
      content: g.content,
    })),
  });

  if (!guidance) {
    return NextResponse.json({ skip: true });
  }

  // Save guidance to DB
  const { data: saved, error } = await serviceClient
    .from('call_ai_guidance')
    .insert({
      call_id: call.id,
      guidance_type: guidance.guidanceType,
      content: guidance.content,
      framework_phase: guidance.frameworkPhase || null,
      framework_step: guidance.frameworkStep || null,
    })
    .select()
    .single();

  if (error) {
    console.error('[Guidance] Failed to save:', error);
    return NextResponse.json(guidance);
  }

  return NextResponse.json(saved, { status: 201 });
}
