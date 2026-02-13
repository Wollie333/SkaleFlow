import type { TokenData } from '../../types';

const GRAPH_API_VERSION = 'v22.0';
const GRAPH_API_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

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
    throw new Error('No Facebook Page selected. Please go to Settings → Social Media Accounts, click the gear icon on Facebook, and select a Page to fetch analytics from.');
  }

  // Fetch posts first WITHOUT insights (insights can fail on certain post types)
  const postFields = [
    'id',
    'message',
    'story',
    'created_time',
    'permalink_url',
    'full_picture',
    'likes.summary(true)',
    'comments.summary(true)',
    'shares',
  ].join(',');

  const url = `${GRAPH_API_BASE}/${pageId}/posts?fields=${postFields}&limit=${limit}&access_token=${tokens.accessToken}`;

  const response = await fetch(url);
  const data = await response.json();

  if (data.error) {
    throw new Error(data.error.message || 'Failed to fetch Facebook posts');
  }

  const posts: Array<{
    id: string;
    message?: string;
    story?: string;
    created_time: string;
    permalink_url?: string;
    full_picture?: string;
    likes?: { summary: { total_count: number } };
    comments?: { summary: { total_count: number } };
    shares?: { count: number };
  }> = data.data || [];

  // Fetch insights for each post individually (gracefully handle failures)
  const results: PostAnalytics[] = [];

  for (const post of posts) {
    const likes = post.likes?.summary?.total_count || 0;
    const comments = post.comments?.summary?.total_count || 0;
    const shares = post.shares?.count || 0;

    let impressions = 0;
    let reach = 0;

    // Try to get post insights (may fail for shared/boosted posts)
    try {
      const insightsUrl = `${GRAPH_API_BASE}/${post.id}/insights?metric=post_impressions,post_impressions_unique&access_token=${tokens.accessToken}`;
      const insightsRes: Response = await fetch(insightsUrl);
      const insightsData = await insightsRes.json();

      if (insightsData.data && !insightsData.error) {
        for (const metric of insightsData.data) {
          if (metric.name === 'post_impressions') {
            impressions = metric.values?.[0]?.value || 0;
          } else if (metric.name === 'post_impressions_unique') {
            reach = metric.values?.[0]?.value || 0;
          }
        }
      }
    } catch {
      // Insights not available for this post — that's fine
    }

    const totalEngagement = likes + comments + shares;
    const engagementRate = impressions > 0 ? (totalEngagement / impressions) * 100 : 0;

    results.push({
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
    });
  }

  return results;
}
