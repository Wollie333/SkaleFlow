/**
 * Live AI co-pilot — uses Claude API via existing provider abstraction.
 */

import type { CopilotProvider, CopilotContext, CopilotGuidance } from './index';
import { assembleCallContext } from './context';
import { buildCopilotSystemPrompt, buildAuditCopilotContext } from './prompts';
import type { AuditCopilotContext } from './prompts';

export class LiveCopilot implements CopilotProvider {
  async processTranscriptTurn(context: CopilotContext & { auditContext?: AuditCopilotContext }): Promise<CopilotGuidance | null> {
    const { callId, orgId, userId, transcriptTurn, speakerLabel } = context;

    try {
      // Assemble full context
      const assembled = await assembleCallContext(callId, orgId);

      // Build system prompt
      let systemPrompt = buildCopilotSystemPrompt(assembled, context.currentPhase || 'discovery');

      // Append audit context if in brand audit mode
      if (context.auditContext) {
        systemPrompt += '\n\n' + buildAuditCopilotContext(context.auditContext);
      }

      // Resolve model and check credits
      const { resolveModel, deductCredits } = await import('@/lib/ai/server');
      const { requireCredits } = await import('@/lib/ai/middleware');
      const { getProviderAdapterForUser } = await import('@/lib/ai/providers/registry');

      const resolved = await resolveModel(orgId, 'video_call_copilot', undefined, userId);

      // Check credits (skips for free models & super admins)
      const creditCheck = await requireCredits(
        orgId,
        resolved.id,
        500,  // estimated input tokens
        300,  // estimated output tokens
        userId
      );

      if (creditCheck) {
        console.warn('[CoPilot] Insufficient credits');
        return null;
      }

      // Get adapter
      const { adapter, usingUserKey } = await getProviderAdapterForUser(
        resolved.provider,
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
        modelId: resolved.modelId,
      });

      // Deduct credits (skips for free models, user keys, & super admins)
      if (!usingUserKey) {
        const { calculateCreditCost } = await import('@/lib/ai/credits');
        const credits = calculateCreditCost(resolved.id, response.inputTokens, response.outputTokens);
        await deductCredits(
          orgId,
          userId || null,
          credits,
          null,
          `Video call copilot guidance`
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
