'use client';

import { XMarkIcon, ChevronDownIcon, ChevronUpIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import {
  BRAND_VARIABLE_CATEGORIES,
  VARIABLE_DISPLAY_NAMES,
} from '@/lib/content-engine/brand-variable-categories';

const MAX_VARS = 7;

interface BrandVariableModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedBrandVars: Set<string>;
  onToggle: (key: string) => void;
  onSelectAll: () => void;
  onClearAll: () => void;
}

export function BrandVariableModal({
  isOpen,
  onClose,
  selectedBrandVars,
  onToggle,
  onSelectAll,
  onClearAll,
}: BrandVariableModalProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(BRAND_VARIABLE_CATEGORIES.map(c => c.key))
  );

  const toggleExpand = (key: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const isSmartMode = selectedBrandVars.size === 0;
  const atMax = selectedBrandVars.size >= MAX_VARS;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-dark/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-cream-warm rounded-2xl shadow-xl w-full max-w-lg mx-4 overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-stone/10 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-charcoal">Brand Variables</h2>
            <p className="text-xs text-stone mt-0.5">Select up to {MAX_VARS} variables, or use Smart Mode</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-stone/10 text-stone">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Smart Mode Banner */}
        <div className="px-5 pt-4">
          <button
            onClick={onClearAll}
            className={cn(
              'w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left',
              isSmartMode
                ? 'border-teal bg-teal/5'
                : 'border-stone/15 hover:border-teal/30'
            )}
          >
            <div className={cn(
              'w-9 h-9 rounded-full flex items-center justify-center shrink-0',
              isSmartMode ? 'bg-teal text-white' : 'bg-stone/10 text-stone'
            )}>
              <SparklesIcon className="w-5 h-5" />
            </div>
            <div>
              <p className={cn('text-sm font-semibold', isSmartMode ? 'text-teal' : 'text-charcoal')}>
                Smart Mode {isSmartMode && '(Active)'}
              </p>
              <p className="text-xs text-stone">AI auto-picks 7 random variables per post for natural variety</p>
            </div>
          </button>
        </div>

        {/* Divider */}
        <div className="px-5 py-3">
          <div className="flex items-center gap-2">
            <div className="flex-1 border-t border-stone/10" />
            <span className="text-[10px] uppercase tracking-wider text-stone font-medium">or pick manually</span>
            <div className="flex-1 border-t border-stone/10" />
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 pb-4">
          {/* Selection counter */}
          <div className="flex items-center justify-between mb-3">
            <span className={cn(
              'text-xs font-medium',
              atMax ? 'text-gold' : 'text-stone'
            )}>
              {selectedBrandVars.size}/{MAX_VARS} selected
              {atMax && ' (max reached)'}
            </span>
            {selectedBrandVars.size > 0 && (
              <button onClick={onClearAll} className="text-xs text-stone hover:underline">
                Clear All (use Smart Mode)
              </button>
            )}
          </div>

          <div className="space-y-1">
            {BRAND_VARIABLE_CATEGORIES.map(category => {
              const isExpanded = expandedCategories.has(category.key);
              const selectedCount = category.outputKeys.filter(k => selectedBrandVars.has(k)).length;

              return (
                <div key={category.key} className="border border-stone/10 rounded-lg">
                  <button
                    onClick={() => toggleExpand(category.key)}
                    className="w-full flex items-center justify-between p-2.5 text-left hover:bg-stone/5 rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-charcoal">{category.label}</span>
                      {selectedCount > 0 && (
                        <span className="text-xs px-1.5 py-0.5 rounded-full bg-teal/10 text-teal">
                          {selectedCount}
                        </span>
                      )}
                    </div>
                    {isExpanded
                      ? <ChevronUpIcon className="w-4 h-4 text-stone" />
                      : <ChevronDownIcon className="w-4 h-4 text-stone" />
                    }
                  </button>

                  {isExpanded && (
                    <div className="px-2.5 pb-2.5 space-y-1">
                      {category.outputKeys.map(varKey => {
                        const isSelected = selectedBrandVars.has(varKey);
                        const isDisabled = !isSelected && atMax;
                        return (
                          <label
                            key={varKey}
                            className={cn(
                              'flex items-center gap-2 py-1 px-1 rounded cursor-pointer',
                              isDisabled ? 'opacity-40 cursor-not-allowed' : 'hover:bg-stone/5',
                            )}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {
                                if (!isDisabled) onToggle(varKey);
                              }}
                              disabled={isDisabled}
                              className="rounded border-stone/30 text-teal focus:ring-teal w-3.5 h-3.5"
                            />
                            <span className="text-xs text-charcoal">{VARIABLE_DISPLAY_NAMES[varKey] || varKey}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-stone/10 bg-cream-warm/50 shrink-0">
          <p className="text-sm text-stone">
            {isSmartMode ? (
              <span className="text-teal font-semibold">Smart Mode — 7 random per post</span>
            ) : (
              <>
                <span className="font-semibold text-charcoal">{selectedBrandVars.size}</span>/{MAX_VARS} variables selected
              </>
            )}
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-teal text-white text-sm font-medium rounded-lg hover:bg-teal/90 transition-colors"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}
