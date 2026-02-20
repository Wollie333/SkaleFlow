'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { SectionForm } from '@/components/brand-audit/section-forms';
import { SECTION_ORDER, SECTION_LABELS } from '@/lib/brand-audit/types';
import type { BrandAuditSectionKey } from '@/types/database';
import {
  SparklesIcon,
  CheckIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';

/** Section descriptions for context */
const SECTION_DESCRIPTIONS: Record<BrandAuditSectionKey, string> = {
  company_overview: 'Basic business information and company profile.',
  brand_foundation: 'Mission, vision, values, and core brand elements.',
  visual_identity: 'Logo, colors, typography, and brand guidelines.',
  messaging: 'Tagline, key messages, tone of voice, and brand story.',
  digital_presence: 'Website, SEO, social media, and advertising.',
  customer_experience: 'Customer journey, feedback, and retention.',
  competitive_landscape: 'Competitors, market position, and opportunities.',
  goals_challenges: 'Short/long-term goals, challenges, and budget.',
};

interface AuditSectionFormProps {
  auditId: string;
  sectionKey: BrandAuditSectionKey;
  data: Record<string, unknown>;
  onChange: (data: Record<string, unknown>) => void;
  onSave: (markComplete?: boolean) => Promise<void>;
  onNext: () => void;
  saving: boolean;
  hasUnsavedChanges: boolean;
  isLastSection: boolean;
  isSectionComplete: boolean;
}

export function AuditSectionForm({
  auditId,
  sectionKey,
  data,
  onChange,
  onSave,
  onNext,
  saving,
  hasUnsavedChanges,
  isLastSection,
  isSectionComplete,
}: AuditSectionFormProps) {
  const [refining, setRefining] = useState(false);
  const [refineResult, setRefineResult] = useState<{ gaps?: string[]; suggestions?: string[] } | null>(null);

  const handleRefine = async () => {
    setRefining(true);
    setRefineResult(null);
    try {
      const res = await fetch(`/api/brand-audits/${auditId}/sections/${sectionKey}/refine`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data }),
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || 'Refinement failed');
        return;
      }
      const result = await res.json();
      // Apply refined data if returned
      if (result.refined_data) {
        onChange({ ...data, ...result.refined_data });
      }
      setRefineResult({ gaps: result.gaps, suggestions: result.suggestions });
    } catch (error) {
      console.error('Error refining section:', error);
    } finally {
      setRefining(false);
    }
  };

  const handleSaveAndContinue = async () => {
    await onSave(true);
    if (!isLastSection) {
      onNext();
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-6">
        {/* Section header */}
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-charcoal">{SECTION_LABELS[sectionKey]}</h2>
          <p className="text-sm text-stone mt-1">{SECTION_DESCRIPTIONS[sectionKey]}</p>
        </div>

        {/* Form card */}
        <Card className="p-6 border border-stone/10">
          <SectionForm
            sectionKey={sectionKey}
            data={data}
            onChange={onChange}
          />
        </Card>

        {/* AI Refine result */}
        {refineResult && (
          <div className="mt-4 space-y-3">
            {refineResult.gaps && refineResult.gaps.length > 0 && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <h4 className="text-xs font-semibold text-amber-700 mb-1">Gaps Identified</h4>
                <ul className="text-xs text-amber-600 space-y-1">
                  {refineResult.gaps.map((gap, i) => (
                    <li key={i}>• {gap}</li>
                  ))}
                </ul>
              </div>
            )}
            {refineResult.suggestions && refineResult.suggestions.length > 0 && (
              <div className="p-3 bg-teal/5 border border-teal/15 rounded-lg">
                <h4 className="text-xs font-semibold text-teal mb-1">Suggestions</h4>
                <ul className="text-xs text-teal/80 space-y-1">
                  {refineResult.suggestions.map((s, i) => (
                    <li key={i}>• {s}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom action bar */}
      <div className="flex items-center justify-between p-4 border-t border-stone/10 bg-white">
        <Button
          variant="outline"
          onClick={handleRefine}
          disabled={refining}
          className="text-sm"
        >
          <SparklesIcon className="w-4 h-4 mr-1.5" />
          {refining ? 'Refining...' : 'AI Refine'}
        </Button>

        <div className="flex items-center gap-3">
          {hasUnsavedChanges && (
            <Button
              variant="outline"
              onClick={() => onSave(false)}
              disabled={saving}
              size="sm"
            >
              {saving ? 'Saving...' : 'Save Draft'}
            </Button>
          )}
          <Button
            onClick={handleSaveAndContinue}
            disabled={saving}
            className="bg-teal hover:bg-teal-dark text-white"
          >
            {saving ? 'Saving...' : isLastSection ? (
              <>
                <CheckIcon className="w-4 h-4 mr-1.5" />
                Complete Section
              </>
            ) : (
              <>
                Save & Continue
                <ArrowRightIcon className="w-4 h-4 ml-1.5" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
