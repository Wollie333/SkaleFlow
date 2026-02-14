import type { SocialPlatform } from '@/types/database';

export type MetricKey =
  | 'posts'
  | 'engagement'
  | 'impressions'
  | 'engagementRate'
  | 'reach'
  | 'clicks'
  | 'saves'
  | 'videoViews'
  | 'likes'
  | 'comments'
  | 'shares';

/** Which metrics each platform's API actually returns */
export const PLATFORM_SUPPORTED_METRICS: Record<SocialPlatform, MetricKey[]> = {
  linkedin: ['posts', 'engagement', 'impressions', 'engagementRate', 'reach', 'clicks', 'likes', 'comments', 'shares'],
  facebook: ['posts', 'engagement', 'impressions', 'engagementRate', 'reach', 'clicks', 'videoViews', 'likes', 'comments', 'shares'],
  instagram: ['posts', 'engagement', 'impressions', 'engagementRate', 'reach', 'saves', 'videoViews', 'likes', 'comments', 'shares'],
  twitter: ['posts', 'engagement', 'impressions', 'engagementRate', 'reach', 'clicks', 'likes', 'comments', 'shares'],
  tiktok: ['posts', 'engagement', 'impressions', 'engagementRate', 'reach', 'saves', 'videoViews', 'likes', 'comments', 'shares'],
  youtube: ['posts', 'engagement', 'impressions', 'engagementRate', 'reach', 'clicks', 'videoViews', 'likes', 'comments', 'shares'],
};

export interface MetricConfig {
  label: string;
  color: string;
  /** Hero icon name hint — actual icon imported in component */
  iconHint: string;
  format: (v: number) => string;
}

function formatCompact(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}k`;
  return v.toLocaleString();
}

export const METRIC_CONFIG: Record<MetricKey, MetricConfig> = {
  posts: {
    label: 'Posts Published',
    color: '#4B5563',
    iconHint: 'DocumentTextIcon',
    format: (v) => v.toLocaleString(),
  },
  engagement: {
    label: 'Total Engagement',
    color: '#0d9488',
    iconHint: 'HeartIcon',
    format: formatCompact,
  },
  impressions: {
    label: 'Total Impressions',
    color: '#6366f1',
    iconHint: 'EyeIcon',
    format: formatCompact,
  },
  engagementRate: {
    label: 'Avg Engagement Rate',
    color: '#8b5cf6',
    iconHint: 'ChartBarIcon',
    format: (v) => `${v.toFixed(2)}%`,
  },
  reach: {
    label: 'Total Reach',
    color: '#7c3aed',
    iconHint: 'UsersIcon',
    format: formatCompact,
  },
  clicks: {
    label: 'Total Clicks',
    color: '#D4A84B',
    iconHint: 'CursorArrowRaysIcon',
    format: formatCompact,
  },
  saves: {
    label: 'Total Saves',
    color: '#ec4899',
    iconHint: 'BookmarkIcon',
    format: formatCompact,
  },
  videoViews: {
    label: 'Video Views',
    color: '#f97316',
    iconHint: 'PlayCircleIcon',
    format: formatCompact,
  },
  likes: {
    label: 'Likes',
    color: '#0d9488',
    iconHint: 'HandThumbUpIcon',
    format: formatCompact,
  },
  comments: {
    label: 'Comments',
    color: '#D4A84B',
    iconHint: 'ChatBubbleLeftIcon',
    format: formatCompact,
  },
  shares: {
    label: 'Shares',
    color: '#6366f1',
    iconHint: 'ShareIcon',
    format: formatCompact,
  },
};

/** Chart-line metrics (togglable in performance chart) */
export const CHART_METRICS: { key: MetricKey; label: string; color: string }[] = [
  { key: 'engagement', label: 'Engagement', color: '#0d9488' },
  { key: 'impressions', label: 'Impressions', color: '#6366f1' },
  { key: 'reach', label: 'Reach', color: '#7c3aed' },
  { key: 'clicks', label: 'Clicks', color: '#D4A84B' },
  { key: 'saves', label: 'Saves', color: '#ec4899' },
  { key: 'videoViews', label: 'Video Views', color: '#f97316' },
];
