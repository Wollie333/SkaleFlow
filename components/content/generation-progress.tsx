'use client';

import { Button } from '@/components/ui';
import { SparklesIcon, ArrowPathIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface GenerationProgressProps {
  weeksGenerated: number;
  totalWeeks: number;
  isGenerating: boolean;
  onGenerateWeek: (weekNumber: number) => void;
  onResetProgress?: () => void;
  isResetting?: boolean;
  currentWeek?: number | null;
  errorMessage?: string | null;
  onRetry?: () => void;
}

export function GenerationProgress({
  weeksGenerated,
  totalWeeks,
  isGenerating,
  onGenerateWeek,
  onResetProgress,
  isResetting,
  currentWeek,
  errorMessage,
  onRetry,
}: GenerationProgressProps) {
  const progress = totalWeeks > 0 ? (weeksGenerated / totalWeeks) * 100 : 0;
  const nextWeek = weeksGenerated + 1;
  const allDone = weeksGenerated >= totalWeeks;

  return (
    <div className="bg-cream-warm rounded-xl border border-stone/10 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-charcoal">AI Generation Progress</h4>
        <div className="flex items-center gap-2">
          <span className="text-xs text-stone">
            {weeksGenerated}/{totalWeeks} weeks
          </span>
          {onResetProgress && (
            <button
              onClick={onResetProgress}
              disabled={isGenerating || isResetting}
              className="text-xs text-stone hover:text-red-600 transition-colors disabled:opacity-50 flex items-center gap-1"
              title="Reset generation progress"
            >
              <ArrowPathIcon className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
              Reset
            </button>
          )}
        </div>
      </div>

      <div className="w-full bg-stone/10 rounded-full h-2">
        <div
          className="bg-teal rounded-full h-2 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex gap-1">
        {Array.from({ length: totalWeeks }, (_, i) => {
          const weekNum = i + 1;
          const isActive = currentWeek === weekNum;
          const isDone = i < weeksGenerated;
          return (
            <div
              key={i}
              className={`flex-1 h-1.5 rounded-full ${
                isDone
                  ? 'bg-teal'
                  : isActive
                    ? 'bg-teal/50 animate-pulse'
                    : 'bg-stone/10'
              }`}
            />
          );
        })}
      </div>

      {currentWeek && isGenerating && (
        <p className="text-xs text-teal text-center font-medium animate-pulse">
          Generating week {currentWeek} of {totalWeeks}...
        </p>
      )}

      {errorMessage && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
          <ExclamationTriangleIcon className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-red-700">{errorMessage}</p>
            {onRetry && (
              <button
                onClick={onRetry}
                className="text-sm font-medium text-red-600 hover:text-red-800 mt-1 underline"
              >
                Retry from where it stopped
              </button>
            )}
          </div>
        </div>
      )}

      {!allDone && !isGenerating && !errorMessage && (
        <Button
          onClick={() => onGenerateWeek(nextWeek)}
          disabled={isGenerating}
          variant="secondary"
          className="w-full"
          size="sm"
        >
          <SparklesIcon className="w-4 h-4 mr-2" />
          Generate Week {nextWeek}
        </Button>
      )}

      {allDone && !isGenerating && (
        <p className="text-xs text-teal text-center font-medium">
          All weeks generated
        </p>
      )}
    </div>
  );
}
