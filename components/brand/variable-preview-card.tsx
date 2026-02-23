'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import {
  ChatBubbleLeftEllipsisIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
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
  pendingApproval?: { status: string; proposedValue: unknown };
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
  pendingApproval,
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

  const hasPending = !!pendingApproval;
  const pendingStatus = pendingApproval?.status;

  return (
    <div
      className={cn(
        'rounded-lg p-3 transition-all duration-200',
        hasPending
          ? 'bg-amber-50/50 border border-amber-200/50'
          : isEditing
            ? 'bg-cream-warm border border-teal/20'
            : isEmpty
              ? 'border border-dashed border-stone/20 bg-cream-warm'
              : isLocked
                ? 'bg-teal/5 border border-teal/15'
                : 'bg-cream-warm border border-stone/10'
      )}
    >
      {/* Header with name + action icons */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-charcoal flex items-center gap-1.5">
          {formatOutputKey(outputKey)}
          {hasPending && (
            <span className={cn(
              'inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full',
              pendingStatus === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-orange-100 text-orange-700'
            )}>
              <ClockIcon className="w-3 h-3" />
              {pendingStatus === 'pending' ? 'Pending Approval' : 'Revision Requested'}
            </span>
          )}
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
            /* Confirmed state: check icon (click to edit) */
            onUnlock && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onUnlock(outputKey); }}
                disabled={isLocking}
                className="p-1 rounded text-teal hover:bg-teal/10 disabled:opacity-40 transition-colors"
                title="Edit this answer"
              >
                {isLocking ? (
                  <span className="block w-3.5 h-3.5 border-2 border-teal/30 border-t-teal rounded-full animate-spin" />
                ) : (
                  <CheckCircleIcon className="w-3.5 h-3.5" />
                )}
              </button>
            )
          ) : (
            /* Draft/empty state: AI chat + edit + confirm */
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
                  className="p-1 rounded text-teal hover:text-teal/80 hover:bg-teal/10 disabled:opacity-40 transition-colors"
                  title="Confirm this answer"
                >
                  {isLocking ? (
                    <span className="block w-3.5 h-3.5 border-2 border-teal/30 border-t-teal rounded-full animate-spin" />
                  ) : (
                    <span className="text-[10px] font-semibold">Confirm</span>
                  )}
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Status label */}
      {!isEditing && !isEmpty && !isLocked && (
        <span className="inline-flex items-center text-[10px] font-medium px-1.5 py-0.5 rounded bg-gold/10 text-gold mt-1">
          Draft
        </span>
      )}
      {!isEditing && isLocked && (
        <span className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded bg-teal/10 text-teal mt-1">
          <CheckCircleIcon className="w-3 h-3" />
          Confirmed
        </span>
      )}

      {/* Body */}
      {isEditing ? (
        <div className="mt-2">
          <textarea
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            rows={4}
            className="w-full text-sm border border-stone/15 rounded-lg px-3 py-2 resize-y focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal/30 bg-cream-warm"
            placeholder="Enter value..."
            autoFocus
          />
          {saveError && (
            <p className="text-xs text-red-600 mt-1">{saveError}</p>
          )}
        </div>
      ) : isEmpty ? (
        <p className="text-xs text-stone/50 mt-1.5 italic">
          Needs your input
        </p>
      ) : (
        <div className="mt-1.5">
          <RichPreview outputKey={outputKey} value={value} />
          {/* Fallback text for non-rich types */}
          {!isRichKey(outputKey) && (
            <>
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
            </>
          )}
        </div>
      )}
    </div>
  );
}

// Keys that get rich visual previews instead of plain text
const IMAGE_URL_KEYS = new Set([
  'brand_logo_primary', 'brand_logo_dark', 'brand_logo_light', 'brand_logo_icon',
]);
const IMAGE_ARRAY_KEYS = new Set([
  'brand_mood_board', 'brand_patterns', 'brand_elements', 'visual_inspirations',
]);
const COLOR_KEY = 'brand_color_palette';
const TYPOGRAPHY_KEY = 'brand_typography';

function isRichKey(key: string): boolean {
  return IMAGE_URL_KEYS.has(key) || IMAGE_ARRAY_KEYS.has(key) || key === COLOR_KEY || key === TYPOGRAPHY_KEY;
}

function RichPreview({ outputKey, value }: { outputKey: string; value?: Json }) {
  if (!value) return null;

  // Single image URL (logos)
  if (IMAGE_URL_KEYS.has(outputKey)) {
    const url = typeof value === 'string' ? value : null;
    if (!url || url === 'none') return null;
    return (
      <div className="mt-1">
        <div className="w-14 h-14 rounded-lg border border-stone/10 bg-white overflow-hidden">
          <img src={url} alt={formatOutputKey(outputKey)} className="w-full h-full object-contain" />
        </div>
      </div>
    );
  }

  // Image array (mood board, patterns, brand elements, inspirations)
  if (IMAGE_ARRAY_KEYS.has(outputKey)) {
    const urls = Array.isArray(value)
      ? (value as unknown[]).filter((u): u is string => typeof u === 'string' && u !== 'none')
      : typeof value === 'string' && value !== 'none'
        ? [value]
        : [];
    if (urls.length === 0) return null;
    return (
      <div className="flex flex-wrap gap-1.5 mt-1">
        {urls.slice(0, 6).map((url, i) => (
          <div key={i} className="w-10 h-10 rounded border border-stone/10 bg-white overflow-hidden flex-shrink-0">
            <img src={url} alt="" className="w-full h-full object-cover" />
          </div>
        ))}
        {urls.length > 6 && (
          <div className="w-10 h-10 rounded border border-stone/10 bg-stone/5 flex items-center justify-center flex-shrink-0">
            <span className="text-[9px] text-stone font-medium">+{urls.length - 6}</span>
          </div>
        )}
      </div>
    );
  }

  // Color palette
  if (outputKey === COLOR_KEY && typeof value === 'object' && value !== null) {
    const palette = value as Record<string, unknown>;
    // Try colors array first, then individual color keys
    const colorsArr = palette.colors as Array<Record<string, unknown>> | undefined;
    const swatches: { hex: string; role: string }[] = [];

    if (Array.isArray(colorsArr)) {
      for (const c of colorsArr) {
        if (c && typeof c.hex === 'string') {
          swatches.push({ hex: c.hex, role: (c.role as string) || '' });
        }
      }
    } else {
      // Fallback: check for named color keys (primary, dark_base, accent, light, neutral)
      for (const role of ['primary', 'dark_base', 'accent', 'light', 'neutral']) {
        const c = palette[role] as Record<string, unknown> | undefined;
        if (c && typeof c.hex === 'string') {
          swatches.push({ hex: c.hex, role });
        }
      }
    }

    if (swatches.length === 0) return null;
    return (
      <div className="flex gap-1.5 mt-1">
        {swatches.map((s, i) => (
          <div key={i} className="flex flex-col items-center gap-0.5">
            <div
              className="w-7 h-7 rounded-md border border-stone/15 shadow-sm"
              style={{ backgroundColor: s.hex }}
              title={`${s.role}: ${s.hex}`}
            />
            <span className="text-[8px] text-stone/60 leading-none">{s.hex}</span>
          </div>
        ))}
      </div>
    );
  }

  // Typography
  if (outputKey === TYPOGRAPHY_KEY && typeof value === 'object' && value !== null) {
    const typo = value as Record<string, unknown>;
    const heading = typo.heading_font as string | undefined;
    const body = typo.body_font as string | undefined;
    const accent = typo.accent_font as string | undefined;
    const headingW = typo.heading_weight as string | undefined;
    const bodyW = typo.body_weight as string | undefined;

    if (!heading && !body) return null;
    return (
      <div className="space-y-1 mt-1">
        {heading && (
          <div className="flex items-baseline gap-2">
            <span className="text-[10px] text-stone/50 w-10 flex-shrink-0">Head</span>
            <span className="text-xs text-charcoal font-medium">{heading}</span>
            {headingW && <span className="text-[9px] text-stone/40">{headingW}</span>}
          </div>
        )}
        {body && (
          <div className="flex items-baseline gap-2">
            <span className="text-[10px] text-stone/50 w-10 flex-shrink-0">Body</span>
            <span className="text-xs text-charcoal font-medium">{body}</span>
            {bodyW && <span className="text-[9px] text-stone/40">{bodyW}</span>}
          </div>
        )}
        {accent && (
          <div className="flex items-baseline gap-2">
            <span className="text-[10px] text-stone/50 w-10 flex-shrink-0">Accent</span>
            <span className="text-xs text-charcoal font-medium">{accent}</span>
          </div>
        )}
      </div>
    );
  }

  return null;
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
