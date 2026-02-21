import { createServiceClient } from '@/lib/supabase/server';
import { getScoringDimensions } from './scoring-config';
import type { CallType, Json } from '@/types/database';

export interface ScoreDimension {
  key: string;
  label: string;
  score: number;
  justification: string;
}

export interface CallScore {
  overall: number;
  dimensions: ScoreDimension[];
}

// Legacy flat format for backward compat
export interface LegacyCallScore {
  overall: number;
  frameworkAdherence: number;
  talkRatio: number;
  questionQuality: number;
  objectionHandling: number;
  closingEffectiveness: number;
}

export async function scoreCall(callId: string, orgId: string, userId: string) {
  const supabase = createServiceClient();

  // Get call type
  const { data: call } = await supabase
    .from('calls')
    .select('call_type')
    .eq('id', callId)
    .single();

  const callType: CallType = (call?.call_type as CallType) || 'custom';

  // Get summary text for AI context
  const { data: summary } = await supabase
    .from('call_summaries')
    .select('summary_text, key_points, objections_raised, next_steps')
    .eq('call_id', callId)
    .single();

  // Get guidance usage stats
  const { data: guidance } = await supabase
    .from('call_ai_guidance')
    .select('was_used, was_dismissed, guidance_type')
    .eq('call_id', callId);

  const totalGuidance = guidance?.length || 0;
  const usedGuidance = guidance?.filter(g => g.was_used).length || 0;

  // Get scoring dimensions for this call type
  const dimensions = getScoringDimensions(callType);

  const dimensionPrompt = dimensions.map(d =>
    `- ${d.key} (${d.label}): ${d.description} [weight: ${d.weight}]`
  ).join('\n');

  const contextParts = [
    `Call type: ${callType}`,
    `Summary: ${summary?.summary_text || 'No summary available'}`,
    `Key points: ${JSON.stringify(summary?.key_points || [])}`,
    `Objections: ${JSON.stringify(summary?.objections_raised || [])}`,
    `Next steps: ${JSON.stringify(summary?.next_steps || [])}`,
    `Guidance usage: ${usedGuidance}/${totalGuidance} suggestions used`,
  ];

  try {
    const { resolveModel, deductCredits } = await import('@/lib/ai/server');
    const { getProviderAdapterForUser } = await import('@/lib/ai/providers/registry');

    const resolved = await resolveModel(orgId, 'video_call_copilot', undefined, userId);
    const { adapter, usingUserKey } = await getProviderAdapterForUser(resolved.provider, userId);

    const response = await adapter.complete({
      systemPrompt: `You are a call performance analyst. Score the call on each dimension from 0-100 with a brief justification (1 sentence). Respond with ONLY a JSON object, no markdown.`,
      messages: [{
        role: 'user',
        content: `${contextParts.join('\n')}\n\nScore each dimension:\n${dimensionPrompt}\n\nRespond with JSON:\n{"dimensions": [{"key": "dimension_key", "score": 0-100, "justification": "brief reason"}]}`,
      }],
      maxTokens: 800,
      temperature: 0.2,
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
      feature: 'call_scoring',
      model: resolved.modelId,
      input_tokens: response.inputTokens,
      output_tokens: response.outputTokens,
      credits_charged: credits,
      provider: resolved.provider,
      is_free_model: resolved.isFree || false,
      call_id: callId,
    }).select('id').single();

    if (!usingUserKey && credits > 0) {
      await deductCredits(orgId, userId || null, credits, usageRecord?.id || null, 'Call scoring');
    }

    let parsed: { dimensions?: Array<{ key: string; score: number; justification: string }> };
    try {
      let cleaned = response.text.trim();
      if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
      }
      parsed = JSON.parse(cleaned);
    } catch {
      // Fallback to heuristic scoring
      return fallbackScore(callId, dimensions, totalGuidance, usedGuidance, supabase);
    }

    // Build structured score
    const scoredDimensions: ScoreDimension[] = dimensions.map(dim => {
      const aiDim = parsed.dimensions?.find(d => d.key === dim.key);
      return {
        key: dim.key,
        label: dim.label,
        score: Math.max(0, Math.min(100, aiDim?.score ?? 50)),
        justification: aiDim?.justification || '',
      };
    });

    const overall = Math.round(
      scoredDimensions.reduce((acc, d) => {
        const config = dimensions.find(dim => dim.key === d.key);
        return acc + d.score * (config?.weight || 0.2);
      }, 0)
    );

    const score: CallScore = {
      overall: Math.max(0, Math.min(100, overall)),
      dimensions: scoredDimensions,
    };

    await supabase
      .from('call_summaries')
      .update({ call_score: score as unknown as Json, updated_at: new Date().toISOString() })
      .eq('call_id', callId);

    return score;
  } catch (error) {
    console.error('[Scoring] AI scoring failed, using fallback:', error);
    return fallbackScore(callId, dimensions, totalGuidance, usedGuidance, supabase);
  }
}

async function fallbackScore(
  callId: string,
  dimensions: ReturnType<typeof getScoringDimensions>,
  totalGuidance: number,
  usedGuidance: number,
  supabase: ReturnType<typeof createServiceClient>
) {
  const adherenceScore = totalGuidance > 0 ? Math.round((usedGuidance / totalGuidance) * 100) : 50;

  const scoredDimensions: ScoreDimension[] = dimensions.map(dim => ({
    key: dim.key,
    label: dim.label,
    score: dim.key.includes('framework') || dim.key.includes('adherence') ? adherenceScore : 50,
    justification: 'AI scoring unavailable — default score applied',
  }));

  const overall = Math.round(
    scoredDimensions.reduce((acc, d) => {
      const config = dimensions.find(dim => dim.key === d.key);
      return acc + d.score * (config?.weight || 0.2);
    }, 0)
  );

  const score: CallScore = { overall, dimensions: scoredDimensions };

  await supabase
    .from('call_summaries')
    .update({ call_score: score as unknown as Json, updated_at: new Date().toISOString() })
    .eq('call_id', callId);

  return score;
}
