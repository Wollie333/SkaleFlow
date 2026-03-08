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

// ─── Presence Engine Phase Access ─────────────────────────────────────────

interface PresencePhaseForAccess {
  id: string;
  status: string; // includes 'skipped'
}

/**
 * Determines whether a presence phase is accessible.
 * Same sequential logic as brand engine, but handles 'skipped' phases:
 * - Skipped phases are never accessible (they're auto-skipped when platform is inactive)
 * - Skipped phases don't block progression — they're treated as "completed" for access purposes
 */
export function isPresencePhaseAccessible(phases: PresencePhaseForAccess[], targetPhaseId: string): boolean {
  const index = phases.findIndex(p => p.id === targetPhaseId);
  if (index === -1) return false;

  const phase = phases[index];
  if (phase.status === 'skipped') return false;
  if (index === 0) return true;
  if (phase.status === 'locked' || phase.status === 'completed' || phase.status === 'in_progress') {
    return true;
  }

  // Find previous non-skipped phase
  for (let i = index - 1; i >= 0; i--) {
    if (phases[i].status === 'skipped') continue;
    return phases[i].status === 'locked' || phases[i].status === 'completed';
  }

  // All previous phases are skipped — this phase is accessible
  return true;
}

/**
 * Returns the active phase index for presence engine, skipping over skipped phases.
 */
export function getActivePresencePhaseIndex(phases: PresencePhaseForAccess[]): number {
  for (let i = 0; i < phases.length; i++) {
    if (phases[i].status === 'skipped') continue;
    if (phases[i].status === 'in_progress') return i;
    if (phases[i].status === 'not_started') {
      // Check if all previous non-skipped phases are completed/locked
      const prevNonSkipped = phases.slice(0, i).filter(p => p.status !== 'skipped');
      if (prevNonSkipped.length === 0) return i;
      const lastPrev = prevNonSkipped[prevNonSkipped.length - 1];
      if (lastPrev.status === 'locked' || lastPrev.status === 'completed') return i;
    }
  }
  return 0;
}
