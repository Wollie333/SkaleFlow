'use client';

import { cn } from '@/lib/utils';

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
            <div className="ml-4 mt-0.5 grid grid-cols-2 gap-3">
              <span
                className={cn(
                  'px-2 py-1 rounded text-xs font-mono break-words',
                  changed
                    ? 'bg-red-50 text-red-400 line-through'
                    : 'bg-stone/5 text-stone'
                )}
              >
                {currentVal}
              </span>
              <span
                className={cn(
                  'px-2 py-1 rounded text-xs font-mono break-words',
                  changed
                    ? 'bg-green-50 text-green-400 font-semibold'
                    : 'bg-stone/5 text-stone'
                )}
              >
                {proposedVal}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function BrandChangeDiff({
  currentValue,
  proposedValue,
  outputKey,
}: BrandChangeDiffProps) {
  const isObjectDiff =
    isJsonObject(currentValue) && isJsonObject(proposedValue);

  const label = outputKey
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold text-stone uppercase tracking-wider">
        {label}
      </p>

      {isObjectDiff ? (
        <>
          <div className="grid grid-cols-2 gap-3 mb-1">
            <p className="text-xs font-semibold text-red-600">Current</p>
            <p className="text-xs font-semibold text-green-400">Proposed</p>
          </div>
          {renderObjectDiff(
            currentValue as Record<string, unknown>,
            proposedValue as Record<string, unknown>
          )}
        </>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Current value */}
          <div className="rounded-lg border border-red-200 bg-red-50/60 p-4">
            <p className="text-xs font-semibold text-red-600 mb-2">Current</p>
            <pre className="text-sm text-red-400 whitespace-pre-wrap break-words font-mono leading-relaxed">
              {formatValue(currentValue)}
            </pre>
          </div>

          {/* Proposed value */}
          <div className="rounded-lg border border-green-200 bg-green-50/60 p-4">
            <p className="text-xs font-semibold text-green-400 mb-2">
              Proposed
            </p>
            <pre className="text-sm text-green-400 whitespace-pre-wrap break-words font-mono leading-relaxed">
              {formatValue(proposedValue)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
