/**
 * Live AI co-pilot — uses Claude API via existing provider abstraction.
 */

import type { CopilotProvider, CopilotContext, CopilotGuidance } from './index';
import { assembleCallContext } from './context';
import { buildCopilotSystemPrompt } from './prompts';

export class LiveCopilot implements CopilotProvider {
  async processTranscriptTurn(context: CopilotContext): Promise<CopilotGuidance | null> {
    const { callId, orgId, userId, transcriptTurn, speakerLabel } = context;

    try {
      // Assemble full context
      const assembled = await assembleCallContext(callId, orgId);

      // Build system prompt
      const systemPrompt = buildCopilotSystemPrompt(assembled, context.currentPhase || 'discovery');

      // Resolve model and check credits
      const { resolveModel } = await import('@/lib/ai/middleware');
      const { requireCredits, deductCredits } = await import('@/lib/ai/credits');
      const { getProviderAdapterForUser } = await import('@/lib/ai/providers/registry');
      const { getModelConfig } = await import('@/lib/ai/providers/catalog');

      const resolved = await resolveModel(orgId, 'video_call_copilot', undefined, userId);
      const modelConfig = getModelConfig(resolved.modelId);

      if (!modelConfig) {
        console.error('[CoPilot] No model config found for', resolved.modelId);
        return null;
      }

      // Check credits (skips for free models & super admins)
      const creditCheck = await requireCredits(
        orgId,
        'video_call_copilot',
        modelConfig.estimatedCreditsPerMessage,
        resolved.modelId,
        userId
      );

      if (creditCheck && 'error' in creditCheck) {
        console.warn('[CoPilot] Insufficient credits');
        return null;
      }

      // Get adapter
      const { adapter, usingUserKey } = await getProviderAdapterForUser(
        modelConfig.provider,
        userId
      );

      // Call AI
      const response = await adapter.complete({
        systemPrompt,
        messages: [
          {
            role: 'user',
            content: `Latest transcript turn:\n[${speakerLabel}]: ${transcriptTurn}\n\nRecent conversation:\n${assembled.recentTranscript}\n\nProvide your next guidance suggestion.`,
          },
        ],
        maxTokens: 300,
        temperature: 0.3,
        modelId: modelConfig.modelId,
      });

      // Deduct credits (skips for free models, user keys, & super admins)
      if (!usingUserKey) {
        await deductCredits(
          orgId,
          'video_call_copilot',
          response.inputTokens,
          response.outputTokens,
          modelConfig.provider,
          resolved.modelId,
          userId
        );
      }

      // Parse response
      try {
        const parsed = JSON.parse(response.text);
        if (parsed.skip) return null;

        return {
          guidanceType: parsed.guidanceType || 'general',
          content: parsed.content || response.text,
          frameworkPhase: parsed.frameworkPhase || undefined,
          frameworkStep: parsed.frameworkStep || undefined,
        };
      } catch {
        // If not valid JSON, return as general guidance
        return {
          guidanceType: 'general',
          content: response.text.trim(),
        };
      }
    } catch (error) {
      console.error('[CoPilot] Live processing failed:', error);
      return null;
    }
  }
}
