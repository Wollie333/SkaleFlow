import type { TokenData } from '../../types';

const LINKEDIN_API_BASE = 'https://api.linkedin.com/v2';

export interface LinkedInPost {
  id: string;
  created: {
    time: number;
  };
  text?: {
    text: string;
  };
  content?: {
    media?: Array<{
      url: string;
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

export async function fetchLinkedInPosts(
  tokens: TokenData,
  limit: number = 100
): Promise<PostAnalytics[]> {
  const personUrn = tokens.platformUserId;
  if (!personUrn) {
    throw new Error('No LinkedIn person URN found');
  }

  // Fetch posts
  const postsUrl = `${LINKEDIN_API_BASE}/ugcPosts?q=authors&authors=List(urn:li:person:${personUrn})&count=${limit}`;

  const postsResponse = await fetch(postsUrl, {
    headers: {
      'Authorization': `Bearer ${tokens.accessToken}`,
      'X-Restli-Protocol-Version': '2.0.0',
    },
  });

  const postsData = await postsResponse.json();

  if (postsData.status && postsData.status >= 400) {
    throw new Error(postsData.message || 'Failed to fetch LinkedIn posts');
  }

  const posts: LinkedInPost[] = postsData.elements || [];

  // For each post, fetch analytics
  const postsWithAnalytics = await Promise.all(
    posts.map(async (post) => {
      const postId = post.id.replace('urn:li:ugcPost:', '');

      // Fetch post analytics
      const analyticsUrl = `${LINKEDIN_API_BASE}/socialActions/${post.id}/statistics`;

      try {
        const analyticsResponse = await fetch(analyticsUrl, {
          headers: {
            'Authorization': `Bearer ${tokens.accessToken}`,
            'X-Restli-Protocol-Version': '2.0.0',
          },
        });

        const analytics = await analyticsResponse.json();

        const likes = analytics.likeCount || 0;
        const comments = analytics.commentCount || 0;
        const shares = analytics.shareCount || 0;
        const impressions = analytics.impressionCount || 0;
        const engagement = analytics.engagementCount || 0;

        const totalEngagement = likes + comments + shares;
        const engagementRate = impressions > 0 ? (totalEngagement / impressions) * 100 : 0;

        return {
          postId: post.id,
          createdAt: new Date(post.created.time).toISOString(),
          message: post.text?.text || '',
          permalink: `https://www.linkedin.com/feed/update/${post.id}`,
          imageUrl: post.content?.media?.[0]?.url,
          likes,
          comments,
          shares,
          impressions,
          reach: impressions, // LinkedIn doesn't separate reach from impressions
          engagement: totalEngagement,
          engagementRate: Math.round(engagementRate * 100) / 100,
        };
      } catch (error) {
        // If analytics fetch fails, return post with zero analytics
        return {
          postId: post.id,
          createdAt: new Date(post.created.time).toISOString(),
          message: post.text?.text || '',
          permalink: `https://www.linkedin.com/feed/update/${post.id}`,
          imageUrl: post.content?.media?.[0]?.url,
          likes: 0,
          comments: 0,
          shares: 0,
          impressions: 0,
          reach: 0,
          engagement: 0,
          engagementRate: 0,
        };
      }
    })
  );

  return postsWithAnalytics;
}
