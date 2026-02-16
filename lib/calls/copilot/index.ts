/**
 * AI Co-Pilot provider abstraction.
 * Switches between mock (template-based) and live (Claude API) based on config.
 */

import { CALL_CONFIG } from '../config';

export interface CopilotContext {
  callId: string;
  orgId: string;
  userId: string;
  templatePhases: unknown[];
  currentPhase: string;
  currentStep: string;
  callObjective: string;
  transcriptTurn: string;
  speakerLabel: string;
  previousGuidance: Array<{ type: string; content: string }>;
}

export interface CopilotGuidance {
  guidanceType: string;
  content: string;
  frameworkPhase?: string;
  frameworkStep?: string;
}

export interface CopilotProvider {
  processTranscriptTurn(context: CopilotContext): Promise<CopilotGuidance | null>;
}

let _provider: CopilotProvider | null = null;

export async function getCopilotProvider(): Promise<CopilotProvider> {
  if (_provider) return _provider;

  if (CALL_CONFIG.copilotProvider === 'live') {
    const { LiveCopilot } = await import('./live');
    _provider = new LiveCopilot();
  } else {
    const { MockCopilot } = await import('./mock');
    _provider = new MockCopilot();
  }

  return _provider;
}

// Allow resetting for testing
export function resetCopilotProvider(): void {
  _provider = null;
}
