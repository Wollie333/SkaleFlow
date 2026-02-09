'use client';

import { XMarkIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import {
  BRAND_VARIABLE_CATEGORIES,
  AI_GENERATION_VARIABLES,
  VARIABLE_DISPLAY_NAMES,
} from '@/lib/content-engine/brand-variable-categories';

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

  const toggleCategoryVars = (categoryKey: string, selectAll: boolean) => {
    const category = BRAND_VARIABLE_CATEGORIES.find(c => c.key === categoryKey);
    if (!category) return;
    for (const k of category.outputKeys) {
      const isSelected = selectedBrandVars.has(k);
      if (selectAll && !isSelected) onToggle(k);
      else if (!selectAll && isSelected) onToggle(k);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-dark/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-stone/10 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-charcoal">Brand Variables</h2>
            <p className="text-xs text-stone mt-0.5">Toggle which brand DNA feeds the AI prompt</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-stone/10 text-stone">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-stone">
              {selectedBrandVars.size} of {AI_GENERATION_VARIABLES.length} selected
            </span>
            <div className="flex gap-2">
              <button onClick={onSelectAll} className="text-xs text-teal hover:underline">
                Select All
              </button>
              <button onClick={onClearAll} className="text-xs text-stone hover:underline">
                Clear All
              </button>
            </div>
          </div>

          <div className="space-y-1">
            {BRAND_VARIABLE_CATEGORIES.map(category => {
              const isExpanded = expandedCategories.has(category.key);
              const selectedCount = category.outputKeys.filter(k => selectedBrandVars.has(k)).length;
              const allSelected = selectedCount === category.outputKeys.length;

              return (
                <div key={category.key} className="border border-stone/10 rounded-lg">
                  <button
                    onClick={() => toggleExpand(category.key)}
                    className="w-full flex items-center justify-between p-2.5 text-left hover:bg-stone/5 rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-charcoal">{category.label}</span>
                      <span className={cn(
                        'text-xs px-1.5 py-0.5 rounded-full',
                        selectedCount === 0 ? 'bg-stone/10 text-stone' : 'bg-teal/10 text-teal'
                      )}>
                        {selectedCount}/{category.outputKeys.length}
                      </span>
                    </div>
                    {isExpanded
                      ? <ChevronUpIcon className="w-4 h-4 text-stone" />
                      : <ChevronDownIcon className="w-4 h-4 text-stone" />
                    }
                  </button>

                  {isExpanded && (
                    <div className="px-2.5 pb-2.5 space-y-1">
                      <button
                        onClick={() => toggleCategoryVars(category.key, !allSelected)}
                        className="text-xs text-teal hover:underline mb-1"
                      >
                        {allSelected ? 'Deselect all' : 'Select all'}
                      </button>
                      {category.outputKeys.map(varKey => (
                        <label
                          key={varKey}
                          className="flex items-center gap-2 py-1 px-1 rounded hover:bg-stone/5 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={selectedBrandVars.has(varKey)}
                            onChange={() => onToggle(varKey)}
                            className="rounded border-stone/30 text-teal focus:ring-teal w-3.5 h-3.5"
                          />
                          <span className="text-xs text-charcoal">{VARIABLE_DISPLAY_NAMES[varKey] || varKey}</span>
                        </label>
                      ))}
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
            <span className="font-semibold text-charcoal">{selectedBrandVars.size}</span> of {AI_GENERATION_VARIABLES.length} variables selected
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
