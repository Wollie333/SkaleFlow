'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui';
import {
  ExclamationCircleIcon,
  ExclamationTriangleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';

interface ComplianceIssue {
  id?: string;
  severity: 'error' | 'warning';
  field: string;
  message: string;
  recommendation?: string;
}

interface ComplianceIssuesPanelProps {
  issues: ComplianceIssue[];
  onRevalidate?: () => void;
}

export function ComplianceIssuesPanel({ issues, onRevalidate }: ComplianceIssuesPanelProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const errors = issues.filter((i) => i.severity === 'error');
  const warnings = issues.filter((i) => i.severity === 'warning');

  const toggleExpand = (id: string) => {
    const next = new Set(expandedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setExpandedIds(next);
  };

  if (issues.length === 0) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
        <p className="text-sm text-green-700 font-medium">
          No compliance issues found
        </p>
        <p className="text-xs text-green-600 mt-1">
          Your creative meets all platform requirements.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Summary */}
      <div className="flex items-center gap-3">
        {errors.length > 0 && (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600">
            <ExclamationCircleIcon className="w-4 h-4" />
            {errors.length} {errors.length === 1 ? 'error' : 'errors'}
          </span>
        )}
        {warnings.length > 0 && (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-yellow-600">
            <ExclamationTriangleIcon className="w-4 h-4" />
            {warnings.length} {warnings.length === 1 ? 'warning' : 'warnings'}
          </span>
        )}
      </div>

      {/* Errors */}
      {errors.length > 0 && (
        <div className="space-y-1.5">
          {errors.map((issue, idx) => {
            const id = issue.id || `error-${idx}`;
            const isExpanded = expandedIds.has(id);
            return (
              <div
                key={id}
                className="bg-red-50 border border-red-200 rounded-lg overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => issue.recommendation ? toggleExpand(id) : undefined}
                  className={cn(
                    'w-full flex items-start gap-2 px-3 py-2.5 text-left',
                    issue.recommendation && 'cursor-pointer hover:bg-red-100/50'
                  )}
                >
                  <ExclamationCircleIcon className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-red-700 capitalize">
                      {issue.field}
                    </p>
                    <p className="text-xs text-red-600 mt-0.5">{issue.message}</p>
                  </div>
                  {issue.recommendation && (
                    isExpanded ? (
                      <ChevronUpIcon className="w-4 h-4 text-red-400 shrink-0" />
                    ) : (
                      <ChevronDownIcon className="w-4 h-4 text-red-400 shrink-0" />
                    )
                  )}
                </button>
                {isExpanded && issue.recommendation && (
                  <div className="px-3 pb-2.5 ml-6">
                    <div className="bg-white/60 rounded-lg p-2 border border-red-100">
                      <p className="text-[11px] text-red-700 font-medium mb-0.5">
                        Recommendation:
                      </p>
                      <p className="text-xs text-red-600">{issue.recommendation}</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="space-y-1.5">
          {warnings.map((issue, idx) => {
            const id = issue.id || `warning-${idx}`;
            const isExpanded = expandedIds.has(id);
            return (
              <div
                key={id}
                className="bg-yellow-50 border border-yellow-200 rounded-lg overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => issue.recommendation ? toggleExpand(id) : undefined}
                  className={cn(
                    'w-full flex items-start gap-2 px-3 py-2.5 text-left',
                    issue.recommendation && 'cursor-pointer hover:bg-yellow-100/50'
                  )}
                >
                  <ExclamationTriangleIcon className="w-4 h-4 text-yellow-500 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-yellow-700 capitalize">
                      {issue.field}
                    </p>
                    <p className="text-xs text-yellow-600 mt-0.5">{issue.message}</p>
                  </div>
                  {issue.recommendation && (
                    isExpanded ? (
                      <ChevronUpIcon className="w-4 h-4 text-yellow-400 shrink-0" />
                    ) : (
                      <ChevronDownIcon className="w-4 h-4 text-yellow-400 shrink-0" />
                    )
                  )}
                </button>
                {isExpanded && issue.recommendation && (
                  <div className="px-3 pb-2.5 ml-6">
                    <div className="bg-white/60 rounded-lg p-2 border border-yellow-100">
                      <p className="text-[11px] text-yellow-700 font-medium mb-0.5">
                        Recommendation:
                      </p>
                      <p className="text-xs text-yellow-600">{issue.recommendation}</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Re-validate Button */}
      {onRevalidate && (
        <div className="pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onRevalidate}
            className="w-full border-stone/20 text-charcoal hover:bg-cream-warm/20"
          >
            <ArrowPathIcon className="w-4 h-4 mr-1.5" />
            Re-validate
          </Button>
        </div>
      )}
    </div>
  );
}
