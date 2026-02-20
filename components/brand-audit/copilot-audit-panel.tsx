'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { SECTION_LABELS, SECTION_ORDER } from '@/lib/brand-audit/types';
import type { BrandAuditSectionKey } from '@/types/database';
import {
  CheckIcon,
  XMarkIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from '@heroicons/react/24/outline';
import { CheckCircleIcon } from '@heroicons/react/24/solid';

export interface AuditExtraction {
  id: string;
  key: string;
  value: unknown;
  section: BrandAuditSectionKey;
  confidence: number;
  label: string;
  status: 'pending' | 'accepted' | 'rejected';
}

interface SectionProgress {
  filled: number;
  total: number;
}

interface CopilotAuditPanelProps {
  auditId: string;
  extractions: AuditExtraction[];
  progress: {
    filled: number;
    total: number;
    bySection: Record<BrandAuditSectionKey, SectionProgress>;
  };
  currentSection?: BrandAuditSectionKey;
  onAccept: (extraction: AuditExtraction) => void;
  onReject: (extraction: AuditExtraction) => void;
}

export function CopilotAuditPanel({
  auditId,
  extractions,
  progress,
  currentSection,
  onAccept,
  onReject,
}: CopilotAuditPanelProps) {
  const [showAccepted, setShowAccepted] = useState(false);

  const pendingExtractions = extractions.filter(e => e.status === 'pending');
  const acceptedExtractions = extractions.filter(e => e.status === 'accepted');
  const progressPct = progress.total > 0 ? (progress.filled / progress.total) * 100 : 0;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-stone/10">
        <h3 className="text-sm font-semibold text-charcoal">Brand Audit Extraction</h3>
        <div className="flex items-center gap-2 mt-2">
          <div className="flex-1 h-2 bg-stone/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-teal rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <span className="text-xs text-stone flex-shrink-0">
            {progress.filled}/{progress.total}
          </span>
        </div>
      </div>

      {/* Current section indicator */}
      {currentSection && (
        <div className="px-4 py-2 bg-teal/5 border-b border-teal/10">
          <div className="text-[11px] font-medium text-teal uppercase tracking-wider">
            Current Section
          </div>
          <div className="text-sm font-medium text-charcoal mt-0.5">
            {SECTION_LABELS[currentSection]}
          </div>
          {progress.bySection[currentSection] && (
            <div className="text-xs text-stone mt-0.5">
              {progress.bySection[currentSection].filled}/{progress.bySection[currentSection].total} fields filled
            </div>
          )}
        </div>
      )}

      {/* Pending extractions */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {pendingExtractions.length === 0 && acceptedExtractions.length === 0 && (
          <div className="text-center py-8">
            <p className="text-sm text-stone">No extractions yet</p>
            <p className="text-xs text-stone/60 mt-1">
              Click &quot;Extract&quot; on transcript segments to extract audit data
            </p>
          </div>
        )}

        {pendingExtractions.map((ext) => (
          <div
            key={ext.id}
            className="bg-emerald-50 border border-emerald-200 rounded-lg p-3"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <div className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider">
                  {ext.label.replace(/_/g, ' ')}
                </div>
                <div className="text-[10px] text-emerald-600/60 mt-0.5">
                  {SECTION_LABELS[ext.section]} &middot; {Math.round(ext.confidence * 100)}% confidence
                </div>
              </div>
            </div>

            <div className="text-sm text-charcoal mt-2 whitespace-pre-wrap leading-relaxed">
              {formatExtractionValue(ext.value)}
            </div>

            <div className="flex items-center gap-2 mt-3">
              <button
                onClick={() => onAccept(ext)}
                className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
              >
                <CheckIcon className="w-3.5 h-3.5" />
                Accept
              </button>
              <button
                onClick={() => onReject(ext)}
                className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md border border-stone/20 text-stone hover:bg-stone/5 transition-colors"
              >
                <XMarkIcon className="w-3.5 h-3.5" />
                Reject
              </button>
            </div>
          </div>
        ))}

        {/* Accepted extractions (collapsible) */}
        {acceptedExtractions.length > 0 && (
          <div className="mt-4">
            <button
              onClick={() => setShowAccepted(!showAccepted)}
              className="flex items-center gap-2 text-xs font-medium text-stone hover:text-charcoal w-full"
            >
              {showAccepted ? (
                <ChevronUpIcon className="w-3.5 h-3.5" />
              ) : (
                <ChevronDownIcon className="w-3.5 h-3.5" />
              )}
              {acceptedExtractions.length} accepted extraction{acceptedExtractions.length !== 1 ? 's' : ''}
            </button>

            {showAccepted && (
              <div className="mt-2 space-y-2">
                {acceptedExtractions.map((ext) => (
                  <div
                    key={ext.id}
                    className="bg-emerald-50/50 border border-emerald-100 rounded-lg p-2.5"
                  >
                    <div className="flex items-center gap-2">
                      <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                      <span className="text-xs font-medium text-charcoal">
                        {ext.label.replace(/_/g, ' ')}
                      </span>
                      <span className="text-[10px] text-stone ml-auto">
                        {SECTION_LABELS[ext.section]}
                      </span>
                    </div>
                    <p className="text-xs text-charcoal/70 mt-1 line-clamp-1 pl-5">
                      {formatExtractionValue(ext.value)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Section progress grid */}
      <div className="px-4 py-3 border-t border-stone/10">
        <div className="text-[11px] font-medium text-stone uppercase tracking-wider mb-2">
          Section Progress
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {SECTION_ORDER.map((key) => {
            const sp = progress.bySection[key];
            const pct = sp && sp.total > 0 ? (sp.filled / sp.total) * 100 : 0;
            return (
              <div
                key={key}
                className={cn(
                  'flex items-center gap-1.5 text-[10px] px-2 py-1 rounded',
                  key === currentSection ? 'bg-teal/10 text-teal font-medium' : 'text-stone'
                )}
              >
                <div className="w-8 h-1 bg-stone/10 rounded-full overflow-hidden flex-shrink-0">
                  <div
                    className="h-full bg-teal rounded-full"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="truncate">{SECTION_LABELS[key].split(' ')[0]}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function formatExtractionValue(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'number') return String(value);
  if (Array.isArray(value)) return value.join(', ');
  return JSON.stringify(value, null, 2);
}
