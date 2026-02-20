'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronUpDownIcon, SparklesIcon, BoltIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

interface ModelOption {
  id: string;
  name: string;
  provider: string;
  isFree: boolean;
  estimatedCreditsPerMessage: number;
}

interface ModelSelectorProps {
  models: ModelOption[];
  selectedModelId: string | null;
  onSelect: (modelId: string) => void;
  compact?: boolean;
  /** Provider status map, e.g. { anthropic: 'active', google: 'offline' } */
  providerStatuses?: Record<string, 'active' | 'offline'>;
}

export function ModelSelector({ models, selectedModelId, onSelect, compact = false, providerStatuses = {} }: ModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selected = models.find(m => m.id === selectedModelId) || models[0];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-1.5 rounded-lg border border-stone/20 bg-cream-warm hover:bg-cream-warm transition-colors',
          compact ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-sm'
        )}
      >
        <span
          className={cn(
            'w-2 h-2 rounded-full flex-shrink-0',
            providerStatuses[selected?.provider || ''] === 'offline'
              ? 'bg-red-500'
              : providerStatuses[selected?.provider || ''] === 'active'
                ? 'bg-emerald-500'
                : 'bg-stone/30'
          )}
          title={
            providerStatuses[selected?.provider || ''] === 'offline'
              ? 'Offline'
              : providerStatuses[selected?.provider || ''] === 'active'
                ? 'Active'
                : 'Checking...'
          }
        />
        {selected?.isFree ? (
          <BoltIcon className="w-3.5 h-3.5 text-teal" />
        ) : (
          <SparklesIcon className="w-3.5 h-3.5 text-gold" />
        )}
        <span className="font-medium text-charcoal">{selected?.name || 'Select model'}</span>
        <ChevronUpDownIcon className="w-3.5 h-3.5 text-stone" />
      </button>

      {isOpen && (
        <div className="absolute top-full mt-1 left-0 z-50 w-64 bg-cream-warm rounded-lg shadow-lg border border-stone/15 py-1">
          {models.map((model) => (
            <button
              key={model.id}
              onClick={() => {
                onSelect(model.id);
                setIsOpen(false);
              }}
              className={cn(
                'w-full text-left px-3 py-2 flex items-center justify-between hover:bg-cream-warm transition-colors',
                model.id === selected?.id && 'bg-teal/5'
              )}
            >
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'w-2 h-2 rounded-full flex-shrink-0',
                    providerStatuses[model.provider] === 'offline'
                      ? 'bg-red-500'
                      : providerStatuses[model.provider] === 'active'
                        ? 'bg-emerald-500'
                        : 'bg-stone/30'
                  )}
                />
                {model.isFree ? (
                  <BoltIcon className="w-4 h-4 text-teal" />
                ) : (
                  <SparklesIcon className="w-4 h-4 text-gold" />
                )}
                <div>
                  <p className="text-sm font-medium text-charcoal">{model.name}</p>
                  <p className="text-xs text-stone capitalize">{model.provider}</p>
                </div>
              </div>
              <span className={cn(
                'text-xs font-medium px-2 py-0.5 rounded-full',
                model.isFree
                  ? 'bg-teal/10 text-teal'
                  : 'bg-gold/10 text-gold'
              )}>
                {model.isFree ? 'Free' : `~${model.estimatedCreditsPerMessage} cr`}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
