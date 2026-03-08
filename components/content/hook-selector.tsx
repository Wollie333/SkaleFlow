'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

// ---- Types ----

interface HookVariation {
  id: string;
  text: string;
  style: string;
}

interface HookSelectorProps {
  hooks: HookVariation[];
  selectedHookId: string | null;
  onSelect: (hookId: string) => void;
  onRegenerate: () => void;
  isRegenerating?: boolean;
}

// ---- Constants ----

const HOOK_STYLES: Record<string, { label: string; color: string }> = {
  question: { label: 'Question', color: 'text-blue-400' },
  bold_claim: { label: 'Bold Claim', color: 'text-orange-400' },
  story: { label: 'Story', color: 'text-purple-400' },
  statistic: { label: 'Statistic', color: 'text-green-400' },
  contrarian: { label: 'Contrarian', color: 'text-red-400' },
  how_to: { label: 'How To', color: 'text-teal' },
  default: { label: 'Hook', color: 'text-stone' },
};

// ---- Component ----

export function HookSelector({
  hooks,
  selectedHookId,
  onSelect,
  onRegenerate,
  isRegenerating = false,
}: HookSelectorProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-stone uppercase tracking-wider">
          Hook Variations
        </label>
        <Button
          variant="ghost"
          size="sm"
          onClick={onRegenerate}
          disabled={isRegenerating}
          className="text-xs"
        >
          {isRegenerating ? (
            <span className="flex items-center gap-1.5">
              <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Regenerating...
            </span>
          ) : (
            'Regenerate hooks'
          )}
        </Button>
      </div>

      {hooks.length === 0 ? (
        <div className="text-xs text-stone/50 italic py-4 text-center bg-stone/5 rounded-lg">
          No hook variations generated yet. Generate content to see hooks.
        </div>
      ) : (
        <div className="space-y-2">
          {hooks.map((hook, idx) => {
            const isSelected = selectedHookId === hook.id;
            const styleConfig = HOOK_STYLES[hook.style] || HOOK_STYLES.default;

            return (
              <button
                key={hook.id}
                onClick={() => onSelect(hook.id)}
                className={`w-full text-left p-3 rounded-lg border transition-all ${
                  isSelected
                    ? 'border-teal bg-teal/5 ring-1 ring-teal/20'
                    : 'border-stone/10 bg-cream-warm hover:border-stone/20 hover:bg-stone/5'
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Radio indicator */}
                  <div className={`mt-0.5 w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                    isSelected ? 'border-teal' : 'border-stone/20'
                  }`}>
                    {isSelected && <div className="w-2 h-2 rounded-full bg-teal" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-medium text-stone/40">
                        Hook {idx + 1}
                      </span>
                      <span className={`text-[10px] font-medium ${styleConfig.color}`}>
                        {styleConfig.label}
                      </span>
                    </div>
                    <p className="text-sm text-charcoal leading-relaxed">
                      {hook.text}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {selectedHookId && (
        <p className="text-[10px] text-stone/40 text-center">
          Selected hook will be used as the opening line of your post
        </p>
      )}
    </div>
  );
}
