import { createServiceClient } from '@/lib/supabase/server';

export async function extractBrandInsights(callId: string, orgId: string, userId: string) {
  const supabase = createServiceClient();

  const { data: transcripts } = await supabase
    .from('call_transcripts')
    .select('id, speaker_label, content')
    .eq('call_id', callId)
    .order('timestamp_start', { ascending: true });

  if (!transcripts || transcripts.length < 3) return [];

  // Only analyse guest speech
  const { data: participants } = await supabase
    .from('call_participants')
    .select('id, role')
    .eq('call_id', callId);

  const guestTranscripts = transcripts.filter(t =>
    !t.speaker_label.toLowerCase().includes('host') && t.speaker_label !== 'You'
  );

  if (guestTranscripts.length === 0) return [];

  const guestText = guestTranscripts.map(t => t.content).join('\n');

  try {
    const { resolveModel, deductCredits } = await import('@/lib/ai/server');
    const { getProviderAdapterForUser } = await import('@/lib/ai/providers/registry');

    const resolved = await resolveModel(orgId, 'video_call_copilot', undefined, userId);
    const { adapter, usingUserKey } = await getProviderAdapterForUser(resolved.provider, userId);

    const response = await adapter.complete({
      systemPrompt: `Extract market intelligence insights from prospect speech during a sales call. Identify patterns valuable for brand strategy.`,
      messages: [{
        role: 'user',
        content: `Prospect speech from call:\n${guestText}\n\nExtract insights as JSON array:\n[{"insight_type": "pain_point|language_pattern|objection|budget_signal|need|competitor_mention|value_perception", "content": "the insight", "brand_engine_field": "suggested brand_outputs key or null"}]`,
      }],
      maxTokens: 1000,
      temperature: 0.3,
      modelId: resolved.modelId,
    });

    let credits = 0;
    if (!usingUserKey) {
      const { calculateCreditCost } = await import('@/lib/ai/credits');
      credits = calculateCreditCost(resolved.id, response.inputTokens, response.outputTokens);
    }

    const { data: usageRecord } = await supabase.from('ai_usage').insert({
      organization_id: orgId,
      user_id: userId,
      feature: 'call_brand_insights',
      model: resolved.modelId,
      input_tokens: response.inputTokens,
      output_tokens: response.outputTokens,
      credits_charged: credits,
      provider: resolved.provider,
      is_free_model: resolved.isFree || false,
      call_id: callId,
    }).select('id').single();

    if (!usingUserKey && credits > 0) {
      await deductCredits(orgId, userId || null, credits, usageRecord?.id || null, 'Call brand insights extraction');
    }

    let insights;
    try {
      insights = JSON.parse(response.text);
    } catch {
      return [];
    }

    if (!Array.isArray(insights)) return [];

    const validTypes = ['pain_point', 'language_pattern', 'objection', 'budget_signal', 'need', 'competitor_mention', 'value_perception'] as const;
    type ValidInsightType = typeof validTypes[number];
    const inserts = insights.slice(0, 10).map((i: Record<string, string>) => ({
      call_id: callId,
      organization_id: orgId,
      insight_type: (validTypes.includes(i.insight_type as ValidInsightType) ? i.insight_type : 'need') as ValidInsightType,
      content: i.content || '',
      brand_engine_field: i.brand_engine_field || null,
      status: 'pending' as const,
    }));

    if (inserts.length > 0) {
      await supabase.from('call_brand_insights').insert(inserts);
    }

    return inserts;
  } catch (error) {
    console.error('[Insights] Extraction failed:', error);
    return [];
  }
}
