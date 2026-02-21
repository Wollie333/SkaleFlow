'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { wordDiff, type DiffSegment } from '@/lib/diff-utils';
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

export interface BrandChangeDiffProps {
  currentValue: unknown;
  proposedValue: unknown;
  outputKey: string;
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return '(empty)';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function isJsonObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function DiffHighlight({ segments }: { segments: DiffSegment[] }) {
  return (
    <span className="text-sm font-mono leading-relaxed whitespace-pre-wrap break-words">
      {segments.map((seg, idx) => {
        if (seg.type === 'equal') {
          return <span key={idx} className="text-charcoal/70">{seg.text}</span>;
        }
        if (seg.type === 'added') {
          return <ins key={idx} className="bg-green-100 text-green-700 no-underline px-0.5 rounded">{seg.text}</ins>;
        }
        return <del key={idx} className="bg-red-100 text-red-600 px-0.5 rounded">{seg.text}</del>;
      })}
    </span>
  );
}

function renderObjectDiff(
  current: Record<string, unknown>,
  proposed: Record<string, unknown>
) {
  const allKeys = Array.from(
    new Set([...Object.keys(current), ...Object.keys(proposed)])
  );

  return (
    <div className="space-y-2">
      {allKeys.map((key) => {
        const currentVal = formatValue(current[key]);
        const proposedVal = formatValue(proposed[key]);
        const changed = currentVal !== proposedVal;

        return (
          <div key={key} className="text-sm">
            <span className="font-medium text-charcoal">{key}:</span>
            {changed ? (
              <div className="ml-4 mt-0.5">
                <DiffHighlight segments={wordDiff(currentVal, proposedVal)} />
              </div>
            ) : (
              <div className="ml-4 mt-0.5">
                <span className="text-xs font-mono text-stone break-words">{currentVal}</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function CollapsibleText({ text, maxLength = 300 }: { text: string; maxLength?: number }) {
  const [expanded, setExpanded] = useState(false);

  if (text.length <= maxLength) {
    return <span>{text}</span>;
  }

  return (
    <span>
      {expanded ? text : text.slice(0, maxLength) + '...'}
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
        className="ml-1 text-teal text-xs hover:underline"
      >
        {expanded ? 'Show less' : 'Show more'}
      </button>
    </span>
  );
}

export function BrandChangeDiff({
  currentValue,
  proposedValue,
  outputKey,
}: BrandChangeDiffProps) {
  const [collapsed, setCollapsed] = useState(false);
  const isObjectDiff =
    isJsonObject(currentValue) && isJsonObject(proposedValue);

  const label = outputKey
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center gap-1.5 text-xs font-semibold text-stone uppercase tracking-wider hover:text-charcoal transition-colors"
      >
        {collapsed ? (
          <ChevronRightIcon className="w-3.5 h-3.5" />
        ) : (
          <ChevronDownIcon className="w-3.5 h-3.5" />
        )}
        {label}
      </button>

      {!collapsed && (
        <>
          {isObjectDiff ? (
            renderObjectDiff(
              currentValue as Record<string, unknown>,
              proposedValue as Record<string, unknown>
            )
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Inline diff view */}
              <div className="rounded-lg border border-red-200 bg-red-50/60 p-4">
                <p className="text-xs font-semibold text-red-600 mb-2">Current</p>
                <pre className="text-sm text-red-400 whitespace-pre-wrap break-words font-mono leading-relaxed">
                  <CollapsibleText text={formatValue(currentValue)} />
                </pre>
              </div>

              <div className="rounded-lg border border-green-200 bg-green-50/60 p-4">
                <p className="text-xs font-semibold text-green-400 mb-2">Proposed</p>
                <pre className="text-sm text-green-400 whitespace-pre-wrap break-words font-mono leading-relaxed">
                  <CollapsibleText text={formatValue(proposedValue)} />
                </pre>
              </div>

              {/* Word-level diff */}
              {typeof currentValue === 'string' && typeof proposedValue === 'string' && (
                <div className="col-span-full rounded-lg border border-stone/10 bg-stone/[0.02] p-4">
                  <p className="text-xs font-semibold text-stone mb-2">Changes</p>
                  <DiffHighlight segments={wordDiff(currentValue, proposedValue)} />
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
