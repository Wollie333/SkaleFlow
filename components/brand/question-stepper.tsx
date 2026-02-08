'use client';

import { cn } from '@/lib/utils';
import { CheckIcon } from '@heroicons/react/24/solid';

interface QuestionStepperProps {
  totalQuestions: number;
  currentQuestionIndex: number;
  phaseComplete: boolean;
}

export function QuestionStepper({ totalQuestions, currentQuestionIndex, phaseComplete }: QuestionStepperProps) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: totalQuestions }, (_, i) => {
        const isCompleted = phaseComplete || i < currentQuestionIndex;
        const isCurrent = i === currentQuestionIndex && !phaseComplete;

        return (
          <div key={i} className="flex items-center">
            <div
              className={cn(
                'flex items-center justify-center rounded-full transition-all duration-300 text-[10px] font-semibold',
                totalQuestions > 7 ? 'w-6 h-6' : 'w-7 h-7',
                isCompleted && 'bg-teal text-cream',
                isCurrent && 'bg-white text-teal ring-2 ring-teal',
                !isCompleted && !isCurrent && 'bg-stone/10 text-stone/50'
              )}
              title={`Question ${i + 1}${isCompleted ? ' (completed)' : isCurrent ? ' (current)' : ''}`}
            >
              {isCompleted ? (
                <CheckIcon className={cn(totalQuestions > 7 ? 'w-3 h-3' : 'w-3.5 h-3.5')} />
              ) : (
                i + 1
              )}
            </div>
            {i < totalQuestions - 1 && (
              <div
                className={cn(
                  'h-0.5 transition-all duration-300',
                  totalQuestions > 7 ? 'w-2' : 'w-3',
                  isCompleted ? 'bg-teal' : 'bg-stone/10'
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
