/**
 * Mock co-pilot — returns guidance from template phases.
 * Zero API cost, good for dev/testing.
 */

import type { CopilotProvider, CopilotContext, CopilotGuidance } from './index';

export class MockCopilot implements CopilotProvider {
  async processTranscriptTurn(context: CopilotContext): Promise<CopilotGuidance | null> {
    const { templatePhases, currentPhase, transcriptTurn, previousGuidance } = context;

    if (!templatePhases || !Array.isArray(templatePhases) || templatePhases.length === 0) {
      return null;
    }

    const phases = templatePhases as Record<string, unknown>[];

    // Find current phase
    const phase = phases.find(p => p.id === currentPhase);
    if (!phase) {
      // Suggest starting the first phase
      const firstPhase = phases[0];
      return {
        guidanceType: 'phase_transition',
        content: `Start with: ${firstPhase.name}. ${firstPhase.description || ''}`,
        frameworkPhase: firstPhase.id as string,
      };
    }

    // Check if we should transition to next phase
    const triggers = (phase.transitionTriggers || []) as string[];
    const lowerTranscript = transcriptTurn.toLowerCase();
    const shouldTransition = triggers.some(t =>
      lowerTranscript.includes(t.toLowerCase())
    );

    if (shouldTransition) {
      const currentIdx = phases.findIndex(p => p.id === currentPhase);
      if (currentIdx < phases.length - 1) {
        const nextPhase = phases[currentIdx + 1];
        return {
          guidanceType: 'phase_transition',
          content: `Good progress! Move to: ${nextPhase.name}. ${nextPhase.description || ''}`,
          frameworkPhase: nextPhase.id as string,
        };
      } else {
        return {
          guidanceType: 'closing',
          content: 'All phases covered. Time to wrap up and confirm next steps.',
          frameworkPhase: currentPhase,
        };
      }
    }

    // Suggest next unanswered question from current phase
    const questions = (phase.questions || []) as string[];
    const askedQuestions = previousGuidance
      .filter(g => g.type === 'question')
      .map(g => g.content);

    const nextQuestion = questions.find(q => !askedQuestions.includes(q));
    if (nextQuestion) {
      // Add simulated delay for realism
      await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 1200));

      return {
        guidanceType: 'question',
        content: nextQuestion,
        frameworkPhase: currentPhase,
        frameworkStep: phase.name as string,
      };
    }

    // If all questions asked, suggest phase AI instructions
    const aiInstructions = phase.aiInstructions as string;
    if (aiInstructions && !previousGuidance.some(g => g.content === aiInstructions)) {
      return {
        guidanceType: 'general',
        content: aiInstructions,
        frameworkPhase: currentPhase,
      };
    }

    return null;
  }
}
