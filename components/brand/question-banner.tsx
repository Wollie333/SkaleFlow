'use client';

import { cn } from '@/lib/utils';
import { SparklesIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import { formatOutputKey } from '@/lib/brand/format-utils';

interface AgentInfo {
  name: string;
  title: string;
  expertise: string;
  avatarUrl: string;
}

interface QuestionBannerProps {
  currentQuestionIndex: number;
  totalQuestions: number;
  questionText?: string;
  outputKeys: string[];
  outputStatuses: Map<string, { filled: boolean; locked: boolean }>;
  agent?: AgentInfo;
  phaseComplete: boolean;
  onSuggestionClick: (prompt: string) => void;
  isSending: boolean;
  hasMessages: boolean;
}

export function QuestionBanner({
  currentQuestionIndex,
  totalQuestions,
  questionText,
  outputKeys,
  outputStatuses,
  agent,
  phaseComplete,
  onSuggestionClick,
  isSending,
  hasMessages,
}: QuestionBannerProps) {
  if (phaseComplete) {
    return (
      <div className="text-center py-4 px-6 bg-teal/5 border border-teal/15 rounded-xl">
        <div className="w-10 h-10 rounded-full bg-teal/10 flex items-center justify-center mx-auto mb-2">
          <CheckCircleIcon className="w-5 h-5 text-teal" />
        </div>
        <p className="text-sm font-medium text-teal">All questions completed</p>
        <p className="text-xs text-stone mt-1">Open the progress panel to review or edit your answers.</p>
      </div>
    );
  }

  if (!questionText) return null;

  return (
    <div className="rounded-xl border border-stone/10 bg-cream-warm overflow-hidden">
      {/* Question header with stepper */}
      <div className="px-5 py-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-teal uppercase tracking-wider">
              Q{currentQuestionIndex + 1} of {totalQuestions}
            </span>
            {agent && (
              <span className="text-[11px] text-stone flex items-center gap-1.5">
                <span className="text-stone/30">·</span>
                Guided by {agent.name}
              </span>
            )}
          </div>
          {/* Stepper dots */}
          <div className="flex items-center gap-1">
            {Array.from({ length: totalQuestions }, (_, i) => (
              <div
                key={i}
                className={cn(
                  'w-1.5 h-1.5 rounded-full transition-colors',
                  i < currentQuestionIndex
                    ? 'bg-teal'
                    : i === currentQuestionIndex
                      ? 'bg-teal w-3'
                      : 'bg-stone/20'
                )}
              />
            ))}
          </div>
        </div>

        <p className="text-sm text-charcoal leading-relaxed">
          {questionText}
        </p>

        {/* Output variable badges */}
        {outputKeys.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {outputKeys.map(key => {
              const status = outputStatuses.get(key);
              const locked = status?.locked ?? false;
              const filled = status?.filled ?? false;
              return (
                <span
                  key={key}
                  className={cn(
                    'inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium',
                    locked
                      ? 'bg-teal/15 text-teal'
                      : filled
                        ? 'bg-gold/15 text-gold'
                        : 'bg-stone/10 text-stone'
                  )}
                >
                  {locked && <CheckCircleIcon className="w-2.5 h-2.5" />}
                  {filled && !locked && <span className="w-1.5 h-1.5 rounded-full bg-gold" />}
                  {formatOutputKey(key)}
                </span>
              );
            })}
          </div>
        )}
      </div>

      {/* Suggestion chips — only show when chat is empty */}
      {!hasMessages && !isSending && (
        <div className="px-5 pb-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onSuggestionClick('__help_me_think__')}
            className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-teal/10 text-teal hover:bg-teal/15 transition-colors"
          >
            <SparklesIcon className="w-3.5 h-3.5" />
            Help me think through this
          </button>
          <button
            type="button"
            onClick={() => onSuggestionClick('__i_know_this__')}
            className="inline-flex items-center text-xs font-medium px-3 py-1.5 rounded-full bg-stone/10 text-stone hover:bg-stone/15 transition-colors"
          >
            I already know my answer
          </button>
        </div>
      )}
    </div>
  );
}
