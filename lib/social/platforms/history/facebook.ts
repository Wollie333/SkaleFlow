import type { TokenData } from '../../types';

const GRAPH_API_VERSION = 'v21.0';
const GRAPH_API_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

export interface FacebookPost {
  id: string;
  message?: string;
  story?: string;
  created_time: string;
  permalink_url?: string;
  full_picture?: string;
  likes?: { summary: { total_count: number } };
  comments?: { summary: { total_count: number } };
  shares?: { count: number };
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
  likes: number;
  comments: number;
  shares: number;
  impressions: number;
  reach: number;
  engagement: number;
  engagementRate: number;
}

export async function fetchPagePosts(
  tokens: TokenData,
  limit: number = 100
): Promise<PostAnalytics[]> {
  const pageId = tokens.platformPageId;
  if (!pageId) {
    throw new Error('No Facebook Page ID found');
  }

  const fields = [
    'id',
    'message',
    'story',
    'created_time',
    'permalink_url',
    'full_picture',
    'likes.summary(true)',
    'comments.summary(true)',
    'shares',
    'insights.metric(post_impressions,post_impressions_unique,post_engaged_users)',
  ].join(',');

  const url = `${GRAPH_API_BASE}/${pageId}/posts?fields=${fields}&limit=${limit}&access_token=${tokens.accessToken}`;

  const response = await fetch(url);
  const data = await response.json();

  if (data.error) {
    throw new Error(data.error.message || 'Failed to fetch Facebook posts');
  }

  const posts: FacebookPost[] = data.data || [];

  return posts.map((post) => {
    const likes = post.likes?.summary?.total_count || 0;
    const comments = post.comments?.summary?.total_count || 0;
    const shares = post.shares?.count || 0;

    const impressions = getInsightValue(post.insights, 'post_impressions');
    const reach = getInsightValue(post.insights, 'post_impressions_unique');
    const engagedUsers = getInsightValue(post.insights, 'post_engaged_users');

    const totalEngagement = likes + comments + shares;
    const engagementRate = impressions > 0 ? (totalEngagement / impressions) * 100 : 0;

    return {
      postId: post.id,
      createdAt: post.created_time,
      message: post.message || post.story || '',
      permalink: post.permalink_url || `https://www.facebook.com/${post.id}`,
      imageUrl: post.full_picture,
      likes,
      comments,
      shares,
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
