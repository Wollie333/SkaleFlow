'use client';

import { useState } from 'react';
import { Card, Button } from '@/components/ui';
import { ChevronDownIcon, ChevronUpIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import type { Json } from '@/types/database';

interface BrandOutput {
  id: string;
  output_key: string;
  output_value: Json;
  is_locked: boolean;
}

interface PhaseOutputsProps {
  outputs: BrandOutput[];
  phaseName: string;
  onLock?: (outputs: Record<string, Json>) => void;
  isLocking?: boolean;
}

export function PhaseOutputs({ outputs, phaseName, onLock, isLocking }: PhaseOutputsProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  if (outputs.length === 0) {
    return null;
  }

  const allLocked = outputs.every(o => o.is_locked);

  const handleLock = () => {
    const outputsMap = outputs.reduce((acc, o) => {
      acc[o.output_key] = o.output_value;
      return acc;
    }, {} as Record<string, Json>);
    onLock?.(outputsMap);
  };

  return (
    <Card className="mt-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between"
      >
        <h4 className="text-heading-sm text-charcoal flex items-center gap-2">
          {phaseName} Outputs
          {allLocked && <LockClosedIcon className="w-4 h-4 text-teal" />}
        </h4>
        {isExpanded ? (
          <ChevronUpIcon className="w-5 h-5 text-stone" />
        ) : (
          <ChevronDownIcon className="w-5 h-5 text-stone" />
        )}
      </button>

      {isExpanded && (
        <div className="mt-4 space-y-3">
          {outputs.map((output) => (
            <div
              key={output.id}
              className="p-3 bg-cream-warm rounded-lg"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-medium text-teal uppercase tracking-wider">
                  {formatOutputKey(output.output_key)}
                </span>
                {output.is_locked && (
                  <LockClosedIcon className="w-3 h-3 text-stone" />
                )}
              </div>
              <div className="text-sm text-charcoal">
                {formatOutputValue(output.output_value)}
              </div>
            </div>
          ))}

          {!allLocked && onLock && (
            <Button
              onClick={handleLock}
              variant="secondary"
              className="w-full mt-4"
              isLoading={isLocking}
            >
              Lock Phase Outputs
            </Button>
          )}
        </div>
      )}
    </Card>
  );
}

function formatOutputKey(key: string): string {
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatOutputValue(value: Json): React.ReactNode {
  if (typeof value === 'string') {
    return value;
  }

  if (Array.isArray(value)) {
    return (
      <ul className="list-disc list-inside space-y-1">
        {value.map((item, i) => (
          <li key={i} className="text-sm">
            {typeof item === 'string' ? item : JSON.stringify(item)}
          </li>
        ))}
      </ul>
    );
  }

  if (typeof value === 'object' && value !== null) {
    return (
      <pre className="text-xs bg-white/50 rounded p-2 overflow-x-auto">
        {JSON.stringify(value, null, 2)}
      </pre>
    );
  }

  return String(value);
}
