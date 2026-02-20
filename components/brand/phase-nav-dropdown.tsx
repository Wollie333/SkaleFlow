'use client';

import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { ChevronUpDownIcon, LockClosedIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { isPhaseAccessible } from '@/lib/phase-access';
import type { PhaseStatus } from '@/types/database';

interface Phase {
  id: string;
  phase_number: string;
  phase_name: string;
  status: PhaseStatus;
}

interface PhaseNavDropdownProps {
  phases: Phase[];
  currentPhaseId: string;
  onPhaseClick: (phase: Phase) => void;
}

export function PhaseNavDropdown({ phases, currentPhaseId, onPhaseClick }: PhaseNavDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const currentPhase = phases.find(p => p.id === currentPhaseId);
  const completedCount = phases.filter(p => p.status === 'locked' || p.status === 'completed').length;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!currentPhase) return null;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-lg border border-stone/15 bg-cream-warm px-3 py-2 hover:bg-cream-warm transition-colors w-full"
      >
        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-teal/10 text-teal text-xs font-bold flex-shrink-0">
          {currentPhase.phase_number}
        </span>
        <div className="flex-1 text-left min-w-0">
          <p className="text-sm font-medium text-charcoal truncate">
            Phase {currentPhase.phase_number}: {currentPhase.phase_name}
          </p>
          <p className="text-[11px] text-stone">
            {completedCount} of {phases.length} complete
          </p>
        </div>
        <ChevronUpDownIcon className="w-4 h-4 text-stone flex-shrink-0" />
      </button>

      {isOpen && (
        <div className="absolute top-full mt-1 left-0 right-0 z-50 bg-cream-warm rounded-lg shadow-lg border border-stone/15 py-1 max-h-80 overflow-y-auto">
          {phases.map((phase) => {
            const isActive = phase.id === currentPhaseId;
            const isCompleted = phase.status === 'locked' || phase.status === 'completed';
            const accessible = isPhaseAccessible(phases, phase.id);

            return (
              <button
                key={phase.id}
                onClick={() => {
                  if (accessible) {
                    onPhaseClick(phase);
                    setIsOpen(false);
                  }
                }}
                disabled={!accessible}
                className={cn(
                  'w-full text-left px-3 py-2 flex items-center gap-2.5 transition-colors',
                  accessible && 'hover:bg-cream-warm cursor-pointer',
                  !accessible && 'opacity-40 cursor-not-allowed',
                  isActive && 'bg-teal/5'
                )}
              >
                <span
                  className={cn(
                    'flex items-center justify-center w-6 h-6 rounded-full text-[11px] font-semibold flex-shrink-0',
                    isCompleted && 'bg-teal text-cream',
                    isActive && !isCompleted && 'bg-teal/20 text-teal ring-1.5 ring-teal',
                    !isCompleted && !isActive && accessible && 'bg-stone/10 text-stone',
                    !accessible && 'bg-stone/10 text-stone'
                  )}
                >
                  {isCompleted ? (
                    <CheckCircleIcon className="w-4 h-4" />
                  ) : !accessible ? (
                    <LockClosedIcon className="w-3 h-3" />
                  ) : (
                    phase.phase_number
                  )}
                </span>
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    'text-sm truncate',
                    isActive ? 'font-medium text-teal' : 'text-charcoal'
                  )}>
                    {phase.phase_name}
                  </p>
                </div>
                {phase.status === 'in_progress' && !isActive && (
                  <span className="text-[10px] bg-teal/10 text-teal px-1.5 py-0.5 rounded-full flex-shrink-0">
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
