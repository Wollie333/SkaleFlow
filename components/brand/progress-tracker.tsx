'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { isPhaseAccessible } from '@/lib/phase-access';
import { LockClosedIcon } from '@heroicons/react/24/solid';
import { ChevronDownIcon, PencilSquareIcon } from '@heroicons/react/24/outline';
import type { PhaseStatus } from '@/types/database';

interface Phase {
  id: string;
  phase_number: string;
  phase_name: string;
  status: PhaseStatus;
  current_question_index?: number;
}

interface ProgressTrackerProps {
  phases: Phase[];
  currentPhaseId?: string;
  onPhaseClick?: (phase: Phase) => void;
  onUnlockPhase?: (phaseId: string) => void;
}

export function ProgressTracker({ phases, currentPhaseId, onPhaseClick, onUnlockPhase }: ProgressTrackerProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const completedCount = phases.filter(p => p.status === 'locked' || p.status === 'completed').length;

  return (
    <div className="bg-cream-warm rounded-xl border border-stone/10 p-6">
      {/* Header — always visible, clickable to toggle */}
      <button
        type="button"
        onClick={() => setIsExpanded(prev => !prev)}
        className="w-full flex items-center justify-between"
      >
        <h3 className="text-heading-sm text-charcoal">Brand Engine Progress</h3>
        <ChevronDownIcon
          className={cn(
            'w-5 h-5 text-stone transition-transform duration-200',
            isExpanded && 'rotate-180'
          )}
        />
      </button>

      {/* Progress bar — always visible */}
      <div className="mt-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-stone">Progress</span>
          <span className="text-xs font-medium text-teal">
            {completedCount} / {phases.length}
          </span>
        </div>
        <div className="w-full bg-stone/10 rounded-full h-2">
          <div
            className="bg-teal h-2 rounded-full transition-all duration-500"
            style={{
              width: `${(completedCount / phases.length) * 100}%`,
            }}
          />
        </div>
      </div>

      {/* Phase list — collapsible */}
      {isExpanded && (
        <div className="space-y-2 max-h-[60vh] overflow-y-auto mt-4">
          {phases.map((phase) => {
            const isActive = phase.id === currentPhaseId;
            const isCompleted = phase.status === 'locked' || phase.status === 'completed';
            const isInProgress = phase.status === 'in_progress';
            const accessible = isPhaseAccessible(phases, phase.id);

            return (
              <button
                key={phase.id}
                onClick={() => accessible && onPhaseClick?.(phase)}
                disabled={!accessible}
                className={cn(
                  'w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors',
                  accessible && 'cursor-pointer',
                  !accessible && 'cursor-not-allowed opacity-40',
                  isActive && 'bg-teal/10 border border-teal/20',
                  isCompleted && !isActive && 'bg-cream-warm',
                  accessible && !isCompleted && !isInProgress && !isActive && 'opacity-60',
                  accessible && !isActive && 'hover:bg-cream'
                )}
              >
                <div
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0',
                    isCompleted && 'bg-teal text-cream',
                    accessible && isInProgress && !isActive && 'bg-teal/20 text-teal',
                    isActive && 'bg-teal/20 text-teal ring-2 ring-teal',
                    !accessible && 'bg-stone/20 text-stone',
                    accessible && !isCompleted && !isInProgress && !isActive && 'bg-stone/20 text-stone'
                  )}
                >
                  {isCompleted ? '✓' : !accessible ? (
                    <LockClosedIcon className="w-3.5 h-3.5" />
                  ) : (
                    phase.phase_number
                  )}
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

                {isCompleted && onUnlockPhase && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onUnlockPhase(phase.id);
                    }}
                    className="p-1 text-stone hover:text-teal hover:bg-teal/10 rounded transition-colors"
                    title="Edit this phase"
                  >
                    <PencilSquareIcon className="w-3.5 h-3.5" />
                  </button>
                )}
                {!accessible && (
                  <span className="text-xs bg-stone/10 text-stone px-2 py-0.5 rounded-full">
                    Locked
                  </span>
                )}
                {accessible && isInProgress && !isActive && (
                  <span className="text-xs bg-teal/10 text-teal px-2 py-0.5 rounded-full">
                    Active
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
