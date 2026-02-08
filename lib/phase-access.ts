import type { PhaseStatus } from '@/types/database';

interface PhaseForAccess {
  id: string;
  status: PhaseStatus;
}

/**
 * Determines whether a phase is accessible given the sequential progression rule.
 * A phase is accessible if:
 *  - It's the first phase (index 0)
 *  - Its status is 'locked', 'completed', or 'in_progress'
 *  - Its status is 'not_started' AND the previous phase is 'locked' or 'completed'
 *
 * Phases must be sorted by sort_order before calling this function.
 */
export function isPhaseAccessible(phases: PhaseForAccess[], targetPhaseId: string): boolean {
  const index = phases.findIndex(p => p.id === targetPhaseId);
  if (index === -1) return false;
  if (index === 0) return true;

  const phase = phases[index];
  if (phase.status === 'locked' || phase.status === 'completed' || phase.status === 'in_progress') {
    return true;
  }

  // not_started: accessible only if the previous phase is locked/completed
  const prev = phases[index - 1];
  return prev.status === 'locked' || prev.status === 'completed';
}

/**
 * Returns the index of the current "frontier" phase — the first phase that is
 * in_progress, or the first not_started whose predecessor is locked/completed.
 * Returns 0 if no frontier is found (all completed or empty).
 */
export function getActivePhaseIndex(phases: PhaseForAccess[]): number {
  for (let i = 0; i < phases.length; i++) {
    if (phases[i].status === 'in_progress') return i;
    if (phases[i].status === 'not_started') {
      if (i === 0) return 0;
      const prev = phases[i - 1];
      if (prev.status === 'locked' || prev.status === 'completed') return i;
    }
  }
  return 0;
}
