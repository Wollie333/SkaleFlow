'use client';

import { XMarkIcon, ChevronDownIcon, ChevronUpIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { getTemplatesForFormat, getTemplateByKey } from '@/lib/content-engine/template-catalog';

export interface TemplateOverrides {
  script?: string;
  hook?: string;
  cta?: string;
}

interface TemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTemplates: TemplateOverrides;
  onSelect: (type: 'script' | 'hook' | 'cta', key: string | null) => void;
  onClearAll: () => void;
  formatCategory: string;
}

const GROUPS = [
  { type: 'script' as const, label: 'Script Template', emptyLabel: 'AI picks best template' },
  { type: 'hook' as const, label: 'Hook Style', emptyLabel: 'AI picks based on funnel stage' },
  { type: 'cta' as const, label: 'CTA Style', emptyLabel: 'AI picks based on funnel stage' },
];

export function TemplateModal({
  isOpen,
  onClose,
  selectedTemplates,
  onSelect,
  onClearAll,
  formatCategory,
}: TemplateModalProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    new Set(['script', 'hook', 'cta'])
  );

  const toggleExpand = (key: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const templates = getTemplatesForFormat(formatCategory);
  const isSmartMode = !selectedTemplates.script && !selectedTemplates.hook && !selectedTemplates.cta;
  const overrideCount = [selectedTemplates.script, selectedTemplates.hook, selectedTemplates.cta].filter(Boolean).length;

  if (!isOpen) return null;

  const getGroupOptions = (type: 'script' | 'hook' | 'cta') => {
    if (type === 'script') return templates.scripts;
    if (type === 'hook') return templates.hooks;
    return templates.ctas;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-dark/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-stone/10 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-charcoal">Templates</h2>
            <p className="text-xs text-stone mt-0.5">Override AI template selection, or use Smart Mode</p>
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
              <p className="text-xs text-stone">AI auto-picks the best template for each post based on context</p>
            </div>
          </button>
        </div>

        {/* Divider */}
        <div className="px-5 py-3">
          <div className="flex items-center gap-2">
            <div className="flex-1 border-t border-stone/10" />
            <span className="text-[10px] uppercase tracking-wider text-stone font-medium">or override manually</span>
            <div className="flex-1 border-t border-stone/10" />
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 pb-4">
          {/* Selection counter */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-stone">
              {overrideCount === 0 ? 'No overrides' : `${overrideCount} override${overrideCount !== 1 ? 's' : ''}`}
            </span>
            {overrideCount > 0 && (
              <button onClick={onClearAll} className="text-xs text-stone hover:underline">
                Clear All (use Smart Mode)
              </button>
            )}
          </div>

          <div className="space-y-1">
            {GROUPS.map(group => {
              const isExpanded = expandedGroups.has(group.type);
              const options = getGroupOptions(group.type);
              const selectedKey = selectedTemplates[group.type];
              const selectedOption = selectedKey ? getTemplateByKey(selectedKey) : null;

              return (
                <div key={group.type} className="border border-stone/10 rounded-lg">
                  <button
                    onClick={() => toggleExpand(group.type)}
                    className="w-full flex items-center justify-between p-2.5 text-left hover:bg-stone/5 rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-charcoal">{group.label}</span>
                      {selectedOption && (
                        <span className="text-xs px-1.5 py-0.5 rounded-full bg-gold/10 text-gold">
                          {selectedOption.name}
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
                      {/* AI Default option */}
                      <label className="flex items-center gap-2 py-1.5 px-1 rounded cursor-pointer hover:bg-stone/5">
                        <input
                          type="radio"
                          name={`template-${group.type}`}
                          checked={!selectedKey}
                          onChange={() => onSelect(group.type, null)}
                          className="border-stone/30 text-teal focus:ring-teal w-3.5 h-3.5"
                        />
                        <div>
                          <span className="text-xs font-medium text-teal">AI Default</span>
                          <span className="text-[10px] text-stone ml-1.5">{group.emptyLabel}</span>
                        </div>
                      </label>

                      {/* Template options */}
                      {options.map(option => (
                        <label
                          key={option.key}
                          className="flex items-start gap-2 py-1.5 px-1 rounded cursor-pointer hover:bg-stone/5"
                        >
                          <input
                            type="radio"
                            name={`template-${group.type}`}
                            checked={selectedKey === option.key}
                            onChange={() => onSelect(group.type, option.key)}
                            className="mt-0.5 border-stone/30 text-teal focus:ring-teal w-3.5 h-3.5"
                          />
                          <div>
                            <span className="text-xs font-medium text-charcoal">{option.name}</span>
                            <p className="text-[10px] text-stone leading-tight">{option.description}</p>
                          </div>
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
            {isSmartMode ? (
              <span className="text-teal font-semibold">Smart Mode — AI picks all templates</span>
            ) : (
              <>
                <span className="font-semibold text-charcoal">{overrideCount}</span> override{overrideCount !== 1 ? 's' : ''} active
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
