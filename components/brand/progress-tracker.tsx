'use client';

import { cn } from '@/lib/utils';
import type { PhaseStatus } from '@/types/database';

interface Phase {
  id: string;
  phase_number: string;
  phase_name: string;
  status: PhaseStatus;
}

interface ProgressTrackerProps {
  phases: Phase[];
  currentPhaseId?: string;
  onPhaseClick?: (phase: Phase) => void;
}

export function ProgressTracker({ phases, currentPhaseId, onPhaseClick }: ProgressTrackerProps) {
  return (
    <div className="bg-white rounded-xl border border-stone/10 p-6">
      <h3 className="text-heading-sm text-charcoal mb-4">Brand Engine Progress</h3>

      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-stone">Progress</span>
          <span className="text-xs font-medium text-teal">
            {phases.filter(p => p.status === 'locked' || p.status === 'completed').length} / {phases.length}
          </span>
        </div>
        <div className="w-full bg-stone/10 rounded-full h-2">
          <div
            className="bg-teal h-2 rounded-full transition-all duration-500"
            style={{
              width: `${(phases.filter(p => p.status === 'locked' || p.status === 'completed').length / phases.length) * 100}%`,
            }}
          />
        </div>
      </div>

      <div className="space-y-2 max-h-[60vh] overflow-y-auto">
        {phases.map((phase) => {
          const isActive = phase.id === currentPhaseId;
          const isCompleted = phase.status === 'locked' || phase.status === 'completed';
          const isInProgress = phase.status === 'in_progress';
          const isClickable = isCompleted || isInProgress || isActive;

          return (
            <button
              key={phase.id}
              onClick={() => isClickable && onPhaseClick?.(phase)}
              disabled={!isClickable}
              className={cn(
                'w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors',
                isActive && 'bg-teal/10 border border-teal/20',
                isCompleted && !isActive && 'bg-cream-warm',
                !isCompleted && !isActive && 'opacity-50',
                isClickable && !isActive && 'hover:bg-cream-warm cursor-pointer',
                !isClickable && 'cursor-not-allowed'
              )}
            >
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0',
                  isCompleted && 'bg-teal text-cream',
                  isInProgress && !isActive && 'bg-teal/20 text-teal',
                  isActive && 'bg-teal/20 text-teal ring-2 ring-teal',
                  !isCompleted && !isInProgress && !isActive && 'bg-stone/20 text-stone'
                )}
              >
                {isCompleted ? '✓' : phase.phase_number}
              </div>

              <div className="flex-1 min-w-0">
                <p
                  className={cn(
                    'text-sm font-medium truncate',
                    isActive ? 'text-teal' : 'text-charcoal'
                  )}
                >
                  Phase {phase.phase_number}
                </p>
                <p className="text-xs text-stone truncate">{phase.phase_name}</p>
              </div>

              {isInProgress && !isActive && (
                <span className="text-xs bg-teal/10 text-teal px-2 py-0.5 rounded-full">
                  Active
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
