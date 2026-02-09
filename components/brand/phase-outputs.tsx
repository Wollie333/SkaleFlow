'use client';

import { useState } from 'react';
import { Card } from '@/components/ui';
import { ChevronDownIcon, ChevronUpIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import { VariablePreviewCard } from './variable-preview-card';
import type { Json } from '@/types/database';

interface BrandOutput {
  id: string;
  output_key: string;
  output_value: Json;
  is_locked: boolean;
}

interface PendingChange {
  id: string;
  entity_id: string | null;
  status: string;
  proposed_value: unknown;
}

interface PhaseOutputsProps {
  outputs: BrandOutput[];
  phaseName: string;
  onLock?: (outputs: Record<string, Json>) => void;
  isLocking?: boolean;
  onAiChat?: (outputKey: string) => void;
  onManualEdit?: (outputKey: string, newValue: string) => Promise<void> | void;
  onLockVariable?: (outputKey: string) => void;
  onUnlockVariable?: (outputKey: string) => void;
  savingKey?: string | null;
  lockingKey?: string | null;
  allPhaseOutputKeys?: string[];
  pendingChanges?: PendingChange[];
}

export function PhaseOutputs({
  outputs,
  phaseName,
  onAiChat,
  onManualEdit,
  onLockVariable,
  onUnlockVariable,
  savingKey,
  lockingKey,
  allPhaseOutputKeys,
  pendingChanges = [],
}: PhaseOutputsProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const keysToShow = allPhaseOutputKeys && allPhaseOutputKeys.length > 0
    ? allPhaseOutputKeys
    : outputs.map(o => o.output_key);

  if (keysToShow.length === 0) {
    return null;
  }

  const outputMap = new Map(outputs.map(o => [o.output_key, o]));
  const pendingMap = new Map(pendingChanges.filter(c => c.entity_id).map(c => [c.entity_id!, c]));
  const allLocked = outputs.length > 0 && outputs.every(o => o.is_locked);

  // Sort: empty first, then unlocked drafts, then locked
  const sortedKeys = [...keysToShow].sort((a, b) => {
    const aOutput = outputMap.get(a);
    const bOutput = outputMap.get(b);
    const aScore = !aOutput ? 0 : !aOutput.is_locked ? 1 : 2;
    const bScore = !bOutput ? 0 : !bOutput.is_locked ? 1 : 2;
    return aScore - bScore;
  });

  return (
    <Card className="mt-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between"
      >
        <h4 className="text-heading-sm text-charcoal flex items-center gap-2">
          Phase Variables
          {allLocked && <LockClosedIcon className="w-4 h-4 text-teal" />}
          <span className="text-xs font-normal text-stone">
            {outputs.length}/{keysToShow.length}
          </span>
        </h4>
        {isExpanded ? (
          <ChevronUpIcon className="w-5 h-5 text-stone" />
        ) : (
          <ChevronDownIcon className="w-5 h-5 text-stone" />
        )}
      </button>

      {isExpanded && (
        <div className="mt-4 space-y-3">
          {sortedKeys.map((key) => {
            const output = outputMap.get(key);
            const pending = pendingMap.get(key);
            return (
              <VariablePreviewCard
                key={key}
                outputKey={key}
                value={output?.output_value}
                isLocked={output?.is_locked ?? false}
                isEmpty={!output}
                onAiChat={onAiChat}
                onManualEdit={onManualEdit}
                onLock={onLockVariable}
                onUnlock={onUnlockVariable}
                isSaving={savingKey === key}
                isLocking={lockingKey === key}
                pendingApproval={pending ? { status: pending.status, proposedValue: pending.proposed_value } : undefined}
              />
            );
          })}
        </div>
      )}
    </Card>
  );
}
