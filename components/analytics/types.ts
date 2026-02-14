import type { SocialPlatform } from '@/types/database';

export interface AnalyticsResponse {
  overview: {
    totalPosts: number;
    totalEngagement: number;
    totalImpressions: number;
    avgEngagementRate: number;
    totalReach: number;
    totalClicks: number;
    totalSaves: number;
    totalVideoViews: number;
    totalLikes: number;
    totalComments: number;
    totalShares: number;
  };
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
}
