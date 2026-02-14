import type { TokenData } from '../../types';

const GRAPH_API_VERSION = 'v22.0';
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
  // Use platformUserId (the IG Business Account ID), NOT platformPageId (the FB Page ID).
  // The /media edge only exists on Instagram User nodes, not Facebook Page nodes.
  const accountId = tokens.platformUserId;
  if (!accountId) {
    throw new Error('No Instagram Business Account found. Please go to Settings → Social Media Accounts, click the gear icon on Instagram, and select an account to fetch analytics from.');
  }

  // Fetch posts first WITHOUT inline insights (insights can fail on Story/Reel types).
  // We'll fetch insights individually per post with fallback.
  const fields = [
    'id',
    'caption',
    'media_type',
    'media_url',
    'permalink',
    'timestamp',
    'like_count',
    'comments_count',
  ].join(',');

  const url = `${GRAPH_API_BASE}/${accountId}/media?fields=${fields}&limit=${limit}&access_token=${tokens.accessToken}`;

  const response = await fetch(url);
  const data = await response.json();

  if (data.error) {
    throw new Error(data.error.message || 'Failed to fetch Instagram posts');
  }

  const posts: InstagramPost[] = data.data || [];
  const results: PostAnalytics[] = [];

  for (const post of posts) {
    const likes = post.like_count || 0;
    const comments = post.comments_count || 0;

    let impressions = 0;
    let reach = 0;
    let saved = 0;

    // Fetch insights individually — different media types support different metrics
    try {
      // IMAGE/CAROUSEL: impressions, reach, saved, total_interactions
      // VIDEO/REEL: impressions, reach, saved, plays, total_interactions, ig_reels_aggregated_all_plays_count
      const metricsToTry = post.media_type === 'VIDEO'
        ? 'impressions,reach,saved'
        : 'impressions,reach,saved';

      const insightsUrl = `${GRAPH_API_BASE}/${post.id}/insights?metric=${metricsToTry}&access_token=${tokens.accessToken}`;
      const insightsRes = await fetch(insightsUrl);
      const insightsData = await insightsRes.json();

      if (insightsData.data && !insightsData.error) {
        impressions = getInsightValue(insightsData, 'impressions');
        reach = getInsightValue(insightsData, 'reach');
        saved = getInsightValue(insightsData, 'saved');
      }
    } catch {
      // Insights not available for this post — that's fine (e.g., Stories)
    }

    const totalEngagement = likes + comments + saved;
    const engagementRate = impressions > 0 ? (totalEngagement / impressions) * 100 : 0;

    results.push({
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
    });
  }

  return results;
}

function getInsightValue(
  insightsData: { data?: Array<{ name: string; values?: Array<{ value: number }> }> },
  metric: string
): number {
  if (!insightsData?.data) return 0;
  const insight = insightsData.data.find((d) => d.name === metric);
  return insight?.values?.[0]?.value || 0;
}
