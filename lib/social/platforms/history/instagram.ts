import type { TokenData } from '../../types';

const GRAPH_API_VERSION = 'v21.0';
const GRAPH_API_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

export interface InstagramPost {
  id: string;
  caption?: string;
  media_type: string;
  media_url?: string;
  permalink?: string;
  timestamp: string;
  like_count?: number;
  comments_count?: number;
  insights?: {
    data: Array<{
      name: string;
      values: Array<{ value: number }>;
    }>;
  };
}

export interface PostAnalytics {
  postId: string;
  createdAt: string;
  message: string;
  permalink: string;
  imageUrl?: string;
  mediaType: string;
  likes: number;
  comments: number;
  shares: number;
  impressions: number;
  reach: number;
  engagement: number;
  engagementRate: number;
}

export async function fetchInstagramPosts(
  tokens: TokenData,
  limit: number = 100
): Promise<PostAnalytics[]> {
  const accountId = tokens.platformPageId;
  if (!accountId) {
    throw new Error('No Instagram Business Account selected. Please go to Settings → Social Media Accounts, click the gear icon on Instagram, and select an account to fetch analytics from.');
  }

  const fields = [
    'id',
    'caption',
    'media_type',
    'media_url',
    'permalink',
    'timestamp',
    'like_count',
    'comments_count',
    'insights.metric(impressions,reach,engagement,saved)',
  ].join(',');

  const url = `${GRAPH_API_BASE}/${accountId}/media?fields=${fields}&limit=${limit}&access_token=${tokens.accessToken}`;

  const response = await fetch(url);
  const data = await response.json();

  if (data.error) {
    throw new Error(data.error.message || 'Failed to fetch Instagram posts');
  }

  const posts: InstagramPost[] = data.data || [];

  return posts.map((post) => {
    const likes = post.like_count || 0;
    const comments = post.comments_count || 0;

    const impressions = getInsightValue(post.insights, 'impressions');
    const reach = getInsightValue(post.insights, 'reach');
    const engagement = getInsightValue(post.insights, 'engagement');
    const saved = getInsightValue(post.insights, 'saved');

    const totalEngagement = likes + comments + saved;
    const engagementRate = impressions > 0 ? (totalEngagement / impressions) * 100 : 0;

    return {
      postId: post.id,
      createdAt: post.timestamp,
      message: post.caption || '',
      permalink: post.permalink || `https://www.instagram.com/p/${post.id}`,
      imageUrl: post.media_url,
      mediaType: post.media_type,
      likes,
      comments,
      shares: 0, // Instagram doesn't provide share count via API
      impressions,
      reach,
      engagement: totalEngagement,
      engagementRate: Math.round(engagementRate * 100) / 100,
    };
  });
}

function getInsightValue(
  insights: { data?: Array<{ name: string; values?: Array<{ value: number }> }> } | undefined,
  metric: string
): number {
  if (!insights?.data) return 0;
  const insight = insights.data.find((d) => d.name === metric);
  return insight?.values?.[0]?.value || 0;
}
