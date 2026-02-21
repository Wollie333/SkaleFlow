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
    const { resolveModel, deductCredits } = await import('@/lib/ai/server');
    const { getProviderAdapterForUser } = await import('@/lib/ai/providers/registry');

    const resolved = await resolveModel(orgId, 'video_call_copilot', undefined, userId);
    const { adapter, usingUserKey } = await getProviderAdapterForUser(resolved.provider, userId);

    const response = await adapter.complete({
      systemPrompt: `You are a professional post-call analyst. Analyze the transcript and produce a structured JSON response. IMPORTANT: The "summary_text" field MUST be plain, readable prose — 2-3 paragraphs written as a human would read them. Do NOT include JSON, code formatting, or escape characters in the summary_text. Write naturally as if you were writing a meeting report for a business executive.`,
      messages: [{
        role: 'user',
        content: `Call: ${call?.title || 'Untitled'} (${call?.call_type || 'unknown'})\nObjective: ${call?.call_objective || 'Not set'}\n\nFull Transcript:\n${fullTranscript}\n\nProduce a JSON response with these fields:\n{\n  "summary_text": "Write 2-3 paragraphs of natural, readable prose summarizing the call. Include who participated, what was discussed, key outcomes, and any notable moments. Write this as a human-readable meeting summary, NOT as JSON or a list.",\n  "key_points": ["Clear, complete sentence for each key point"],\n  "decisions_made": ["Each decision as a clear sentence"],\n  "objections_raised": [{"objection": "The objection raised", "response": "How it was addressed", "resolved": true}],\n  "sentiment_arc": [{"phase": "opening", "sentiment": "positive"}, {"phase": "discussion", "sentiment": "neutral"}, {"phase": "closing", "sentiment": "positive"}],\n  "next_steps": [{"action": "Specific action to take", "owner": "host or guest name", "deadline": "timeframe or date"}],\n  "deal_stage_recommendation": "lead|prospect|opportunity|customer"\n}\n\nRespond with ONLY the JSON object, no markdown code blocks.`,
      }],
      maxTokens: 2000,
      temperature: 0.2,
      modelId: resolved.modelId,
      jsonMode: true,
    });

    let credits = 0;
    if (!usingUserKey) {
      const { calculateCreditCost } = await import('@/lib/ai/credits');
      credits = calculateCreditCost(resolved.id, response.inputTokens, response.outputTokens);
    }

    const { data: usageRecord } = await supabase.from('ai_usage').insert({
      organization_id: orgId,
      user_id: userId,
      feature: 'call_summary',
      model: resolved.modelId,
      input_tokens: response.inputTokens,
      output_tokens: response.outputTokens,
      credits_charged: credits,
      provider: resolved.provider,
      is_free_model: resolved.isFree || false,
      call_id: callId,
    }).select('id').single();

    if (!usingUserKey && credits > 0) {
      await deductCredits(orgId, userId || null, credits, usageRecord?.id || null, 'Call summary generation');
    }

    let parsed;
    try {
      // Strip markdown code blocks if AI wrapped in ```json...```
      let cleaned = response.text.trim();
      if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
      }
      parsed = JSON.parse(cleaned);
    } catch {
      // If JSON parse fails, use the raw text as summary
      parsed = { summary_text: response.text.replace(/```(?:json)?|```/g, '').trim() };
    }

    // Ensure summary_text is clean readable prose (not JSON-like)
    if (parsed.summary_text && (parsed.summary_text.startsWith('{') || parsed.summary_text.startsWith('['))) {
      try {
        const inner = JSON.parse(parsed.summary_text);
        parsed.summary_text = inner.summary_text || inner.summary || JSON.stringify(inner, null, 2);
      } catch {
        // Already text, keep as is
      }
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
