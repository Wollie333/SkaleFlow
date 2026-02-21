import type { SocialPlatform } from '@/types/database';

export interface AnalyticsOverview {
  totalPosts: number;
  totalEngagement: number;
  totalImpressions: number;
  avgEngagementRate: number;
  engagementRate?: number;
  totalReach: number;
  totalClicks: number;
  totalSaves: number;
  totalVideoViews: number;
  totalLikes: number;
  totalComments: number;
  totalShares: number;
}

export interface AnalyticsChanges {
  totalPosts: number | null;
  totalEngagement: number | null;
  totalImpressions: number | null;
  avgEngagementRate: number | null;
  totalReach: number | null;
  totalClicks: number | null;
  totalSaves: number | null;
  totalVideoViews: number | null;
}

export interface FollowerGrowthPoint {
  connection_id: string;
  metric_date: string;
  followers_count: number;
  following_count: number;
  posts_count: number;
  social_media_connections: {
    platform: SocialPlatform;
    platform_page_name: string | null;
    platform_username: string | null;
  };
}

export interface HeatmapPoint {
  day: number;
  hour: number;
  avgEngagement: number;
}

export interface AnalyticsResponse {
  overview: AnalyticsOverview;
  previousPeriod?: AnalyticsOverview;
  changes?: AnalyticsChanges;
  timeSeries: Array<{
    date: string;
    engagement: number;
    impressions: number;
    reach: number;
    clicks: number;
    saves: number;
    videoViews: number;
    likes: number;
    comments: number;
    shares: number;
    byPlatform: Record<string, {
      engagement: number;
      impressions: number;
      reach: number;
      clicks: number;
      saves: number;
      videoViews: number;
      likes: number;
      comments: number;
      shares: number;
    }>;
  }>;
  topPosts: Array<{
    id: string;
    contentItemId: string;
    platform: SocialPlatform;
    topic: string | null;
    hook: string | null;
    publishedAt: string;
    postUrl: string | null;
    likes: number;
    comments: number;
    shares: number;
    saves: number;
    impressions: number;
    reach: number;
    clicks: number;
    videoViews: number;
    engagementRate: number;
  }>;
  platformSummary: Array<{
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
  }>;
  connectedPlatforms: SocialPlatform[];
  followerGrowth?: FollowerGrowthPoint[];
  engagementHeatmap?: HeatmapPoint[];
}
