'use client';

import { cn } from '@/lib/utils';
import { SECTION_ORDER, SECTION_LABELS } from '@/lib/brand-audit/types';
import type { BrandAuditSectionKey } from '@/types/database';
import { CheckCircleIcon } from '@heroicons/react/24/solid';

interface Section {
  section_key: BrandAuditSectionKey;
  is_complete: boolean;
}

interface WizardSidebarProps {
  sections: Section[];
  activeSection: BrandAuditSectionKey;
  onSectionClick: (key: BrandAuditSectionKey) => void;
  sectionsCompleted: number;
  totalSections: number;
}

export function WizardSidebar({
  sections,
  activeSection,
  onSectionClick,
  sectionsCompleted,
  totalSections,
}: WizardSidebarProps) {
  const sectionMap = new Map(sections.map((s) => [s.section_key, s]));
  const progress = totalSections > 0 ? (sectionsCompleted / totalSections) * 100 : 0;

  return (
    <div className="w-64 bg-white border-r border-stone/10 p-4 flex flex-col">
      {/* Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="font-medium text-charcoal">Progress</span>
          <span className="text-stone">{sectionsCompleted}/{totalSections}</span>
        </div>
        <div className="h-2 bg-stone/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-teal rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Section steps */}
      <nav className="space-y-1 flex-1">
        {SECTION_ORDER.map((key, index) => {
          const section = sectionMap.get(key);
          const isComplete = section?.is_complete || false;
          const isActive = activeSection === key;

          return (
            <button
              key={key}
              onClick={() => onSectionClick(key)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left',
                isActive
                  ? 'bg-teal/10 text-teal'
                  : isComplete
                    ? 'text-green-600 hover:bg-green-50'
                    : 'text-stone hover:bg-cream-warm hover:text-charcoal'
              )}
            >
              <span className={cn(
                'w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0',
                isComplete
                  ? 'bg-green-100 text-green-600'
                  : isActive
                    ? 'bg-teal/20 text-teal'
                    : 'bg-stone/10 text-stone'
              )}>
                {isComplete ? (
                  <CheckCircleIcon className="w-4 h-4" />
                ) : (
                  index + 1
                )}
              </span>
              <span className="truncate">{SECTION_LABELS[key]}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
