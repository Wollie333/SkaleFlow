import type { TokenData } from '../../types';

const LINKEDIN_API_BASE = 'https://api.linkedin.com';
const LINKEDIN_VERSION = '202501';

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
  limit: number = 50
): Promise<PostAnalytics[]> {
  // For page connections, use the org ID; for profile, use person URN
  const authorId = tokens.platformPageId || tokens.platformUserId;
  if (!authorId) {
    throw new Error('No LinkedIn organization or person ID found');
  }

  // Determine the author URN based on connection type
  const isOrg = tokens.accountType === 'page';
  const authorUrn = isOrg
    ? `urn:li:organization:${authorId}`
    : `urn:li:person:${authorId}`;

  console.log(`[linkedin-analytics] Fetching posts for ${authorUrn} (type=${tokens.accountType})`);

  // Use the REST API /rest/posts endpoint
  const postsUrl = `${LINKEDIN_API_BASE}/rest/posts?author=${encodeURIComponent(authorUrn)}&q=author&count=${limit}&sortBy=LAST_MODIFIED`;

  const postsResponse = await fetch(postsUrl, {
    headers: {
      'Authorization': `Bearer ${tokens.accessToken}`,
      'LinkedIn-Version': LINKEDIN_VERSION,
      'X-Restli-Protocol-Version': '2.0.0',
    },
  });

  if (!postsResponse.ok) {
    const errorText = await postsResponse.text();
    console.error(`[linkedin-analytics] Posts API error (${postsResponse.status}):`, errorText);
    throw new Error(`LinkedIn API error: ${postsResponse.status}`);
  }

  const postsData = await postsResponse.json();
  const posts = postsData.elements || [];

  console.log(`[linkedin-analytics] Fetched ${posts.length} posts`);

  const results: PostAnalytics[] = [];

  for (const post of posts) {
    const postUrn = post.id || post.urn;
    const createdAt = post.createdAt
      ? new Date(post.createdAt).toISOString()
      : post.publishedAt
        ? new Date(post.publishedAt).toISOString()
        : new Date().toISOString();

    const commentary = post.commentary || '';
    const imageUrl = post.content?.media?.id
      ? undefined // LinkedIn media IDs aren't direct URLs
      : undefined;

    let likes = 0;
    let comments = 0;
    let shares = 0;
    let impressions = 0;

    // Try to fetch social actions (likes, comments) for this post
    try {
      const likeUrl = `${LINKEDIN_API_BASE}/rest/socialActions/${encodeURIComponent(postUrn)}/likes?count=0`;
      const likeRes = await fetch(likeUrl, {
        headers: {
          'Authorization': `Bearer ${tokens.accessToken}`,
          'LinkedIn-Version': LINKEDIN_VERSION,
          'X-Restli-Protocol-Version': '2.0.0',
        },
      });
      if (likeRes.ok) {
        const likeData = await likeRes.json();
        likes = likeData.paging?.total || 0;
      }
    } catch {
      // Social actions not available
    }

    try {
      const commentUrl = `${LINKEDIN_API_BASE}/rest/socialActions/${encodeURIComponent(postUrn)}/comments?count=0`;
      const commentRes = await fetch(commentUrl, {
        headers: {
          'Authorization': `Bearer ${tokens.accessToken}`,
          'LinkedIn-Version': LINKEDIN_VERSION,
          'X-Restli-Protocol-Version': '2.0.0',
        },
      });
      if (commentRes.ok) {
        const commentData = await commentRes.json();
        comments = commentData.paging?.total || 0;
      }
    } catch {
      // Comments not available
    }

    // For organization posts, try to get share statistics
    if (isOrg) {
      try {
        const statsUrl = `${LINKEDIN_API_BASE}/rest/organizationalEntityShareStatistics?q=organizationalEntity&organizationalEntity=${encodeURIComponent(authorUrn)}&shares[0]=${encodeURIComponent(postUrn)}`;
        const statsRes = await fetch(statsUrl, {
          headers: {
            'Authorization': `Bearer ${tokens.accessToken}`,
            'LinkedIn-Version': LINKEDIN_VERSION,
            'X-Restli-Protocol-Version': '2.0.0',
          },
        });
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          const element = statsData.elements?.[0];
          if (element?.totalShareStatistics) {
            const stats = element.totalShareStatistics;
            impressions = stats.impressionCount || 0;
            shares = stats.shareCount || 0;
            // Override with more accurate data if available
            if (stats.likeCount) likes = stats.likeCount;
            if (stats.commentCount) comments = stats.commentCount;
          }
        }
      } catch {
        // Stats not available for this post
      }
    }

    const totalEngagement = likes + comments + shares;
    const engagementRate = impressions > 0 ? (totalEngagement / impressions) * 100 : 0;

    results.push({
      postId: postUrn,
      createdAt,
      message: commentary,
      permalink: `https://www.linkedin.com/feed/update/${postUrn}`,
      imageUrl,
      likes,
      comments,
      shares,
      impressions,
      reach: impressions, // LinkedIn doesn't separate reach from impressions
      engagement: totalEngagement,
      engagementRate: Math.round(engagementRate * 100) / 100,
    });
  }

  return results;
}
