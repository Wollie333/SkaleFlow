'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { SocialPreview } from './social-preview';
import {
  PLACEMENT_OPTIONS,
  PLATFORM_ORDER,
  getEnabledPlatforms,
  getPlacementLabel,
  countPlacements,
  type PlatformPlacementsMap,
  type PlacementOption,
} from '@/config/placement-types';
import type { SocialPlatform, PlacementType } from '@/types/database';
import { PencilSquareIcon } from '@heroicons/react/24/outline';
import type { InstanceSpec } from './instance-edit-form';

// ─── Platform brand colors ──────────────────────────────────────────────
const PLATFORM_COLORS: Record<SocialPlatform, string> = {
  linkedin: '#0A66C2',
  facebook: '#1877F2',
  instagram: '#E4405F',
  twitter: '#000000',
  tiktok: '#000000',
  youtube: '#FF0000',
};

const PLATFORM_LABELS: Record<SocialPlatform, string> = {
  linkedin: 'LinkedIn',
  facebook: 'Facebook',
  instagram: 'Instagram',
  twitter: 'X',
  tiktok: 'TikTok',
  youtube: 'YouTube',
};

// ─── Simple SVG icons per platform ──────────────────────────────────────
function PlatformIcon({ platform, size = 20 }: { platform: SocialPlatform; size?: number }) {
  const s = size;
  switch (platform) {
    case 'linkedin':
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor">
          <path d="M6.94 5a2 2 0 1 1-4-.002 2 2 0 0 1 4 .002ZM3.23 8.5h3.42V21H3.23V8.5Zm5.46 0h3.28v1.71h.05c.46-.87 1.58-1.79 3.24-1.79 3.47 0 4.1 2.28 4.1 5.25V21h-3.42v-5.96c0-1.42-.03-3.25-1.98-3.25-1.98 0-2.28 1.55-2.28 3.15V21H8.69V8.5Z" />
        </svg>
      );
    case 'facebook':
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor">
          <path d="M9.198 21.5h4v-8.01h3.604l.396-3.98h-4V7.5a1 1 0 0 1 1-1h3v-4h-3a5 5 0 0 0-5 5v2.01h-2l-.396 3.98h2.396v8.01Z" />
        </svg>
      );
    case 'instagram':
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2c2.717 0 3.056.01 4.122.06 1.065.05 1.79.217 2.428.465.66.254 1.216.598 1.772 1.153a4.908 4.908 0 0 1 1.153 1.772c.247.637.415 1.363.465 2.428.047 1.066.06 1.405.06 4.122 0 2.717-.013 3.056-.06 4.122-.05 1.065-.218 1.79-.465 2.428a4.883 4.883 0 0 1-1.153 1.772 4.915 4.915 0 0 1-1.772 1.153c-.637.247-1.363.415-2.428.465-1.066.047-1.405.06-4.122.06-2.717 0-3.056-.013-4.122-.06-1.065-.05-1.79-.218-2.428-.465a4.89 4.89 0 0 1-1.772-1.153 4.904 4.904 0 0 1-1.153-1.772c-.248-.637-.415-1.363-.465-2.428C2.013 15.056 2 14.717 2 12c0-2.717.01-3.056.06-4.122.05-1.066.217-1.79.465-2.428a4.88 4.88 0 0 1 1.153-1.772A4.897 4.897 0 0 1 5.45 2.525c.638-.248 1.362-.415 2.428-.465C8.944 2.013 9.283 2 12 2Zm0 5a5 5 0 1 0 0 10 5 5 0 0 0 0-10Zm0 8.25a3.25 3.25 0 1 1 0-6.5 3.25 3.25 0 0 1 0 6.5ZM18.406 6.155a1.187 1.187 0 1 0-2.374 0 1.187 1.187 0 0 0 2.374 0Z" />
        </svg>
      );
    case 'twitter':
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      );
    case 'tiktok':
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor">
          <path d="M16.6 5.82s.51.5 0 0A4.278 4.278 0 0 1 15.54 3h-3.09v12.4a2.592 2.592 0 0 1-2.59 2.5c-1.42 0-2.6-1.16-2.6-2.6 0-1.72 1.66-3.01 3.37-2.48V9.66c-3.45-.46-6.47 2.22-6.47 5.64 0 3.33 2.76 5.7 5.69 5.7 3.14 0 5.69-2.55 5.69-5.7V9.01a7.35 7.35 0 0 0 4.3 1.38V7.3s-1.88.09-3.24-1.48Z" />
        </svg>
      );
    case 'youtube':
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814ZM9.545 15.568V8.432L15.818 12l-6.273 3.568Z" />
        </svg>
      );
    default:
      return null;
  }
}

// ─── Props ──────────────────────────────────────────────────────────────
export interface PreviewPanelProps {
  platformPlacements: PlatformPlacementsMap;
  onPlatformPlacementsChange: (map: PlatformPlacementsMap) => void;
  caption: string;
  hashtags: string[];
  mediaUrls: string[];
  targetUrl?: string;
  userName?: string;
  instanceSpecs: Record<string, InstanceSpec>;
  onEditInstance?: (placementType: PlacementType) => void;
  editingInstance?: PlacementType | null;
  hasMedia?: boolean;
  hasVideo?: boolean;
}

// ─── Component ──────────────────────────────────────────────────────────
export function PreviewPanel({
  platformPlacements,
  onPlatformPlacementsChange,
  caption,
  hashtags,
  mediaUrls,
  targetUrl,
  userName,
  instanceSpecs,
  onEditInstance,
  editingInstance,
  hasMedia,
  hasVideo,
}: PreviewPanelProps) {
  const [activePlatform, setActivePlatform] = useState<SocialPlatform | null>(null);

  const enabledPlatforms = getEnabledPlatforms(platformPlacements);
  const { platforms: platformCount, placements: placementCount } = countPlacements(platformPlacements);

  // Auto-select first enabled platform if current active is disabled
  const currentActive =
    activePlatform && platformPlacements[activePlatform]?.enabled
      ? activePlatform
      : enabledPlatforms.length > 0
        ? enabledPlatforms[0]
        : null;

  // Get placements for active platform
  const activePlacementOptions: PlacementOption[] = currentActive
    ? PLACEMENT_OPTIONS[currentActive]
    : [];
  const activePlacementSet = currentActive
    ? platformPlacements[currentActive].placements
    : new Set<PlacementType>();

  // Collect all selected placements across all enabled platforms (for multi-card grid)
  const allSelectedPlacements: { platform: SocialPlatform; placement: PlacementType }[] = [];
  for (const platform of PLATFORM_ORDER) {
    if (platformPlacements[platform].enabled) {
      platformPlacements[platform].placements.forEach(p => {
        allSelectedPlacements.push({ platform, placement: p });
      });
    }
  }

  // ─── Handlers ─────────────────────────────────────────────────────────
  const handlePlatformClick = (platform: SocialPlatform) => {
    const state = platformPlacements[platform];
    if (state.enabled) {
      setActivePlatform(platform);
    } else {
      const defaultPlacement = PLACEMENT_OPTIONS[platform][0].value;
      const updated = { ...platformPlacements };
      updated[platform] = {
        enabled: true,
        placements: new Set([defaultPlacement]),
      };
      onPlatformPlacementsChange(updated);
      setActivePlatform(platform);
    }
  };

  const handlePlatformDoubleClick = (platform: SocialPlatform) => {
    const state = platformPlacements[platform];
    if (state.enabled) {
      const updated = { ...platformPlacements };
      updated[platform] = { enabled: false, placements: new Set() };
      onPlatformPlacementsChange(updated);
      if (activePlatform === platform) {
        const remaining = PLATFORM_ORDER.filter(p => p !== platform && updated[p].enabled);
        setActivePlatform(remaining.length > 0 ? remaining[0] : null);
      }
    }
  };

  const handleTogglePlatformOff = (platform: SocialPlatform) => {
    const updated = { ...platformPlacements };
    updated[platform] = { enabled: false, placements: new Set() };
    onPlatformPlacementsChange(updated);
    if (activePlatform === platform) {
      const remaining = PLATFORM_ORDER.filter(p => p !== platform && updated[p].enabled);
      setActivePlatform(remaining.length > 0 ? remaining[0] : null);
    }
  };

  const handlePlacementToggle = (placement: PlacementType) => {
    if (!currentActive) return;
    const state = platformPlacements[currentActive];
    const next = new Set(state.placements);
    if (next.has(placement)) {
      if (next.size > 1) {
        next.delete(placement);
      }
    } else {
      next.add(placement);
    }
    const updated = { ...platformPlacements };
    updated[currentActive] = { ...state, placements: next };
    onPlatformPlacementsChange(updated);
  };

  // ─── Render ───────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-charcoal">Preview &amp; Channels</h3>
        {currentActive && platformPlacements[currentActive]?.enabled && (
          <button
            onClick={() => handleTogglePlatformOff(currentActive)}
            className="text-xs text-stone hover:text-red-500 transition-colors"
          >
            Remove {PLATFORM_LABELS[currentActive]}
          </button>
        )}
      </div>

      {/* ── Round Platform Logos ──────────────────────────────────── */}
      <div className="flex items-center justify-center gap-3">
        {PLATFORM_ORDER.map(platform => {
          const state = platformPlacements[platform];
          const isEnabled = state.enabled;
          const isActive = currentActive === platform;
          const color = PLATFORM_COLORS[platform];

          return (
            <button
              key={platform}
              onClick={() => handlePlatformClick(platform)}
              onDoubleClick={() => handlePlatformDoubleClick(platform)}
              title={`${PLATFORM_LABELS[platform]}${isEnabled ? ' (double-click to remove)' : ''}`}
              className={cn(
                'w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 shrink-0',
                isActive
                  ? 'text-white shadow-lg scale-105'
                  : isEnabled
                    ? 'shadow-sm hover:shadow-md'
                    : 'bg-stone-100 border border-stone-200 text-stone-400 hover:bg-stone-50 hover:border-stone-300'
              )}
              style={
                isActive
                  ? { backgroundColor: color, borderColor: color, boxShadow: `0 0 0 3px ${color}30` }
                  : isEnabled
                    ? { backgroundColor: `${color}15`, borderWidth: 2, borderStyle: 'solid', borderColor: color, color }
                    : undefined
              }
            >
              <PlatformIcon platform={platform} size={20} />
            </button>
          );
        })}
      </div>

      {/* ── Placement Pills ──────────────────────────────────────── */}
      {currentActive && activePlacementOptions.length > 0 && (
        <div className="flex items-center justify-center gap-2 flex-wrap">
          {activePlacementOptions.map(opt => {
            const isSelected = activePlacementSet.has(opt.value);
            const needsWarning =
              (opt.requiresMedia && !hasMedia) || (opt.requiresVideo && !hasVideo);

            return (
              <button
                key={opt.value}
                onClick={() => handlePlacementToggle(opt.value)}
                className={cn(
                  'px-3 py-1.5 rounded-full text-xs font-medium transition-colors border',
                  isSelected
                    ? 'bg-teal text-white border-teal'
                    : 'bg-stone-50 text-stone-500 border-stone-200 hover:border-stone-300'
                )}
              >
                {opt.label}
                {isSelected && needsWarning && (
                  <span className="ml-1 inline-block w-2 h-2 rounded-full bg-amber-400" title={opt.requiresVideo ? 'Video required' : 'Media required'} />
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* ── Divider ──────────────────────────────────────────────── */}
      <div className="border-t border-stone-100" />

      {/* ── Multi-Card Preview Grid ────────────────────────────── */}
      {allSelectedPlacements.length > 0 ? (
        <div className="space-y-3 max-h-[600px] overflow-y-auto">
          {allSelectedPlacements.map(({ platform, placement }) => {
            const color = PLATFORM_COLORS[platform];
            const platformLabel = PLATFORM_LABELS[platform];
            const placementLabel = getPlacementLabel(placement);
            const spec = instanceSpecs[placement];
            const effectiveCaption = spec?.caption || caption;
            const effectiveHashtags = spec?.hashtags || hashtags;
            const isEditing = editingInstance === placement;
            const hasOverride = spec && (spec.caption || spec.hashtags || spec.title);

            return (
              <div
                key={placement}
                className={cn(
                  'rounded-xl overflow-hidden border transition-all',
                  isEditing
                    ? 'border-teal ring-2 ring-teal/20'
                    : 'border-stone-200'
                )}
              >
                {/* Card header */}
                <div
                  className="flex items-center justify-between px-3 py-2"
                  style={{ backgroundColor: color }}
                >
                  <div className="flex items-center gap-2 text-white">
                    <PlatformIcon platform={platform} size={14} />
                    <span className="text-xs font-medium">
                      {platformLabel} {placementLabel}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {hasOverride && (
                      <span className="text-[10px] bg-white/20 text-white px-1.5 py-0.5 rounded-full font-medium">
                        Customized
                      </span>
                    )}
                    {onEditInstance && (
                      <button
                        onClick={() => onEditInstance(placement)}
                        className="p-0.5 rounded hover:bg-white/20 transition-colors text-white"
                        title="Edit this instance"
                      >
                        <PencilSquareIcon className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Preview body */}
                <div className="bg-stone-50 p-2">
                  <SocialPreview
                    platform={platform}
                    caption={effectiveCaption}
                    hashtags={effectiveHashtags}
                    mediaUrls={mediaUrls}
                    targetUrl={targetUrl}
                    userName={userName}
                    placementType={placement}
                  />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-stone-50 rounded-xl p-3 min-h-[380px] flex flex-col">
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center mb-3">
              <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="text-stone-400">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-stone-500">Select a channel to preview</p>
            <p className="text-xs text-stone-400 mt-1">Click a platform icon above to get started</p>
          </div>
        </div>
      )}

      {/* ── Summary Footer ───────────────────────────────────────── */}
      {platformCount > 0 && (
        <div className="bg-stone-50 rounded-lg px-3 py-2">
          <p className="text-xs font-medium text-teal">
            Publishing to {platformCount} channel{platformCount !== 1 ? 's' : ''}, {placementCount} post{placementCount !== 1 ? 's' : ''}
          </p>
        </div>
      )}
    </div>
  );
}
