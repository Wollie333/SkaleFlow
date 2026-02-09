'use client';

import { SparklesIcon, BoltIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import type { ClientModelOption } from '@/lib/ai/client-models';

interface AIModelPickerProps {
  models: ClientModelOption[];
  selectedModelId: string | null;
  onSelect: (modelId: string) => void;
  /** Override cost label per model — e.g. show total cost for N variations */
  costLabelFn?: (model: ClientModelOption) => string;
}

export function AIModelPicker({ models, selectedModelId, onSelect, costLabelFn }: AIModelPickerProps) {
  return (
    <div className="space-y-2">
      {models.map(model => (
        <button
          key={model.id}
          type="button"
          onClick={() => onSelect(model.id)}
          className={cn(
            'w-full text-left p-3 rounded-xl border-2 transition-all',
            selectedModelId === model.id
              ? 'border-teal bg-teal/5 shadow-sm'
              : 'border-stone/15 hover:border-stone/30 bg-white'
          )}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
              {model.isFree ? (
                <BoltIcon className="w-4 h-4 text-teal shrink-0" />
              ) : (
                <SparklesIcon className="w-4 h-4 text-gold shrink-0" />
              )}
              <div>
                <p className="text-sm font-medium text-charcoal">{model.name}</p>
                <p className="text-xs text-stone capitalize">{model.provider}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={cn(
                'text-xs font-medium px-2 py-0.5 rounded-full',
                model.isFree ? 'bg-teal/10 text-teal' : 'bg-gold/10 text-gold'
              )}>
                {costLabelFn
                  ? costLabelFn(model)
                  : model.isFree ? 'Free' : `~${model.estimatedCreditsPerMessage} cr`}
              </span>
              {selectedModelId === model.id && (
                <CheckCircleIcon className="w-5 h-5 text-teal shrink-0" />
              )}
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
