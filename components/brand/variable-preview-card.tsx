'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import {
  ChatBubbleLeftEllipsisIcon,
  PencilIcon,
  LockClosedIcon,
  LockOpenIcon,
  CheckIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { formatOutputKey } from '@/lib/brand/format-utils';
import type { Json } from '@/types/database';

interface VariablePreviewCardProps {
  outputKey: string;
  value?: Json;
  isLocked: boolean;
  isEmpty: boolean;
  onAiChat?: (outputKey: string) => void;
  onManualEdit?: (outputKey: string, newValue: string) => Promise<void> | void;
  onLock?: (outputKey: string) => void;
  onUnlock?: (outputKey: string) => void;
  isSaving?: boolean;
  isLocking?: boolean;
}

export function VariablePreviewCard({
  outputKey,
  value,
  isLocked,
  isEmpty,
  onAiChat,
  onManualEdit,
  onLock,
  onUnlock,
  isSaving,
  isLocking,
}: VariablePreviewCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const [saveError, setSaveError] = useState<string | null>(null);

  const displayValue = formatValue(value);
  const isLong = displayValue.length > 200;
  const truncatedValue = isLong && !isExpanded ? displayValue.slice(0, 200) + '...' : displayValue;

  const handleStartEdit = () => {
    setEditValue(displayValue);
    setSaveError(null);
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    if (onManualEdit && editValue.trim()) {
      setSaveError(null);
      try {
        await onManualEdit(outputKey, editValue.trim());
        setIsEditing(false);
      } catch (err) {
        setSaveError(err instanceof Error ? err.message : 'Failed to save');
      }
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditValue('');
    setSaveError(null);
  };

  return (
    <div
      className={cn(
        'rounded-lg p-3 transition-all duration-200',
        isEditing
          ? 'bg-cream-warm border border-teal/20'
          : isEmpty
            ? 'border border-dashed border-stone/20 bg-white'
            : isLocked
              ? 'bg-teal/5 border border-teal/15'
              : 'bg-cream-warm border border-cream-warm'
      )}
    >
      {/* Header with name + action icons */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-charcoal">
          {formatOutputKey(outputKey)}
        </span>

        <div className="flex items-center gap-1 flex-shrink-0">
          {isEditing ? (
            <>
              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={isSaving || !editValue.trim()}
                className="p-1 rounded text-teal hover:bg-teal/10 disabled:opacity-40 transition-colors"
                title="Save"
              >
                {isSaving ? (
                  <span className="block w-3.5 h-3.5 border-2 border-teal/30 border-t-teal rounded-full animate-spin" />
                ) : (
                  <CheckIcon className="w-3.5 h-3.5" />
                )}
              </button>
              <button
                type="button"
                onClick={handleCancelEdit}
                disabled={isSaving}
                className="p-1 rounded text-stone hover:bg-stone/10 disabled:opacity-40 transition-colors"
                title="Cancel"
              >
                <XMarkIcon className="w-3.5 h-3.5" />
              </button>
            </>
          ) : isLocked ? (
            /* Locked state: closed lock icon (click to unlock) */
            onUnlock && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onUnlock(outputKey); }}
                disabled={isLocking}
                className="p-1 rounded text-teal hover:bg-teal/10 disabled:opacity-40 transition-colors"
                title="Unlock variable"
              >
                {isLocking ? (
                  <span className="block w-3.5 h-3.5 border-2 border-teal/30 border-t-teal rounded-full animate-spin" />
                ) : (
                  <LockClosedIcon className="w-3.5 h-3.5" />
                )}
              </button>
            )
          ) : (
            /* Unlocked state: AI chat + edit + open lock (click to lock) */
            <>
              {onAiChat && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onAiChat(outputKey); }}
                  className="p-1 rounded text-stone hover:text-teal hover:bg-teal/10 transition-colors"
                  title="Discuss with AI"
                >
                  <ChatBubbleLeftEllipsisIcon className="w-3.5 h-3.5" />
                </button>
              )}
              {onManualEdit && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleStartEdit(); }}
                  className="p-1 rounded text-stone hover:text-teal hover:bg-teal/10 transition-colors"
                  title="Edit manually"
                >
                  <PencilIcon className="w-3.5 h-3.5" />
                </button>
              )}
              {!isEmpty && onLock && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onLock(outputKey); }}
                  disabled={isLocking}
                  className="p-1 rounded text-stone hover:text-charcoal hover:bg-stone/10 disabled:opacity-40 transition-colors"
                  title="Lock variable"
                >
                  {isLocking ? (
                    <span className="block w-3.5 h-3.5 border-2 border-stone/30 border-t-stone rounded-full animate-spin" />
                  ) : (
                    <LockOpenIcon className="w-3.5 h-3.5" />
                  )}
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Body */}
      {isEditing ? (
        <div className="mt-2">
          <textarea
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            rows={4}
            className="w-full text-sm border border-stone/15 rounded-lg px-3 py-2 resize-y focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal/30 bg-white"
            placeholder="Enter value..."
            autoFocus
          />
          {saveError && (
            <p className="text-xs text-red-600 mt-1">{saveError}</p>
          )}
        </div>
      ) : isEmpty ? (
        <p className="text-xs text-stone/50 mt-1.5 italic">
          Awaiting AI extraction
        </p>
      ) : (
        <div className="mt-1.5">
          <div className="text-sm text-charcoal/80 whitespace-pre-wrap break-words leading-relaxed">
            {truncatedValue}
          </div>
          {isLong && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
              className="text-[11px] text-teal hover:text-teal/80 font-medium mt-1"
            >
              {isExpanded ? 'Show less' : 'Show more'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function formatValue(value: Json | undefined): string {
  if (value === undefined || value === null) return '';
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) {
    return value
      .map(item => typeof item === 'string' ? item : JSON.stringify(item))
      .join('\n');
  }
  if (typeof value === 'object') return JSON.stringify(value, null, 2);
  return String(value);
}
