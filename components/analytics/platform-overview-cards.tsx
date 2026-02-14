'use client';

import { Card } from '@/components/ui';
import {
  DocumentTextIcon,
  HeartIcon,
  EyeIcon,
  ChartBarIcon,
  UsersIcon,
  CursorArrowRaysIcon,
  BookmarkIcon,
  PlayCircleIcon,
  HandThumbUpIcon,
  ChatBubbleLeftIcon,
  ShareIcon,
} from '@heroicons/react/24/outline';
import { PLATFORM_SUPPORTED_METRICS } from '@/lib/analytics/platform-metrics';
import type { MetricKey } from '@/lib/analytics/platform-metrics';
import type { SocialPlatform } from '@/types/database';

interface PlatformOverviewCardsProps {
  platform: SocialPlatform;
  data: {
    totalPosts: number;
    totalLikes: number;
    totalComments: number;
    totalShares: number;
    totalSaves: number;
    totalImpressions: number;
    totalReach: number;
    totalClicks: number;
    totalVideoViews: number;
    avgEngagementRate: number;
  };
  isLoading?: boolean;
}

function formatCompact(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}k`;
  return v.toLocaleString();
}

const ICON_MAP: Record<MetricKey, typeof DocumentTextIcon> = {
  posts: DocumentTextIcon,
  engagement: HeartIcon,
  impressions: EyeIcon,
  engagementRate: ChartBarIcon,
  reach: UsersIcon,
  clicks: CursorArrowRaysIcon,
  saves: BookmarkIcon,
  videoViews: PlayCircleIcon,
  likes: HandThumbUpIcon,
  comments: ChatBubbleLeftIcon,
  shares: ShareIcon,
};

const COLOR_MAP: Record<MetricKey, { color: string; bg: string }> = {
  posts: { color: 'text-charcoal', bg: 'bg-charcoal/10' },
  engagement: { color: 'text-teal', bg: 'bg-teal/10' },
  impressions: { color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
  engagementRate: { color: 'text-violet-600', bg: 'bg-violet-600/10' },
  reach: { color: 'text-violet-500', bg: 'bg-violet-500/10' },
  clicks: { color: 'text-gold', bg: 'bg-gold/10' },
  saves: { color: 'text-pink-500', bg: 'bg-pink-500/10' },
  videoViews: { color: 'text-orange-500', bg: 'bg-orange-500/10' },
  likes: { color: 'text-teal', bg: 'bg-teal/10' },
  comments: { color: 'text-gold', bg: 'bg-gold/10' },
  shares: { color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
};

const LABEL_MAP: Record<MetricKey, string> = {
  posts: 'Posts',
  engagement: 'Engagement',
  impressions: 'Impressions',
  engagementRate: 'Avg Eng. Rate',
  reach: 'Reach',
  clicks: 'Clicks',
  saves: 'Saves',
  videoViews: 'Video Views',
  likes: 'Likes',
  comments: 'Comments',
  shares: 'Shares',
};

function getMetricValue(key: MetricKey, data: PlatformOverviewCardsProps['data']): number {
  switch (key) {
    case 'posts': return data.totalPosts;
    case 'engagement': return data.totalLikes + data.totalComments + data.totalShares;
    case 'impressions': return data.totalImpressions;
    case 'engagementRate': return data.avgEngagementRate;
    case 'reach': return data.totalReach;
    case 'clicks': return data.totalClicks;
    case 'saves': return data.totalSaves;
    case 'videoViews': return data.totalVideoViews;
    case 'likes': return data.totalLikes;
    case 'comments': return data.totalComments;
    case 'shares': return data.totalShares;
  }
}

function formatValue(key: MetricKey, value: number): string {
  if (key === 'engagementRate') return `${value.toFixed(2)}%`;
  return formatCompact(value);
}

// Which metrics to show as cards on the platform tab (skip individual like/comment/share — donut covers those)
const PLATFORM_CARD_METRICS: MetricKey[] = [
  'posts', 'engagement', 'impressions', 'engagementRate', 'reach', 'clicks', 'saves', 'videoViews',
];

export function PlatformOverviewCards({ platform, data, isLoading }: PlatformOverviewCardsProps) {
  const supportedMetrics = PLATFORM_SUPPORTED_METRICS[platform];
  const cards = PLATFORM_CARD_METRICS.filter(m => supportedMetrics.includes(m));

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {cards.map(key => {
        const Icon = ICON_MAP[key];
        const colors = COLOR_MAP[key];
        const value = getMetricValue(key, data);

        return (
          <Card key={key} className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-10 h-10 ${colors.bg} rounded-lg flex items-center justify-center`}>
                <Icon className={`w-5 h-5 ${colors.color}`} />
              </div>
              <span className="text-sm text-stone">{LABEL_MAP[key]}</span>
            </div>
            {isLoading ? (
              <div className="h-8 w-20 bg-stone/10 rounded animate-pulse" />
            ) : (
              <p className="text-2xl font-bold text-charcoal">
                {formatValue(key, value)}
              </p>
            )}
          </Card>
        );
      })}
    </div>
  );
}
