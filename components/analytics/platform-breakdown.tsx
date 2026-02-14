'use client';

import { Card, Badge } from '@/components/ui';
import { PLATFORM_CONFIG } from '@/lib/social/types';
import type { SocialPlatform } from '@/types/database';
import { cn } from '@/lib/utils';

interface PlatformSummary {
  platform: SocialPlatform;
  totalPosts: number;
  avgEngagementRate: number;
  totalLikes: number;
  totalComments: number;
  totalShares: number;
  totalSaves: number;
  totalImpressions: number;
  totalReach: number;
  totalClicks: number;
  totalVideoViews: number;
}

interface PlatformBreakdownProps {
  data: PlatformSummary[];
  isLoading?: boolean;
}

function formatCompact(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}k`;
  return v.toLocaleString();
}

export function PlatformBreakdown({ data, isLoading }: PlatformBreakdownProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map(i => (
          <Card key={i} className="p-5">
            <div className="h-24 bg-stone/5 rounded-lg animate-pulse" />
          </Card>
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return null;
  }

  return (
    <div>
      <h3 className="text-heading-md text-charcoal mb-4">Platform Breakdown</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.map(platform => {
          const config = PLATFORM_CONFIG[platform.platform];

          // Build metric rows, only showing non-zero values
          const metricRows: { label: string; value: string }[] = [
            { label: 'Avg Engagement Rate', value: `${platform.avgEngagementRate.toFixed(2)}%` },
            { label: 'Total Impressions', value: formatCompact(platform.totalImpressions) },
          ];
          if (platform.totalReach > 0) {
            metricRows.push({ label: 'Reach', value: formatCompact(platform.totalReach) });
          }
          metricRows.push(
            { label: 'Likes', value: platform.totalLikes.toLocaleString() },
            { label: 'Comments', value: platform.totalComments.toLocaleString() },
            { label: 'Shares', value: platform.totalShares.toLocaleString() },
          );
          if (platform.totalSaves > 0) {
            metricRows.push({ label: 'Saves', value: formatCompact(platform.totalSaves) });
          }
          if (platform.totalClicks > 0) {
            metricRows.push({ label: 'Clicks', value: formatCompact(platform.totalClicks) });
          }
          if (platform.totalVideoViews > 0) {
            metricRows.push({ label: 'Video Views', value: formatCompact(platform.totalVideoViews) });
          }

          return (
            <Card key={platform.platform} className="p-5">
              <div className="flex items-center gap-3 mb-4">
                <Badge className={cn('text-white', config.bgColor)}>
                  {config.name}
                </Badge>
                <span className="text-xs text-stone">
                  {platform.totalPosts} post{platform.totalPosts !== 1 ? 's' : ''}
                </span>
              </div>

              <div className="space-y-3">
                {metricRows.map(row => (
                  <div key={row.label} className="flex justify-between">
                    <span className="text-sm text-stone">{row.label}</span>
                    <span className="text-sm font-semibold text-charcoal">{row.value}</span>
                  </div>
                ))}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
