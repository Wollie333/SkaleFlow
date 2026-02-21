import { createServiceClient } from '@/lib/supabase/server';
import type { CallType, Json } from '@/types/database';

export interface StrategicInsight {
  category: string;
  title: string;
  detail: string;
  priority: 'high' | 'medium' | 'low';
  actionable_step: string;
}

export interface StrategicInsightsResult {
  strategic_summary: string;
  action_steps: string[];
  insights: StrategicInsight[];
}

const PROMPTS_BY_TYPE: Record<CallType, string> = {
  sales: `Focus on: deal readiness assessment, buying signals identified, objection patterns and resolution effectiveness, closing assessment, strategic next steps to advance the deal.`,
  discovery: `Focus on: prospect qualification level (BANT/MEDDIC), needs analysis depth, opportunity sizing and potential, recommended approach for next interaction.`,
  onboarding: `Focus on: adoption risks and early warning signs, satisfaction signals, potential expansion opportunities, areas needing additional support.`,
  follow_up: `Focus on: relationship health indicators, commitment progress since last interaction, churn risk indicators, upsell/cross-sell opportunities.`,
  meeting: `Focus on: decision effectiveness assessment, alignment level among participants, blockers identified and resolution paths, meeting ROI.`,
  custom: `Focus on: key strategic takeaways, areas of risk or concern, relationship dynamics, recommended next steps.`,
};

export async function generateStrategicInsights(
  callId: string,
  orgId: string,
  userId: string
): Promise<StrategicInsightsResult | null> {
  const supabase = createServiceClient();

  // Get call details
  const { data: call } = await supabase
    .from('calls')
    .select('call_type, title, call_objective')
    .eq('id', callId)
    .single();

  if (!call) return null;

  const callType: CallType = (call.call_type as CallType) || 'custom';

  // Get transcript
  const { data: transcripts } = await supabase
    .from('call_transcripts')
    .select('speaker_label, content, timestamp_start')
    .eq('call_id', callId)
    .order('timestamp_start', { ascending: true });

  if (!transcripts || transcripts.length === 0) return null;

  const fullTranscript = transcripts.map(t => `[${t.speaker_label}]: ${t.content}`).join('\n');

  // Get summary for context
  const { data: summary } = await supabase
    .from('call_summaries')
    .select('summary_text, key_points, objections_raised, next_steps')
    .eq('call_id', callId)
    .single();

  const typePrompt = PROMPTS_BY_TYPE[callType] || PROMPTS_BY_TYPE.custom;

  try {
    const { resolveModel, deductCredits } = await import('@/lib/ai/server');
    const { getProviderAdapterForUser } = await import('@/lib/ai/providers/registry');

    const resolved = await resolveModel(orgId, 'video_call_copilot', undefined, userId);
    const { adapter, usingUserKey } = await getProviderAdapterForUser(resolved.provider, userId);

    const response = await adapter.complete({
      systemPrompt: `You are a senior business strategist analyzing a ${callType.replace('_', ' ')} call. Provide actionable strategic insights. Respond with ONLY JSON, no markdown code blocks.`,
      messages: [{
        role: 'user',
        content: `Call: ${call.title} (${callType.replace('_', ' ')})\nObjective: ${call.call_objective || 'Not set'}\n\nSummary: ${summary?.summary_text || 'N/A'}\nKey Points: ${JSON.stringify(summary?.key_points || [])}\nObjections: ${JSON.stringify(summary?.objections_raised || [])}\nNext Steps: ${JSON.stringify(summary?.next_steps || [])}\n\nFull Transcript:\n${fullTranscript.slice(0, 6000)}\n\n${typePrompt}\n\nRespond with JSON:\n{\n  "strategic_summary": "2-3 paragraph strategic analysis of this call",\n  "action_steps": ["Specific action step 1", "Action step 2", ...],\n  "insights": [\n    {\n      "category": "category name",\n      "title": "Insight title",\n      "detail": "Detailed explanation",\n      "priority": "high|medium|low",\n      "actionable_step": "What to do about this"\n    }\n  ]\n}`,
      }],
      maxTokens: 1500,
      temperature: 0.3,
      modelId: resolved.modelId,
      jsonMode: true,
    });

    // Track AI usage with call_id
    let credits = 0;
    if (!usingUserKey) {
      const { calculateCreditCost } = await import('@/lib/ai/credits');
      credits = calculateCreditCost(resolved.id, response.inputTokens, response.outputTokens);
    }

    const { data: usageRecord } = await supabase.from('ai_usage').insert({
      organization_id: orgId,
      user_id: userId,
      feature: 'call_strategic_insights',
      model: resolved.modelId,
      input_tokens: response.inputTokens,
      output_tokens: response.outputTokens,
      credits_charged: credits,
      provider: resolved.provider,
      is_free_model: resolved.isFree || false,
      call_id: callId,
    }).select('id').single();

    if (!usingUserKey && credits > 0) {
      await deductCredits(orgId, userId || null, credits, usageRecord?.id || null, 'Call strategic insights');
    }

    let parsed: StrategicInsightsResult;
    try {
      let cleaned = response.text.trim();
      if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
      }
      parsed = JSON.parse(cleaned);
    } catch {
      console.error('[StrategicInsights] Failed to parse AI response');
      return null;
    }

    // Store in call_summaries.brand_engine_insights (existing JSONB column)
    await supabase
      .from('call_summaries')
      .update({
        brand_engine_insights: parsed as unknown as Json,
        updated_at: new Date().toISOString(),
      })
      .eq('call_id', callId);

    return parsed;
  } catch (error) {
    console.error('[StrategicInsights] Generation failed:', error);
    return null;
  }
}
