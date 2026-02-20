'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import { CATEGORY_LABELS } from '@/lib/brand-audit/types';
import type { BrandAuditCategory, BrandAuditRating } from '@/types/database';

interface CategoryCardProps {
  category: BrandAuditCategory;
  score: number;
  rating: BrandAuditRating;
  analysis: string | null;
  keyFinding: string | null;
  actionableInsight: string | null;
}

const RATING_STYLES: Record<string, { bg: string; border: string; text: string }> = {
  red: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-600' },
  amber: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-600' },
  green: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-600' },
};

export function CategoryCard({ category, score, rating, analysis, keyFinding, actionableInsight }: CategoryCardProps) {
  const [expanded, setExpanded] = useState(false);
  const style = RATING_STYLES[rating] || RATING_STYLES.red;

  return (
    <div className={cn('rounded-xl border p-4 transition-all', style.border, style.bg)}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-charcoal text-sm">{CATEGORY_LABELS[category]}</h3>
          <div className="flex items-center gap-2 mt-1">
            <span className={cn('text-xl font-bold', style.text)}>{Math.round(score)}</span>
            <span className="text-xs text-stone">/100</span>
            <span className={cn(
              'px-2 py-0.5 rounded-full text-xs font-medium capitalize',
              rating === 'green' ? 'bg-green-100 text-green-700' :
              rating === 'amber' ? 'bg-amber-100 text-amber-700' :
              'bg-red-100 text-red-700'
            )}>
              {rating}
            </span>
          </div>
        </div>

        {/* Score bar */}
        <div className="w-24">
          <div className="h-2 bg-white/60 rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-500',
                rating === 'green' ? 'bg-green-500' :
                rating === 'amber' ? 'bg-amber-500' : 'bg-red-500'
              )}
              style={{ width: `${score}%` }}
            />
          </div>
        </div>
      </div>

      {/* Key finding */}
      {keyFinding && (
        <p className="mt-3 text-sm text-charcoal/80 font-medium">
          {keyFinding}
        </p>
      )}

      {/* Actionable insight */}
      {actionableInsight && (
        <p className="mt-1 text-sm text-teal">
          {actionableInsight}
        </p>
      )}

      {/* Expandable analysis */}
      {analysis && (
        <div className="mt-3">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-xs text-stone hover:text-charcoal"
          >
            {expanded ? 'Hide' : 'Show'} full analysis
            {expanded ? <ChevronUpIcon className="w-3 h-3" /> : <ChevronDownIcon className="w-3 h-3" />}
          </button>
          {expanded && (
            <div className="mt-2 text-sm text-charcoal/70 whitespace-pre-line">
              {analysis}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
