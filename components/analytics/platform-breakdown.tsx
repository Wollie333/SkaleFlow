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
  totalImpressions: number;
}

interface PlatformBreakdownProps {
  data: PlatformSummary[];
  isLoading?: boolean;
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
                <div className="flex justify-between">
                  <span className="text-sm text-stone">Avg Engagement Rate</span>
                  <span className="text-sm font-semibold text-charcoal">
                    {platform.avgEngagementRate.toFixed(2)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-stone">Total Impressions</span>
                  <span className="text-sm font-semibold text-charcoal">
                    {platform.totalImpressions >= 1000
                      ? `${(platform.totalImpressions / 1000).toFixed(1)}k`
                      : platform.totalImpressions.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-stone">Likes</span>
                  <span className="text-sm text-charcoal">{platform.totalLikes.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-stone">Comments</span>
                  <span className="text-sm text-charcoal">{platform.totalComments.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-stone">Shares</span>
                  <span className="text-sm text-charcoal">{platform.totalShares.toLocaleString()}</span>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
