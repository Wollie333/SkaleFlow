'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import {
  XMarkIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from '@heroicons/react/24/outline';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import { VariablePreviewCard } from './variable-preview-card';
import { formatOutputKey } from '@/lib/brand/format-utils';
import type { Json } from '@/types/database';

interface BrandOutput {
  id: string;
  output_key: string;
  output_value: Json;
  is_locked: boolean;
}

interface ProgressSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  phaseName: string;
  phaseNumber: string;
  totalQuestions: number;
  currentQuestionIndex: number;
  phaseComplete: boolean;
  questionOutputMap: Record<number, string[]>;
  questions: string[];
  outputs: BrandOutput[];
  onAiChat: (outputKey: string) => void;
  onManualEdit: (outputKey: string, newValue: string) => Promise<void> | void;
  onLockVariable: (outputKey: string) => void;
  onUnlockVariable: (outputKey: string) => void;
  savingKey?: string | null;
  lockingKey?: string | null;
}

export function ProgressSidebar({
  isOpen,
  onClose,
  phaseName,
  phaseNumber,
  totalQuestions,
  currentQuestionIndex,
  phaseComplete,
  questionOutputMap,
  questions,
  outputs,
  onAiChat,
  onManualEdit,
  onLockVariable,
  onUnlockVariable,
  savingKey,
  lockingKey,
}: ProgressSidebarProps) {
  const [collapsedQuestions, setCollapsedQuestions] = useState<Set<number>>(new Set());

  const outputMap = new Map(outputs.map(o => [o.output_key, o]));

  // Calculate phase completion percentage
  const allOutputKeys = Object.values(questionOutputMap).flat();
  const filledCount = allOutputKeys.filter(key => outputMap.has(key)).length;
  const lockedCount = allOutputKeys.filter(key => outputMap.get(key)?.is_locked).length;
  const completionPercent = allOutputKeys.length > 0
    ? Math.round((lockedCount / allOutputKeys.length) * 100)
    : 0;

  const toggleQuestion = (qIndex: number) => {
    setCollapsedQuestions(prev => {
      const next = new Set(prev);
      if (next.has(qIndex)) {
        next.delete(qIndex);
      } else {
        next.add(qIndex);
      }
      return next;
    });
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-dark/30 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar drawer */}
      <div
        className={cn(
          'fixed top-0 right-0 h-full w-[340px] max-w-[85vw] bg-cream-warm border-l border-stone/10 shadow-xl z-50 transform transition-transform duration-300',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-stone/10">
          <div>
            <h3 className="text-sm font-semibold text-charcoal">
              Phase {phaseNumber} Progress
            </h3>
            <p className="text-xs text-stone mt-0.5">{phaseName}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone hover:text-charcoal hover:bg-stone/10 transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="px-4 py-3 border-b border-stone/10">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-stone">
              {lockedCount}/{allOutputKeys.length} confirmed
            </span>
            <span className="font-medium text-teal">{completionPercent}%</span>
          </div>
          <div className="w-full bg-stone/10 rounded-full h-1.5">
            <div
              className="bg-teal h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${completionPercent}%` }}
            />
          </div>
          {filledCount > lockedCount && (
            <p className="text-[10px] text-gold mt-1">
              {filledCount - lockedCount} draft{filledCount - lockedCount !== 1 ? 's' : ''} awaiting confirmation
            </p>
          )}
        </div>

        {/* Variables grouped by question */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ maxHeight: 'calc(100vh - 140px)' }}>
          {Array.from({ length: totalQuestions }, (_, qIndex) => {
            const keys = questionOutputMap[qIndex] || [];
            if (keys.length === 0) return null;

            const isCollapsed = collapsedQuestions.has(qIndex);
            const isCurrent = qIndex === currentQuestionIndex && !phaseComplete;
            const allLocked = keys.every(k => outputMap.get(k)?.is_locked);
            const allFilled = keys.every(k => outputMap.has(k));

            return (
              <div
                key={qIndex}
                className={cn(
                  'rounded-lg border transition-colors',
                  isCurrent
                    ? 'border-teal/30 bg-teal/[0.02]'
                    : 'border-stone/10'
                )}
              >
                {/* Question header */}
                <button
                  type="button"
                  onClick={() => toggleQuestion(qIndex)}
                  className="w-full flex items-center justify-between px-3 py-2.5 text-left"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className={cn(
                      'w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-semibold',
                      allLocked
                        ? 'bg-teal text-cream'
                        : allFilled
                          ? 'bg-gold/15 text-gold'
                          : isCurrent
                            ? 'bg-teal/15 text-teal'
                            : 'bg-stone/10 text-stone'
                    )}>
                      {allLocked ? (
                        <CheckCircleIcon className="w-3.5 h-3.5" />
                      ) : (
                        qIndex + 1
                      )}
                    </div>
                    <span className={cn(
                      'text-xs font-medium truncate',
                      isCurrent ? 'text-teal' : 'text-charcoal'
                    )}>
                      Q{qIndex + 1}
                      {isCurrent && <span className="text-teal/60 ml-1">(current)</span>}
                    </span>
                  </div>
                  {isCollapsed ? (
                    <ChevronDownIcon className="w-3.5 h-3.5 text-stone flex-shrink-0" />
                  ) : (
                    <ChevronUpIcon className="w-3.5 h-3.5 text-stone flex-shrink-0" />
                  )}
                </button>

                {/* Variable cards */}
                {!isCollapsed && (
                  <div className="px-3 pb-3 space-y-2">
                    {keys.map(key => {
                      const output = outputMap.get(key);
                      return (
                        <VariablePreviewCard
                          key={key}
                          outputKey={key}
                          value={output?.output_value}
                          isLocked={output?.is_locked ?? false}
                          isEmpty={!output}
                          onAiChat={onAiChat}
                          onManualEdit={onManualEdit}
                          onLock={onLockVariable}
                          onUnlock={onUnlockVariable}
                          isSaving={savingKey === key}
                          isLocking={lockingKey === key}
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
