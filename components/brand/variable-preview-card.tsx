'use client';

import { useState, useRef } from 'react';
import { cn } from '@/lib/utils';
import {
  ChatBubbleLeftEllipsisIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon,
  ClockIcon,
  ArrowUpTrayIcon,
  PhotoIcon,
} from '@heroicons/react/24/outline';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import { formatOutputKey } from '@/lib/brand/format-utils';
import type { Json } from '@/types/database';

interface VariablePreviewCardProps {
  outputKey: string;
  value?: Json;
  isLocked: boolean;
  isEmpty: boolean;
  organizationId?: string;
  onAiChat?: (outputKey: string) => void;
  onManualEdit?: (outputKey: string, newValue: Json) => Promise<void> | void;
  onLock?: (outputKey: string) => void;
  onUnlock?: (outputKey: string) => void;
  isSaving?: boolean;
  isLocking?: boolean;
  pendingApproval?: { status: string; proposedValue: unknown };
}

// ─── Variable type categorization ───

const IMAGE_URL_KEYS = new Set([
  'brand_logo_primary', 'brand_logo_dark', 'brand_logo_light', 'brand_logo_icon',
]);
const IMAGE_ARRAY_KEYS = new Set([
  'brand_mood_board', 'brand_patterns', 'brand_elements', 'visual_inspirations',
]);
const COLOR_KEYS = new Set(['brand_color_palette', 'design_system_colors']);
const TYPOGRAPHY_KEYS = new Set(['brand_typography', 'design_system_typography']);

const OUTPUT_KEY_TO_ASSET_TYPE: Record<string, string> = {
  brand_logo_primary: 'logo',
  brand_logo_dark: 'logo_dark',
  brand_logo_light: 'logo_light',
  brand_logo_icon: 'logo_icon',
  brand_mood_board: 'mood_board',
  brand_patterns: 'pattern',
  brand_elements: 'brand_element',
  visual_inspirations: 'visual_inspiration',
};

type VarType = 'image-url' | 'image-array' | 'color' | 'typography' | 'text';

function getVarType(key: string): VarType {
  if (IMAGE_URL_KEYS.has(key)) return 'image-url';
  if (IMAGE_ARRAY_KEYS.has(key)) return 'image-array';
  if (COLOR_KEYS.has(key)) return 'color';
  if (TYPOGRAPHY_KEYS.has(key)) return 'typography';
  return 'text';
}

export function VariablePreviewCard({
  outputKey,
  value,
  isLocked,
  isEmpty,
  organizationId,
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
  const [editImageUrls, setEditImageUrls] = useState<string[]>([]);
  const [editTypography, setEditTypography] = useState<Record<string, string>>({});
  const [uploadingImage, setUploadingImage] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const varType = getVarType(outputKey);
  const displayValue = formatValue(value);
  const isLong = displayValue.length > 200;
  const truncatedValue = isLong && !isExpanded ? displayValue.slice(0, 200) + '...' : displayValue;

  // ── Type-aware start edit ──
  const handleStartEdit = () => {
    setSaveError(null);
    if (varType === 'image-url') {
      // For single image: just open file picker directly
      fileInputRef.current?.click();
      return;
    }
    if (varType === 'image-array') {
      const urls = Array.isArray(value)
        ? (value as unknown[]).filter((u): u is string => typeof u === 'string' && u !== 'none')
        : [];
      setEditImageUrls([...urls]);
    } else if (varType === 'typography') {
      const obj = value && typeof value === 'object' && !Array.isArray(value)
        ? value as Record<string, unknown>
        : {};
      // Handle both brand_typography (heading_font) and design_system_typography (nested objects)
      const rows = extractTypographyRows(obj);
      if (rows.length > 0) {
        const fonts: Record<string, string> = {};
        for (const r of rows) {
          fonts[r.label] = r.font;
        }
        setEditTypography(fonts);
      } else {
        setEditTypography({
          Heading: (obj.heading_font as string) || '',
          Body: (obj.body_font as string) || '',
          Accent: (obj.accent_font as string) || '',
        });
      }
    } else {
      setEditValue(displayValue);
    }
    setIsEditing(true);
  };

  // ── Type-aware save ──
  const handleSaveEdit = async () => {
    if (!onManualEdit) return;
    setSaveError(null);
    try {
      if (varType === 'image-array') {
        await onManualEdit(outputKey, editImageUrls.length > 0 ? editImageUrls : 'none');
      } else if (varType === 'typography') {
        const existing = value && typeof value === 'object' && !Array.isArray(value)
          ? { ...(value as Record<string, unknown>) }
          : {};
        // Map labels back to keys
        if (editTypography['Heading'] !== undefined) existing.heading_font = editTypography['Heading'];
        if (editTypography['Body'] !== undefined) existing.body_font = editTypography['Body'];
        if (editTypography['Accent'] !== undefined) existing.accent_font = editTypography['Accent'];
        // For design_system_typography style (nested objects), update font_family
        for (const [label, font] of Object.entries(editTypography)) {
          const key = label.replace(/ /g, '_').toLowerCase();
          if (typeof existing[key] === 'object' && existing[key] !== null) {
            (existing[key] as Record<string, unknown>).font_family = font;
            (existing[key] as Record<string, unknown>).font = font;
          }
        }
        await onManualEdit(outputKey, existing as Json);
      } else {
        if (!editValue.trim()) return;
        await onManualEdit(outputKey, editValue.trim());
      }
      setIsEditing(false);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save');
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditValue('');
    setEditImageUrls([]);
    setEditTypography({});
    setSaveError(null);
  };

  // ── Image upload handler ──
  const handleImageUpload = async (files: FileList | null) => {
    if (!files?.length || !organizationId) return;
    setUploadingImage(true);
    setSaveError(null);
    try {
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('organizationId', organizationId);
        formData.append('assetType', OUTPUT_KEY_TO_ASSET_TYPE[outputKey] || 'logo');

        const res = await fetch('/api/brand/assets', { method: 'POST', body: formData });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Upload failed');

        const fileUrl = data.asset.file_url;

        if (varType === 'image-array') {
          // Add to edit state
          setEditImageUrls(prev => [...prev, fileUrl]);
        } else {
          // Single image: save immediately
          await onManualEdit?.(outputKey, fileUrl);
        }
      }
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = (index: number) => {
    setEditImageUrls(prev => prev.filter((_, i) => i !== index));
  };

  const hasPending = !!pendingApproval;
  const pendingStatus = pendingApproval?.status;
  const isImageType = varType === 'image-url' || varType === 'image-array';

  return (
    <div
      className={cn(
        'rounded-lg p-3 transition-all duration-200',
        hasPending
          ? 'bg-amber-50/50 border border-amber-200/50'
          : isEditing
            ? 'bg-white border border-teal/20'
            : isEmpty
              ? 'border border-dashed border-stone/20 bg-white'
              : isLocked
                ? 'bg-teal/5 border border-teal/15'
                : 'bg-white border border-stone/10'
      )}
    >
      {/* Hidden file input for image uploads */}
      {isImageType && (
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp"
          multiple={varType === 'image-array'}
          onChange={e => handleImageUpload(e.target.files)}
          className="hidden"
        />
      )}

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
          {isEditing && varType === 'image-array' ? (
            /* Image array edit: save (commit array) + cancel */
            <>
              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={isSaving}
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
          ) : isEditing ? (
            /* Text / typography edit: save + cancel */
            <>
              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={isSaving || (varType === 'text' && !editValue.trim())}
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
            /* Draft/empty state: AI chat + edit/upload + confirm */
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
                  disabled={uploadingImage}
                  className="p-1 rounded text-stone hover:text-teal hover:bg-teal/10 transition-colors"
                  title={isImageType ? 'Upload image' : 'Edit manually'}
                >
                  {uploadingImage ? (
                    <span className="block w-3.5 h-3.5 border-2 border-teal/30 border-t-teal rounded-full animate-spin" />
                  ) : isImageType ? (
                    <ArrowUpTrayIcon className="w-3.5 h-3.5" />
                  ) : (
                    <PencilIcon className="w-3.5 h-3.5" />
                  )}
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
        <span className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded bg-teal/10 text-gold mt-1">
          <CheckCircleIcon className="w-3 h-3" />
          Confirmed
        </span>
      )}

      {/* Body — edit mode OR preview */}
      {isEditing ? (
        <div className="mt-2">
          {/* Image array edit mode */}
          {varType === 'image-array' && (
            <div>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {editImageUrls.map((url, i) => (
                  <div key={i} className="relative w-12 h-12 group">
                    <img src={url} alt="" className="w-full h-full rounded border border-stone/10 object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(i)}
                      className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <XMarkIcon className="w-2.5 h-2.5" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingImage}
                  className="w-12 h-12 rounded border-2 border-dashed border-stone/20 hover:border-teal/40 flex items-center justify-center transition-colors"
                >
                  {uploadingImage ? (
                    <span className="block w-4 h-4 border-2 border-teal/30 border-t-teal rounded-full animate-spin" />
                  ) : (
                    <PhotoIcon className="w-5 h-5 text-stone/40" />
                  )}
                </button>
              </div>
              <p className="text-[10px] text-stone">{editImageUrls.length} image{editImageUrls.length !== 1 ? 's' : ''}</p>
            </div>
          )}

          {/* Typography edit mode */}
          {varType === 'typography' && (
            <div className="space-y-2">
              {Object.entries(editTypography).map(([label, font]) => (
                <div key={label} className="flex items-center gap-2">
                  <span className="text-[10px] text-stone w-14 flex-shrink-0 truncate">{label}</span>
                  <input
                    type="text"
                    value={font}
                    onChange={e => setEditTypography(prev => ({ ...prev, [label]: e.target.value }))}
                    className="flex-1 text-xs px-2 py-1.5 border border-stone/15 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal/30 bg-cream-warm"
                    placeholder="Font name..."
                  />
                </div>
              ))}
            </div>
          )}

          {/* Text edit mode (default) */}
          {varType === 'text' && (
            <textarea
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              rows={4}
              className="w-full text-sm border border-stone/15 rounded-lg px-3 py-2 resize-y focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal/30 bg-cream-warm"
              placeholder="Enter value..."
              autoFocus
            />
          )}

          {/* Color edit — not in edit mode, user uses the dedicated color picker */}

          {saveError && (
            <p className="text-xs text-red-600 mt-1">{saveError}</p>
          )}
        </div>
      ) : isEmpty ? (
        <p className="text-xs text-stone mt-1.5 italic">
          {isImageType ? 'No image uploaded' : 'Needs your input'}
        </p>
      ) : (
        <div className="mt-1.5">
          <RichPreview outputKey={outputKey} value={value} />
          {/* Fallback text for non-rich types */}
          {!isRichKey(outputKey, value) && (
            <>
              <div className="text-sm text-charcoal whitespace-pre-wrap break-words leading-relaxed">
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

// ─── Rich preview helpers ───

function isUrl(s: string): boolean {
  return s.startsWith('http://') || s.startsWith('https://');
}

/** Extract a displayable image URL from any value shape */
function extractImageUrl(val: Json): string | null {
  if (!val || val === 'none') return null;
  if (typeof val === 'string' && isUrl(val)) return val;
  if (typeof val === 'string' && isUrl(val.replace(/^["']|["']$/g, ''))) return val.replace(/^["']|["']$/g, '');
  if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
    const obj = val as Record<string, unknown>;
    for (const key of ['url', 'file_url', 'src', 'href', 'logo_url']) {
      if (typeof obj[key] === 'string' && isUrl(obj[key] as string)) return obj[key] as string;
    }
    for (const v of Object.values(obj)) {
      if (typeof v === 'string' && isUrl(v)) return v;
    }
  }
  if (Array.isArray(val)) {
    for (const item of val as unknown[]) {
      if (typeof item === 'string' && isUrl(item)) return item;
    }
  }
  return null;
}

/** True if this key+value gets a rich preview (suppresses plain text fallback) */
function isRichKey(key: string, value?: Json): boolean {
  if (IMAGE_URL_KEYS.has(key) || IMAGE_ARRAY_KEYS.has(key)) return true;
  if (COLOR_KEYS.has(key) || TYPOGRAPHY_KEYS.has(key)) return true;
  if (key === 'brand_archetype') return true;
  if (value !== undefined && value !== null && typeof value === 'object') return true;
  return false;
}

function RichPreview({ outputKey, value }: { outputKey: string; value?: Json }) {
  if (!value) return null;

  // ── Single image URL (logos) ──
  if (IMAGE_URL_KEYS.has(outputKey)) {
    const url = extractImageUrl(value);
    if (!url) return null;
    return (
      <div className="mt-1">
        <div className="w-14 h-14 rounded-lg border border-stone/10 bg-white overflow-hidden">
          <img src={url} alt={formatOutputKey(outputKey)} className="w-full h-full object-contain" />
        </div>
      </div>
    );
  }

  // ── Image array (mood board, patterns, elements, inspirations) ──
  if (IMAGE_ARRAY_KEYS.has(outputKey)) {
    const urls = Array.isArray(value)
      ? (value as unknown[]).filter((u): u is string => typeof u === 'string' && isUrl(u))
      : typeof value === 'string' && isUrl(value)
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

  // ── Color palette / design system colors ──
  if (COLOR_KEYS.has(outputKey) && typeof value === 'object' && value !== null) {
    const swatches = extractColorSwatches(value as Record<string, unknown>);
    if (swatches.length === 0) return null;
    return (
      <div className="flex flex-wrap gap-1.5 mt-1">
        {swatches.slice(0, 8).map((s, i) => (
          <div key={i} className="flex flex-col items-center gap-0.5">
            <div
              className="w-7 h-7 rounded-md border border-stone/15 shadow-sm"
              style={{ backgroundColor: s.hex }}
              title={`${s.role}: ${s.hex}`}
            />
            <span className="text-[8px] text-stone leading-none">{s.hex}</span>
          </div>
        ))}
      </div>
    );
  }

  // ── Typography / design system typography ──
  if (TYPOGRAPHY_KEYS.has(outputKey) && typeof value === 'object' && value !== null) {
    const typo = value as Record<string, unknown>;
    const rows = extractTypographyRows(typo);
    if (rows.length === 0) return null;
    return (
      <div className="space-y-1 mt-1">
        {rows.map((r, i) => (
          <div key={i} className="flex items-baseline gap-2">
            <span className="text-[10px] text-stone w-12 flex-shrink-0 truncate">{r.label}</span>
            <span className="text-xs text-charcoal font-medium">{r.font}</span>
            {r.detail && <span className="text-[9px] text-stone/40">{r.detail}</span>}
          </div>
        ))}
      </div>
    );
  }

  // ── Brand archetype (complex profile) ──
  if (outputKey === 'brand_archetype' && typeof value === 'object' && value !== null) {
    const arch = value as Record<string, unknown>;
    const name = arch.name as string | undefined;
    const motto = arch.motto as string | undefined;
    const voice = arch.brand_voice || arch.voice;
    return (
      <div className="mt-1 space-y-1">
        {name && <p className="text-xs font-semibold text-charcoal">{name}</p>}
        {motto && <p className="text-[10px] text-stone italic">&ldquo;{motto}&rdquo;</p>}
        {Array.isArray(voice) && (
          <div className="flex flex-wrap gap-1">
            {(voice as string[]).slice(0, 4).map((v, i) => (
              <span key={i} className="text-[9px] bg-teal/8 text-teal px-1.5 py-0.5 rounded-full">{v}</span>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── Generic array rendering ──
  if (Array.isArray(value)) {
    const items = value as unknown[];
    if (items.length === 0) return null;

    if (items.every(i => typeof i === 'string' && isUrl(i as string))) {
      return (
        <div className="flex flex-wrap gap-1.5 mt-1">
          {(items as string[]).slice(0, 6).map((url, i) => (
            <div key={i} className="w-10 h-10 rounded border border-stone/10 bg-white overflow-hidden flex-shrink-0">
              <img src={url} alt="" className="w-full h-full object-cover" />
            </div>
          ))}
          {items.length > 6 && (
            <div className="w-10 h-10 rounded border border-stone/10 bg-stone/5 flex items-center justify-center flex-shrink-0">
              <span className="text-[9px] text-stone font-medium">+{items.length - 6}</span>
            </div>
          )}
        </div>
      );
    }

    if (items.every(i => typeof i === 'string')) {
      return (
        <ul className="mt-1 space-y-0.5">
          {(items as string[]).slice(0, 6).map((s, i) => (
            <li key={i} className="text-[11px] text-charcoal leading-snug flex gap-1.5">
              <span className="text-stone/30 flex-shrink-0">&#x2022;</span>
              <span>{s.length > 120 ? s.slice(0, 120) + '...' : s}</span>
            </li>
          ))}
          {items.length > 6 && (
            <li className="text-[10px] text-stone/40 italic">+{items.length - 6} more</li>
          )}
        </ul>
      );
    }

    return (
      <div className="mt-1 space-y-1.5">
        {items.slice(0, 5).map((item, i) => {
          if (typeof item !== 'object' || item === null) return null;
          const obj = item as Record<string, unknown>;
          const label = (obj.name || obj.title || obj.label || obj.value || obj.stage || Object.values(obj)[0]) as string | undefined;
          const desc = (obj.description || obj.definition || obj.detail || obj.example) as string | undefined;
          if (!label) return null;
          return (
            <div key={i}>
              <p className="text-[11px] font-medium text-charcoal">{String(label)}</p>
              {desc && <p className="text-[10px] text-stone leading-snug">{String(desc).slice(0, 100)}{String(desc).length > 100 ? '...' : ''}</p>}
            </div>
          );
        })}
        {items.length > 5 && (
          <p className="text-[10px] text-stone/40 italic">+{items.length - 5} more</p>
        )}
      </div>
    );
  }

  // ── Generic object rendering (key-value pairs) ──
  if (typeof value === 'object' && value !== null) {
    const obj = value as Record<string, unknown>;
    const entries = Object.entries(obj).filter(([, v]) => v !== null && v !== undefined && v !== '');
    if (entries.length === 0) return null;

    const swatches = extractColorSwatches(obj);
    if (swatches.length >= 2) {
      return (
        <div className="flex flex-wrap gap-1.5 mt-1">
          {swatches.slice(0, 8).map((s, i) => (
            <div key={i} className="flex flex-col items-center gap-0.5">
              <div
                className="w-7 h-7 rounded-md border border-stone/15 shadow-sm"
                style={{ backgroundColor: s.hex }}
                title={`${s.role}: ${s.hex}`}
              />
              <span className="text-[8px] text-stone leading-none">{s.hex}</span>
            </div>
          ))}
        </div>
      );
    }

    const typoRows = extractTypographyRows(obj);
    if (typoRows.length > 0) {
      return (
        <div className="space-y-1 mt-1">
          {typoRows.map((r, i) => (
            <div key={i} className="flex items-baseline gap-2">
              <span className="text-[10px] text-stone w-12 flex-shrink-0 truncate">{r.label}</span>
              <span className="text-xs text-charcoal font-medium">{r.font}</span>
              {r.detail && <span className="text-[9px] text-stone/40">{r.detail}</span>}
            </div>
          ))}
        </div>
      );
    }

    return (
      <div className="mt-1 space-y-1">
        {entries.slice(0, 6).map(([key, val]) => {
          const display = typeof val === 'string'
            ? (val.length > 100 ? val.slice(0, 100) + '...' : val)
            : Array.isArray(val)
              ? (val as unknown[]).map(v => typeof v === 'string' ? v : JSON.stringify(v)).join(', ').slice(0, 100)
              : typeof val === 'object'
                ? '[...]'
                : String(val);
          return (
            <div key={key}>
              <span className="text-[10px] text-stone">{key.replace(/_/g, ' ')}</span>
              <p className="text-[11px] text-charcoal leading-snug">{display}</p>
            </div>
          );
        })}
        {entries.length > 6 && (
          <p className="text-[10px] text-stone/40 italic">+{entries.length - 6} more fields</p>
        )}
      </div>
    );
  }

  return null;
}

// ─── Helper functions ───

function extractColorSwatches(obj: Record<string, unknown>): { hex: string; role: string }[] {
  const swatches: { hex: string; role: string }[] = [];

  const colorsArr = obj.colors as Array<Record<string, unknown>> | undefined;
  if (Array.isArray(colorsArr)) {
    for (const c of colorsArr) {
      if (c && typeof c.hex === 'string') {
        swatches.push({ hex: c.hex, role: (c.role as string) || '' });
      }
    }
    if (swatches.length > 0) return swatches;
  }

  for (const [role, val] of Object.entries(obj)) {
    if (typeof val === 'object' && val !== null && 'hex' in (val as Record<string, unknown>)) {
      swatches.push({ hex: (val as Record<string, unknown>).hex as string, role });
    } else if (typeof val === 'string' && /^#[0-9a-fA-F]{3,8}$/.test(val)) {
      swatches.push({ hex: val, role });
    }
  }

  return swatches;
}

function extractTypographyRows(obj: Record<string, unknown>): { label: string; font: string; detail?: string }[] {
  const rows: { label: string; font: string; detail?: string }[] = [];

  const fontFields = [
    { key: 'heading_font', weight: 'heading_weight', label: 'Heading' },
    { key: 'body_font', weight: 'body_weight', label: 'Body' },
    { key: 'accent_font', weight: 'accent_weight', label: 'Accent' },
  ];
  for (const f of fontFields) {
    const font = obj[f.key] as string | undefined;
    if (font) {
      rows.push({ label: f.label, font, detail: obj[f.weight] as string | undefined });
    }
  }
  if (rows.length > 0) return rows;

  for (const [key, val] of Object.entries(obj)) {
    if (typeof val === 'object' && val !== null) {
      const sub = val as Record<string, unknown>;
      const font = (sub.font_family || sub.font || sub.family) as string | undefined;
      const size = (sub.size || sub.font_size) as string | undefined;
      const weight = (sub.weight || sub.font_weight) as string | undefined;
      if (font) {
        const detail = [size, weight].filter(Boolean).join(' / ');
        rows.push({ label: key.replace(/_/g, ' '), font, detail: detail || undefined });
      }
    }
  }

  return rows;
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
