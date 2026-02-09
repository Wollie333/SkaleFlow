import type { PlatformAdapter, TokenData, PostPayload, PublishResult, AnalyticsData } from '../types';

const LINKEDIN_API_BASE = 'https://api.linkedin.com';

export const linkedinAdapter: PlatformAdapter = {
  platform: 'linkedin',

  getAuthUrl(state: string, redirectUri: string): string {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: process.env.LINKEDIN_CLIENT_ID!,
      redirect_uri: redirectUri,
      state,
      scope: 'openid profile w_member_social',
    });
    return `https://www.linkedin.com/oauth/v2/authorization?${params}`;
  },

  async exchangeCode(code: string, redirectUri: string): Promise<TokenData> {
    const tokenRes = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        client_id: process.env.LINKEDIN_CLIENT_ID!,
        client_secret: process.env.LINKEDIN_CLIENT_SECRET!,
      }),
    });

    const tokenData = await tokenRes.json();

    if (tokenData.error) {
      throw new Error(tokenData.error_description || 'Failed to exchange code');
    }

    // Get user profile
    const profileRes = await fetch(`${LINKEDIN_API_BASE}/v2/userinfo`, {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const profileData = await profileRes.json();

    return {
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token || null,
      expiresAt: tokenData.expires_in
        ? new Date(Date.now() + tokenData.expires_in * 1000)
        : null,
      scopes: tokenData.scope?.split(' ') || [],
      platformUserId: profileData.sub,
      platformUsername: profileData.name || `${profileData.given_name} ${profileData.family_name}`,
    };
  },

  async refreshToken(refreshToken: string): Promise<TokenData> {
    const tokenRes = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: process.env.LINKEDIN_CLIENT_ID!,
        client_secret: process.env.LINKEDIN_CLIENT_SECRET!,
      }),
    });

    const tokenData = await tokenRes.json();

    if (tokenData.error) {
      throw new Error(tokenData.error_description || 'Failed to refresh token');
    }

    return {
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token || refreshToken,
      expiresAt: tokenData.expires_in
        ? new Date(Date.now() + tokenData.expires_in * 1000)
        : null,
    };
  },

  async publishPost(tokens: TokenData, post: PostPayload): Promise<PublishResult> {
    const authorUrn = `urn:li:person:${tokens.platformUserId}`;

    try {
      // Build post body using LinkedIn's new Posts API (replaces deprecated ugcPosts)
      const postBody: Record<string, unknown> = {
        author: authorUrn,
        commentary: buildLinkedInText(post),
        visibility: 'PUBLIC',
        distribution: {
          feedDistribution: 'MAIN_FEED',
          targetEntities: [],
          thirdPartyDistributionChannels: [],
        },
        lifecycleState: 'PUBLISHED',
      };

      // If there's a link, add as article content
      if (post.link) {
        postBody.content = {
          article: {
            source: post.link,
            title: post.text?.slice(0, 200) || 'Shared link',
          },
        };
      }

      // If there are media URLs (images), add as multi-image content
      // Note: For direct image uploads, a 2-step register+upload flow is needed.
      // External image URLs are added as article links as a fallback.
      if (post.mediaUrls && post.mediaUrls.length > 0 && !post.link) {
        // LinkedIn Posts API supports external media via article source
        postBody.content = {
          article: {
            source: post.mediaUrls[0],
            title: post.text?.slice(0, 200) || 'Shared media',
          },
        };
      }

      const res = await fetch(`${LINKEDIN_API_BASE}/rest/posts`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${tokens.accessToken}`,
          'Content-Type': 'application/json',
          'LinkedIn-Version': '202601',
          'X-Restli-Protocol-Version': '2.0.0',
        },
        body: JSON.stringify(postBody),
      });

      if (!res.ok) {
        const errorText = await res.text();
        let errorMessage = `LinkedIn API error: ${res.status}`;
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }
        console.error('[LinkedIn Publish] Failed:', { status: res.status, error: errorMessage, authorUrn });
        return { success: false, error: errorMessage };
      }

      // The new Posts API returns the post URN in the x-restli-id header
      const postUrn = res.headers.get('x-restli-id') || '';
      // Extract activity ID for the post URL
      const activityMatch = postUrn.match(/urn:li:share:(\d+)/);
      const activityId = activityMatch ? activityMatch[1] : postUrn;

      return {
        success: true,
        platformPostId: postUrn,
        postUrl: activityId ? `https://www.linkedin.com/feed/update/urn:li:activity:${activityId}` : undefined,
        metadata: { urn: postUrn },
      };
    } catch (error) {
      console.error('[LinkedIn Publish] Exception:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Publishing failed' };
    }
  },

  async getPostAnalytics(tokens: TokenData, postId: string): Promise<AnalyticsData> {
    try {
      const res = await fetch(
        `${LINKEDIN_API_BASE}/v2/socialActions/${encodeURIComponent(postId)}?fields=likesSummary,commentsSummary,shareStatistics`,
        {
          headers: {
            Authorization: `Bearer ${tokens.accessToken}`,
            'X-Restli-Protocol-Version': '2.0.0',
          },
        }
      );

      const data = await res.json();

      const likes = data.likesSummary?.totalLikes || 0;
      const comments = data.commentsSummary?.totalFirstLevelComments || 0;
      const shares = data.shareStatistics?.shareCount || 0;
      const impressions = data.shareStatistics?.impressionCount || 0;
      const clicks = data.shareStatistics?.clickCount || 0;

      const totalEngagement = likes + comments + shares + clicks;
      const engagementRate = impressions > 0 ? (totalEngagement / impressions) * 100 : 0;

      return {
        likes,
        comments,
        shares,
        saves: 0,
        impressions,
        reach: data.shareStatistics?.uniqueImpressionsCount || 0,
        clicks,
        videoViews: 0,
        engagementRate: Math.round(engagementRate * 100) / 100,
        metadata: data,
      };
    } catch (error) {
      console.error('[LinkedIn Analytics] Failed to fetch:', error);
      return { likes: 0, comments: 0, shares: 0, saves: 0, impressions: 0, reach: 0, clicks: 0, videoViews: 0, engagementRate: 0 };
    }
  },

  async revokeAccess(_tokens: TokenData): Promise<void> {
    // LinkedIn doesn't support programmatic token revocation
    // Token will expire naturally
  },
};

function buildLinkedInText(post: PostPayload): string {
  let text = post.text || post.caption || '';
  if (post.hashtags && post.hashtags.length > 0) {
    text += '\n\n' + post.hashtags.join(' ');
  }
  // LinkedIn limit: 3000 chars
  return text.slice(0, 3000);
}
