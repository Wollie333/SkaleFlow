/**
 * Tracks framework progression through call template phases.
 */

export interface PhaseProgress {
  phaseId: string;
  phaseName: string;
  status: 'pending' | 'active' | 'completed';
  questionsAsked: number;
  questionsTotal: number;
}

export interface ProgressionState {
  phases: PhaseProgress[];
  currentPhaseId: string | null;
  completedPhases: number;
  totalPhases: number;
  progressPercent: number;
}

export class FrameworkProgression {
  private phases: Array<Record<string, unknown>>;
  private currentPhaseIdx: number = 0;
  private questionsAskedPerPhase: Map<string, Set<string>> = new Map();

  constructor(templatePhases: Array<Record<string, unknown>>) {
    this.phases = templatePhases;
    if (templatePhases.length > 0) {
      const firstId = templatePhases[0].id as string;
      this.questionsAskedPerPhase.set(firstId, new Set());
    }
  }

  /**
   * Mark a question as asked in the current phase.
   */
  markQuestionAsked(question: string): void {
    const currentPhase = this.phases[this.currentPhaseIdx];
    if (!currentPhase) return;
    const phaseId = currentPhase.id as string;
    if (!this.questionsAskedPerPhase.has(phaseId)) {
      this.questionsAskedPerPhase.set(phaseId, new Set());
    }
    this.questionsAskedPerPhase.get(phaseId)!.add(question);
  }

  /**
   * Move to the next phase.
   */
  advancePhase(): string | null {
    if (this.currentPhaseIdx < this.phases.length - 1) {
      this.currentPhaseIdx++;
      const newPhaseId = this.phases[this.currentPhaseIdx].id as string;
      if (!this.questionsAskedPerPhase.has(newPhaseId)) {
        this.questionsAskedPerPhase.set(newPhaseId, new Set());
      }
      return newPhaseId;
    }
    return null;
  }

  /**
   * Set current phase by ID.
   */
  setPhase(phaseId: string): boolean {
    const idx = this.phases.findIndex(p => p.id === phaseId);
    if (idx >= 0) {
      this.currentPhaseIdx = idx;
      return true;
    }
    return false;
  }

  /**
   * Get current progression state.
   */
  getState(): ProgressionState {
    const currentPhase = this.phases[this.currentPhaseIdx];
    const currentPhaseId = currentPhase ? (currentPhase.id as string) : null;

    const phases: PhaseProgress[] = this.phases.map((p, idx) => {
      const phaseId = p.id as string;
      const questions = (p.questions || []) as string[];
      const asked = this.questionsAskedPerPhase.get(phaseId)?.size || 0;

      let status: 'pending' | 'active' | 'completed' = 'pending';
      if (idx < this.currentPhaseIdx) status = 'completed';
      else if (idx === this.currentPhaseIdx) status = 'active';

      return {
        phaseId,
        phaseName: p.name as string,
        status,
        questionsAsked: asked,
        questionsTotal: questions.length,
      };
    });

    const completedPhases = phases.filter(p => p.status === 'completed').length;

    return {
      phases,
      currentPhaseId,
      completedPhases,
      totalPhases: this.phases.length,
      progressPercent: this.phases.length > 0
        ? Math.round((completedPhases / this.phases.length) * 100)
        : 0,
    };
  }

  get currentPhaseId(): string | null {
    return this.phases[this.currentPhaseIdx]?.id as string ?? null;
  }
}
