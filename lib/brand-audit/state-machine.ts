/**
 * Brand Audit status state machine.
 * Encodes valid transitions from the spec.
 */

import type { BrandAuditStatus } from '@/types/database';

const TRANSITIONS: Record<BrandAuditStatus, BrandAuditStatus[]> = {
  draft: ['in_progress', 'call_scheduled', 'abandoned'],
  in_progress: ['review', 'abandoned'],
  call_scheduled: ['call_in_progress', 'abandoned'],
  call_in_progress: ['call_complete', 'abandoned'],
  call_complete: ['review', 'in_progress', 'abandoned'], // in_progress for hybrid fill-gaps
  review: ['scoring', 'in_progress', 'abandoned'], // back to in_progress if more edits needed
  scoring: ['complete', 'review'], // back to review on failure
  complete: ['report_generated', 'scoring'], // re-score allowed
  report_generated: ['delivered', 'complete'], // re-generate allowed
  delivered: ['report_generated'], // new version
  abandoned: [], // terminal
};

export function isValidTransition(from: BrandAuditStatus, to: BrandAuditStatus): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false;
}

export function getValidNextStatuses(current: BrandAuditStatus): BrandAuditStatus[] {
  return TRANSITIONS[current] ?? [];
}
