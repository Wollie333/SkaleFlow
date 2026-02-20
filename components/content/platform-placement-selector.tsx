'use client';

import { useCallback } from 'react';
import type { SocialPlatform, PlacementType } from '@/types/database';
import {
  PLACEMENT_OPTIONS,
  PLATFORM_LABELS,
  PLATFORM_ORDER,
  getDefaultPlacement,
  countPlacements,
  type PlatformPlacementsMap,
} from '@/config/placement-types';

interface PlatformPlacementSelectorProps {
  value: PlatformPlacementsMap;
  onChange: (value: PlatformPlacementsMap) => void;
  mediaUploaded?: boolean;
  videoUploaded?: boolean;
}

export default function PlatformPlacementSelector({
  value,
  onChange,
  mediaUploaded = false,
  videoUploaded = false,
}: PlatformPlacementSelectorProps) {
  const togglePlatform = useCallback(
    (platform: SocialPlatform) => {
      const current = value[platform];
      const next = { ...value };
      if (current.enabled) {
        next[platform] = { enabled: false, placements: new Set() };
      } else {
        next[platform] = {
          enabled: true,
          placements: new Set([getDefaultPlacement(platform)]),
        };
      }
      onChange(next);
    },
    [value, onChange]
  );

  const togglePlacement = useCallback(
    (platform: SocialPlatform, placement: PlacementType) => {
      const current = value[platform];
      if (!current.enabled) return;
      const next = { ...value };
      const placements = new Set(current.placements);
      if (placements.has(placement)) {
        placements.delete(placement);
        // Ensure at least one placement if platform is enabled
        if (placements.size === 0) {
          next[platform] = { enabled: false, placements: new Set() };
        } else {
          next[platform] = { enabled: true, placements };
        }
      } else {
        placements.add(placement);
        next[platform] = { enabled: true, placements };
      }
      onChange(next);
    },
    [value, onChange]
  );

  const { platforms: platformCount, placements: placementCount } = countPlacements(value);

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-charcoal-700">
        Platforms & Placements
      </label>

      <div className="border border-stone/10 rounded-lg divide-y divide-stone-100">
        {PLATFORM_ORDER.map((platform) => {
          const platformState = value[platform];
          const options = PLACEMENT_OPTIONS[platform];

          return (
            <div key={platform} className="p-3">
              <div className="flex items-center gap-3">
                {/* Platform toggle */}
                <button
                  type="button"
                  onClick={() => togglePlatform(platform)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    platformState.enabled
                      ? 'bg-teal-50 text-teal-700 border border-teal-200'
                      : 'bg-cream text-stone border border-stone/10 hover:border-stone/10'
                  }`}
                >
                  <span
                    className={`w-3 h-3 rounded-sm border-2 flex items-center justify-center ${
                      platformState.enabled
                        ? 'border-teal-600 bg-teal-600'
                        : 'border-stone/30'
                    }`}
                  >
                    {platformState.enabled && (
                      <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 12 12">
                        <path d="M10 3L4.5 8.5 2 6" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </span>
                  {PLATFORM_LABELS[platform]}
                </button>

                {/* Placement chips */}
                {platformState.enabled && (
                  <div className="flex flex-wrap gap-1.5">
                    {options.map((option) => {
                      const isSelected = platformState.placements.has(option.value);
                      const needsMedia = option.requiresMedia && !mediaUploaded;
                      const needsVideo = option.requiresVideo && !videoUploaded;
                      const hasWarning = needsMedia || needsVideo;

                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => togglePlacement(platform, option.value)}
                          title={
                            hasWarning
                              ? `Requires ${needsVideo ? 'video' : 'media'} upload`
                              : option.description
                          }
                          className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                            isSelected
                              ? hasWarning
                                ? 'bg-gold-50 text-gold-700 border border-gold-300'
                                : 'bg-teal-100 text-teal-800 border border-teal-200'
                              : 'bg-cream-warm text-stone border border-stone/10 hover:border-stone/10'
                          }`}
                        >
                          {option.label}
                          {isSelected && hasWarning && (
                            <span className="ml-1 text-gold-500">!</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary */}
      {platformCount > 0 && (
        <p className="text-xs text-stone">
          {platformCount} platform{platformCount !== 1 ? 's' : ''},{' '}
          {placementCount} placement{placementCount !== 1 ? 's' : ''}{' '}
          ({placementCount} post{placementCount !== 1 ? 's' : ''} will be created)
        </p>
      )}
    </div>
  );
}
