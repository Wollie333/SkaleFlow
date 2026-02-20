'use client';

import { cn } from '@/lib/utils';

export type MobileTab = 'question' | 'chat';

interface MobileTabToggleProps {
  activeTab: MobileTab;
  onTabChange: (tab: MobileTab) => void;
  hasNewOutputs?: boolean;
}

export function MobileTabToggle({ activeTab, onTabChange, hasNewOutputs = false }: MobileTabToggleProps) {
  return (
    <div className="lg:hidden flex bg-stone/5 rounded-lg p-1 gap-1">
      <button
        type="button"
        onClick={() => onTabChange('question')}
        className={cn(
          'flex-1 text-sm font-medium py-2 rounded-md transition-colors relative',
          activeTab === 'question'
            ? 'bg-cream-warm text-charcoal shadow-sm'
            : 'text-stone hover:text-charcoal'
        )}
      >
        Question
        {hasNewOutputs && activeTab !== 'question' && (
          <span className="absolute top-1.5 right-3 w-2 h-2 rounded-full bg-teal" />
        )}
      </button>
      <button
        type="button"
        onClick={() => onTabChange('chat')}
        className={cn(
          'flex-1 text-sm font-medium py-2 rounded-md transition-colors',
          activeTab === 'chat'
            ? 'bg-cream-warm text-charcoal shadow-sm'
            : 'text-stone hover:text-charcoal'
        )}
      >
        Chat
      </button>
    </div>
  );
}
