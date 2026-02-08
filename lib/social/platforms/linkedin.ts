import type { PlatformAdapter, TokenData, PostPayload, PublishResult, AnalyticsData } from '../types';

const LINKEDIN_API_BASE = 'https://api.linkedin.com/v2';

export const linkedinAdapter: PlatformAdapter = {
  platform: 'linkedin',

  getAuthUrl(state: string, redirectUri: string): string {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: process.env.LINKEDIN_CLIENT_ID!,
      redirect_uri: redirectUri,
      state,
      scope: 'openid',
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
    const profileRes = await fetch(`${LINKEDIN_API_BASE}/userinfo`, {
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
      const postBody: Record<string, unknown> = {
        author: authorUrn,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: {
              text: buildLinkedInText(post),
            },
            shareMediaCategory: 'NONE',
          },
        },
        visibility: {
          'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
        },
      };

      // If there's a link, add it as article
      if (post.link) {
        const content = postBody.specificContent as Record<string, Record<string, unknown>>;
        content['com.linkedin.ugc.ShareContent'].shareMediaCategory = 'ARTICLE';
        content['com.linkedin.ugc.ShareContent'].media = [
          {
            status: 'READY',
            originalUrl: post.link,
          },
        ];
      }

      // If there are media URLs, add as images
      if (post.mediaUrls && post.mediaUrls.length > 0 && !post.link) {
        const content = postBody.specificContent as Record<string, Record<string, unknown>>;
        content['com.linkedin.ugc.ShareContent'].shareMediaCategory = 'IMAGE';
        content['com.linkedin.ugc.ShareContent'].media = post.mediaUrls.map(url => ({
          status: 'READY',
          originalUrl: url,
        }));
      }

      const res = await fetch(`${LINKEDIN_API_BASE}/ugcPosts`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${tokens.accessToken}`,
          'Content-Type': 'application/json',
          'X-Restli-Protocol-Version': '2.0.0',
        },
        body: JSON.stringify(postBody),
      });

      if (!res.ok) {
        const errorData = await res.json();
        return { success: false, error: errorData.message || `LinkedIn API error: ${res.status}` };
      }

      const postId = res.headers.get('x-restli-id') || '';
      const activityUrn = postId.replace('urn:li:share:', '');

      return {
        success: true,
        platformPostId: postId,
        postUrl: `https://www.linkedin.com/feed/update/${activityUrn}`,
        metadata: { urn: postId },
      };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Publishing failed' };
    }
  },

  async getPostAnalytics(tokens: TokenData, postId: string): Promise<AnalyticsData> {
    try {
      const res = await fetch(
        `${LINKEDIN_API_BASE}/socialActions/${encodeURIComponent(postId)}?fields=likesSummary,commentsSummary,shareStatistics`,
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
    } catch {
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
