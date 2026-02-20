'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SECTION_ORDER, SECTION_LABELS } from '@/lib/brand-audit/types';
import type { BrandAuditSectionKey } from '@/types/database';
import { CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface Section {
  section_key: BrandAuditSectionKey;
  is_complete: boolean;
  data_source: string;
  extraction_confidence: number | null;
  data: Record<string, unknown>;
}

interface CallReviewProps {
  sections: Section[];
  auditId: string;
  onGoToSection: (key: BrandAuditSectionKey) => void;
  onGenerate: () => void;
}

export function CallReview({ sections, auditId, onGoToSection, onGenerate }: CallReviewProps) {
  const sectionMap = new Map(sections.map((s) => [s.section_key, s]));
  const completeSections = sections.filter((s) => s.is_complete).length;
  const canGenerate = completeSections >= 5;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-charcoal">Call Extraction Review</h3>
          <p className="text-sm text-stone mt-1">
            Review data extracted from the call. Fill in any gaps manually.
          </p>
        </div>
        <Button
          onClick={onGenerate}
          disabled={!canGenerate}
          className="bg-gold hover:bg-gold/90 text-dark"
        >
          {canGenerate ? 'Generate Audit Scores' : `${completeSections}/5 sections needed`}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {SECTION_ORDER.map((key) => {
          const section = sectionMap.get(key);
          const isComplete = section?.is_complete || false;
          const isExtracted = section?.data_source === 'call_extracted';
          const confidence = section?.extraction_confidence;
          const dataFields = section?.data ? Object.values(section.data).filter((v) => v !== null && v !== undefined && v !== '').length : 0;

          return (
            <Card
              key={key}
              className="p-4 border border-stone/10 hover:shadow-sm transition-shadow cursor-pointer"
              onClick={() => onGoToSection(key)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {isComplete ? (
                    <CheckCircleIcon className="w-5 h-5 text-green-500" />
                  ) : dataFields > 0 ? (
                    <ExclamationTriangleIcon className="w-5 h-5 text-amber-500" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-stone/20" />
                  )}
                  <div>
                    <h4 className="text-sm font-medium text-charcoal">{SECTION_LABELS[key]}</h4>
                    <div className="flex items-center gap-2 text-xs text-stone mt-0.5">
                      {isExtracted && <span className="text-teal">Call extracted</span>}
                      {confidence !== null && confidence !== undefined && (
                        <span className={confidence >= 0.7 ? 'text-green-500' : confidence >= 0.4 ? 'text-amber-500' : 'text-red-500'}>
                          {Math.round(confidence * 100)}% confidence
                        </span>
                      )}
                      <span>{dataFields} fields</span>
                    </div>
                  </div>
                </div>

                {!isComplete && dataFields > 0 && (
                  <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                    Review needed
                  </span>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
