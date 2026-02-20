'use client';

import { Cog6ToothIcon, ArrowPathIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import { getPlacementLabel } from '@/config/placement-types';
import type { SocialPlatform, PlacementType } from '@/types/database';
import type { GeneratedItem, PlacementConfig, SharedConfig } from './types';
import { FORMAT_LABELS } from '@/config/script-frameworks';

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

interface PlacementPreviewCardProps {
  placement: PlacementType;
  platform: SocialPlatform;
  item: GeneratedItem | null;
  config: PlacementConfig | null;
  sharedConfig: SharedConfig;
  isGenerating: boolean;
  hasError?: string | null;
  onCardClick: () => void;
  onConfigClick: (e: React.MouseEvent) => void;
  onRegenerate?: (e: React.MouseEvent) => void;
}

export function PlacementPreviewCard({
  placement,
  platform,
  item,
  config,
  sharedConfig,
  isGenerating,
  hasError,
  onCardClick,
  onConfigClick,
  onRegenerate,
}: PlacementPreviewCardProps) {
  const color = PLATFORM_COLORS[platform];
  const platformLabel = PLATFORM_LABELS[platform];
  const placementLabel = getPlacementLabel(placement);
  const hasConfigOverride = config && (config.format || config.funnelStage || config.storybrandStage);

  // Determine effective config for display
  const effectiveFormat = config?.format || sharedConfig.format;

  return (
    <div
      onClick={item ? onCardClick : undefined}
      className={cn(
        'rounded-xl overflow-hidden border transition-all',
        hasError
          ? 'border-red-300 bg-red-50/50'
          : item
            ? 'border-stone/10 hover:border-teal hover:shadow-md cursor-pointer'
            : 'border-stone/10',
        isGenerating && 'animate-pulse'
      )}
    >
      {/* Card header */}
      <div
        className="flex items-center justify-between px-3 py-2"
        style={{ backgroundColor: color }}
      >
        <div className="flex items-center gap-2 text-white">
          <span className="text-xs font-medium">
            {platformLabel} &middot; {placementLabel}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {hasConfigOverride && (
            <span className="text-[10px] bg-cream-warm/20 text-white px-1.5 py-0.5 rounded-full font-medium">
              Custom
            </span>
          )}
          <button
            onClick={onConfigClick}
            className="p-0.5 rounded hover:bg-cream-warm/20 transition-colors text-white"
            title="Configure this placement"
          >
            <Cog6ToothIcon className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Card body */}
      <div className="p-3 min-h-[100px]">
        {isGenerating ? (
          // Generating state
          <div className="space-y-2">
            <div className="h-3 bg-cream-warm rounded animate-pulse w-full" />
            <div className="h-3 bg-cream-warm rounded animate-pulse w-4/5" />
            <div className="h-3 bg-cream-warm rounded animate-pulse w-3/5" />
            <div className="flex items-center justify-center pt-2">
              <div className="w-5 h-5 border-2 border-teal border-t-transparent rounded-full animate-spin" />
            </div>
          </div>
        ) : hasError ? (
          // Error state
          <div className="flex flex-col items-center gap-2 py-2">
            <ExclamationCircleIcon className="w-6 h-6 text-red-400" />
            <p className="text-xs text-red-600 text-center">{hasError}</p>
            {onRegenerate && (
              <button
                onClick={onRegenerate}
                className="flex items-center gap-1 text-xs text-teal hover:underline"
              >
                <ArrowPathIcon className="w-3.5 h-3.5" />
                Retry
              </button>
            )}
          </div>
        ) : item ? (
          // Generated state
          <div className="space-y-2">
            <p className="text-sm text-charcoal line-clamp-3 leading-relaxed">
              {item.caption || 'No caption generated'}
            </p>
            {item.hashtags && item.hashtags.length > 0 && (
              <p className="text-xs text-teal truncate">
                {item.hashtags.slice(0, 4).map(h => (h.startsWith('#') ? h : `#${h}`)).join(' ')}
                {item.hashtags.length > 4 && ` +${item.hashtags.length - 4}`}
              </p>
            )}
            <div className="flex items-center justify-between pt-1 border-t border-stone/10">
              <span className="text-[10px] text-stone">Click to edit</span>
              <span className={cn(
                'text-[10px] px-1.5 py-0.5 rounded-full font-medium',
                item.status === 'idea' ? 'bg-stone/10 text-stone' :
                item.status === 'scripted' ? 'bg-teal/10 text-teal' :
                item.status === 'scheduled' ? 'bg-blue-500/10 text-blue-400' :
                item.status === 'published' ? 'bg-emerald-100 text-emerald-700' :
                item.status === 'rejected' ? 'bg-red-500/10 text-red-400' :
                'bg-stone/10 text-stone'
              )}>
                {item.status}
              </span>
            </div>
          </div>
        ) : (
          // Empty state
          <div className="flex flex-col items-center justify-center py-3 text-center">
            <div className="w-8 h-8 rounded-full bg-cream flex items-center justify-center mb-2">
              <span className="text-stone-400 text-xs font-medium">AI</span>
            </div>
            <p className="text-xs text-stone">Will be generated</p>
            <p className="text-[10px] text-stone-400 mt-0.5">
              {FORMAT_LABELS[effectiveFormat] || effectiveFormat}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
