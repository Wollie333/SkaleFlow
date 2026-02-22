'use client';

import { cn } from '@/lib/utils';
import {
  PencilIcon,
  TrashIcon,
  EyeIcon,
  EyeSlashIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';

interface CompetitorCardProps {
  competitor: any;
  onEdit: () => void;
  onDelete: () => void;
  onToggleActive: () => void;
}

const PLATFORM_COLORS: Record<string, string> = {
  linkedin: 'bg-[#0A66C2]',
  facebook: 'bg-[#1877F2]',
  instagram: 'bg-gradient-to-br from-[#F58529] via-[#DD2A7B] to-[#8134AF]',
  twitter: 'bg-[#1DA1F2]',
  tiktok: 'bg-[#000000]',
  youtube: 'bg-[#FF0000]',
};

export function CompetitorCard({
  competitor,
  onEdit,
  onDelete,
  onToggleActive,
}: CompetitorCardProps) {
  const activePlatforms = [
    competitor.linkedin_handle && 'linkedin',
    competitor.facebook_handle && 'facebook',
    competitor.instagram_handle && 'instagram',
    competitor.twitter_handle && 'twitter',
    competitor.tiktok_handle && 'tiktok',
    competitor.youtube_handle && 'youtube',
  ].filter(Boolean);

  // Calculate average engagement from recent metrics
  const avgEngagement =
    competitor.metrics && competitor.metrics.length > 0
      ? (
          competitor.metrics.reduce(
            (sum: number, m: any) => sum + (m.avg_engagement_rate || 0),
            0
          ) / competitor.metrics.length
        ).toFixed(2)
      : 0;

  // Get follower growth trend (if we have metrics)
  const hasGrowth =
    competitor.metrics &&
    competitor.metrics.length > 0 &&
    competitor.metrics.some((m: any) => m.follower_growth_rate !== 0);

  const avgGrowth =
    hasGrowth
      ? (
          competitor.metrics.reduce(
            (sum: number, m: any) => sum + (m.follower_growth_rate || 0),
            0
          ) / competitor.metrics.length
        ).toFixed(2)
      : null;

  return (
    <div
      className={cn(
        'group bg-cream-warm rounded-xl border overflow-hidden hover:shadow-lg transition-all',
        competitor.is_active ? 'border-stone/10' : 'border-stone/20 opacity-60'
      )}
    >
      {/* Header */}
      <div className="p-4 border-b border-stone/10">
        <div className="flex items-start gap-3 mb-3">
          {/* Logo */}
          {competitor.logo_url ? (
            <img
              src={competitor.logo_url}
              alt={competitor.name}
              className="w-12 h-12 rounded-lg object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded-lg bg-stone/10 flex items-center justify-center text-xl font-bold text-stone">
              {competitor.name.charAt(0)}
            </div>
          )}

          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-charcoal truncate">{competitor.name}</h3>
            {competitor.description && (
              <p className="text-sm text-stone mt-1 line-clamp-2">{competitor.description}</p>
            )}
          </div>

          {/* Active status toggle */}
          <button
            onClick={onToggleActive}
            className={cn(
              'p-1.5 rounded-lg transition-colors',
              competitor.is_active
                ? 'text-teal hover:bg-teal/10'
                : 'text-stone hover:bg-stone/10'
            )}
            title={competitor.is_active ? 'Deactivate' : 'Activate'}
          >
            {competitor.is_active ? (
              <EyeIcon className="w-4 h-4" />
            ) : (
              <EyeSlashIcon className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Platforms */}
        {activePlatforms.length > 0 && (
          <div className="flex items-center gap-1.5">
            {activePlatforms.map((platform) => (
              <div
                key={platform}
                className={cn('w-2 h-2 rounded-full', PLATFORM_COLORS[platform as string] || 'bg-stone')}
                title={platform as string}
              />
            ))}
          </div>
        )}
      </div>

      {/* Metrics */}
      {competitor.is_active && (
        <div className="p-4">
          {competitor.metrics && competitor.metrics.length > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-stone mb-0.5">Avg Engagement</p>
                <p className="text-sm font-semibold text-teal">{avgEngagement}%</p>
              </div>
              {avgGrowth !== null && (
                <div>
                  <p className="text-xs text-stone mb-0.5">Growth Rate</p>
                  <div className="flex items-center gap-1">
                    {parseFloat(avgGrowth) > 0 ? (
                      <ArrowTrendingUpIcon className="w-3.5 h-3.5 text-green-600" />
                    ) : parseFloat(avgGrowth) < 0 ? (
                      <ArrowTrendingDownIcon className="w-3.5 h-3.5 text-red-600" />
                    ) : null}
                    <p
                      className={cn(
                        'text-sm font-semibold',
                        parseFloat(avgGrowth) > 0 && 'text-green-600',
                        parseFloat(avgGrowth) < 0 && 'text-red-600',
                        parseFloat(avgGrowth) === 0 && 'text-stone'
                      )}
                    >
                      {avgGrowth}%
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-xs text-stone">No metrics available yet</p>
              <p className="text-xs text-stone/60 mt-1">Data will be collected soon</p>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="px-4 py-3 bg-stone/5 border-t border-stone/10 flex items-center justify-between gap-2">
        <Link
          href={`/social/competitors/${competitor.id}`}
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-charcoal hover:text-teal border border-stone/20 hover:border-teal rounded-lg transition-colors"
        >
          <ChartBarIcon className="w-3.5 h-3.5" />
          View Details
        </Link>

        <div className="flex items-center gap-1">
          <button
            onClick={onEdit}
            className="p-1.5 text-stone hover:text-teal hover:bg-teal/10 rounded-lg transition-colors"
            title="Edit"
          >
            <PencilIcon className="w-4 h-4" />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 text-stone hover:text-red-600 hover:bg-red-600/10 rounded-lg transition-colors"
            title="Delete"
          >
            <TrashIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Website link */}
      {competitor.website && (
        <div className="px-4 py-2 bg-stone/5 border-t border-stone/10">
          <a
            href={competitor.website}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-teal hover:text-teal-dark truncate block"
          >
            {competitor.website}
          </a>
        </div>
      )}
    </div>
  );
}
