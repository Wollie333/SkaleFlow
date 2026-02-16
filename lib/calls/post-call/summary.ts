import { createServiceClient } from '@/lib/supabase/server';

export async function generateCallSummary(callId: string, orgId: string, userId: string) {
  const supabase = createServiceClient();

  // Get full transcript
  const { data: transcripts } = await supabase
    .from('call_transcripts')
    .select('speaker_label, content, timestamp_start')
    .eq('call_id', callId)
    .order('timestamp_start', { ascending: true });

  if (!transcripts || transcripts.length === 0) {
    // Create minimal summary
    const { data } = await supabase
      .from('call_summaries')
      .insert({ call_id: callId, summary_text: 'No transcript available for this call.' })
      .select()
      .single();
    return data;
  }

  const fullTranscript = transcripts.map(t => `[${t.speaker_label}]: ${t.content}`).join('\n');

  // Get call info
  const { data: call } = await supabase
    .from('calls')
    .select('title, call_type, call_objective')
    .eq('id', callId)
    .single();

  try {
    const { resolveModel } = await import('@/lib/ai/middleware');
    const { getProviderAdapterForUser } = await import('@/lib/ai/providers/registry');
    const { getModelConfig } = await import('@/lib/ai/providers/catalog');
    const { deductCredits } = await import('@/lib/ai/credits');

    const resolved = await resolveModel(orgId, 'video_call_copilot', undefined, userId);
    const config = getModelConfig(resolved.modelId);
    if (!config) throw new Error('No model config');

    const { adapter, usingUserKey } = await getProviderAdapterForUser(config.provider, userId);

    const response = await adapter.complete({
      systemPrompt: `You are a post-call analyst. Analyze the transcript and produce a comprehensive JSON summary.`,
      messages: [{
        role: 'user',
        content: `Call: ${call?.title || 'Untitled'} (${call?.call_type || 'unknown'})\nObjective: ${call?.call_objective || 'Not set'}\n\nFull Transcript:\n${fullTranscript}\n\nProduce a JSON response:\n{\n  "summary_text": "2-3 paragraph narrative summary",\n  "key_points": ["point 1", "point 2"],\n  "decisions_made": ["decision 1"],\n  "objections_raised": [{"objection": "...", "response": "...", "resolved": true}],\n  "sentiment_arc": [{"phase": "opening", "sentiment": "positive"}, ...],\n  "next_steps": [{"action": "...", "owner": "host|guest", "deadline": "..."}],\n  "deal_stage_recommendation": "lead|prospect|opportunity|customer"\n}`,
      }],
      maxTokens: 2000,
      temperature: 0.2,
      modelId: config.modelId,
    });

    if (!usingUserKey) {
      await deductCredits(orgId, 'video_call_copilot', response.inputTokens, response.outputTokens, config.provider, resolved.modelId, userId);
    }

    let parsed;
    try {
      parsed = JSON.parse(response.text);
    } catch {
      parsed = { summary_text: response.text };
    }

    const { data } = await supabase
      .from('call_summaries')
      .insert({
        call_id: callId,
        summary_text: parsed.summary_text || response.text,
        key_points: parsed.key_points || [],
        decisions_made: parsed.decisions_made || [],
        objections_raised: parsed.objections_raised || [],
        sentiment_arc: parsed.sentiment_arc || [],
        next_steps: parsed.next_steps || [],
        deal_stage_recommendation: parsed.deal_stage_recommendation || null,
      })
      .select()
      .single();

    return data;
  } catch (error) {
    console.error('[Summary] AI failed, creating basic summary:', error);
    const { data } = await supabase
      .from('call_summaries')
      .insert({
        call_id: callId,
        summary_text: `Call transcript contains ${transcripts.length} segments. AI summary unavailable.`,
      })
      .select()
      .single();
    return data;
  }
}
