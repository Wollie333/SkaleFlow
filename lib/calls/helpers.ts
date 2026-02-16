import type { CallType, CallStatus } from '@/types/database';

export const CALL_TYPE_LABELS: Record<CallType, string> = {
  discovery: 'Discovery Call',
  sales: 'Sales Call',
  onboarding: 'Onboarding',
  meeting: 'Meeting',
  follow_up: 'Follow-up',
  custom: 'Custom',
};

export const CALL_STATUS_LABELS: Record<CallStatus, string> = {
  scheduled: 'Scheduled',
  waiting: 'Waiting Room',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
  no_show: 'No Show',
};

export const CALL_STATUS_COLORS: Record<CallStatus, string> = {
  scheduled: 'bg-blue-100 text-blue-700',
  waiting: 'bg-yellow-100 text-yellow-700',
  in_progress: 'bg-green-100 text-green-700',
  completed: 'bg-gray-100 text-gray-700',
  cancelled: 'bg-red-100 text-red-700',
  no_show: 'bg-orange-100 text-orange-700',
};

/**
 * Format call duration from minutes to human-readable string.
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
}

/**
 * Calculate call duration from actual_start and actual_end.
 */
export function getCallDuration(start: string | null, end: string | null): number | null {
  if (!start || !end) return null;
  return Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60_000);
}
