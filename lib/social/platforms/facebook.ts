import type { PlatformAdapter, TokenData, PostPayload, PublishResult, AnalyticsData } from '../types';

const GRAPH_API_VERSION = 'v21.0';
const GRAPH_API_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

export const facebookAdapter: PlatformAdapter = {
  platform: 'facebook',

  getAuthUrl(state: string, redirectUri: string): string {
    const params = new URLSearchParams({
      client_id: process.env.META_APP_ID!,
      redirect_uri: redirectUri,
      state,
      scope: 'pages_manage_posts,pages_read_engagement,pages_show_list,pages_read_user_content',
      response_type: 'code',
    });
    return `https://www.facebook.com/${GRAPH_API_VERSION}/dialog/oauth?${params}`;
  },

  async exchangeCode(code: string, redirectUri: string): Promise<TokenData> {
    // Exchange code for short-lived token
    const tokenParams = new URLSearchParams({
      client_id: process.env.META_APP_ID!,
      client_secret: process.env.META_APP_SECRET!,
      redirect_uri: redirectUri,
      code,
    });

    const tokenRes = await fetch(`${GRAPH_API_BASE}/oauth/access_token?${tokenParams}`);
    const tokenData = await tokenRes.json();

    if (tokenData.error) {
      throw new Error(tokenData.error.message || 'Failed to exchange code');
    }

    // Exchange for long-lived token
    const longLivedParams = new URLSearchParams({
      grant_type: 'fb_exchange_token',
      client_id: process.env.META_APP_ID!,
      client_secret: process.env.META_APP_SECRET!,
      fb_exchange_token: tokenData.access_token,
    });

    const longLivedRes = await fetch(`${GRAPH_API_BASE}/oauth/access_token?${longLivedParams}`);
    const longLivedData = await longLivedRes.json();

    // Get user info
    const userRes = await fetch(`${GRAPH_API_BASE}/me?fields=id,name&access_token=${longLivedData.access_token}`);
    const userData = await userRes.json();

    // Check what scopes were granted
    console.log('Facebook OAuth scopes granted:', tokenData.scope);

    // Get pages the user manages
    console.log('Fetching Facebook pages from /me/accounts...');

    // First check /me to see user info
    const meRes = await fetch(`${GRAPH_API_BASE}/me?fields=id,name&access_token=${longLivedData.access_token}`);
    const meData = await meRes.json();
    console.log('Facebook /me response:', meData);

    // Check permissions
    const permissionsRes = await fetch(`${GRAPH_API_BASE}/me/permissions?access_token=${longLivedData.access_token}`);
    const permissionsData = await permissionsRes.json();
    const grantedPermissions = permissionsData.data?.filter((p: { status: string }) => p.status === 'granted').map((p: { permission: string }) => p.permission) || [];
    console.log('Facebook permissions granted to token:', grantedPermissions);

    // Fetch ALL pages (handle pagination)
    let allPages: { id: string; name: string; access_token: string; category?: string }[] = [];
    let nextUrl = `${GRAPH_API_BASE}/me/accounts?access_token=${longLivedData.access_token}`;
    let pageCount = 0;

    while (nextUrl && pageCount < 10) { // Safety limit of 10 pages
      pageCount++;
      const pagesRes = await fetch(nextUrl);
      const pagesData = await pagesRes.json();

      console.log(`Facebook /me/accounts response (page ${pageCount}):`, {
        status: pagesRes.status,
        hasError: !!pagesData.error,
        error: pagesData.error,
        dataCount: pagesData.data?.length || 0,
        hasNext: !!pagesData.paging?.next,
      });

      if (pagesData.error) {
        console.error('Facebook API error when fetching pages:', pagesData.error);
        break;
      }

      const pagesBatch = (pagesData.data || []).map((p: { id: string; name: string; access_token: string; category?: string }) => ({
        id: p.id,
        name: p.name,
        access_token: p.access_token,
        category: p.category || null,
      }));

      console.log(`Page batch ${pageCount} details:`, pagesBatch.map(p => ({ id: p.id, name: p.name })));

      allPages = [...allPages, ...pagesBatch];

      // Check if there's a next page
      nextUrl = pagesData.paging?.next || null;
    }

    console.log(`Found ${allPages.length} total Facebook pages across ${pageCount} API call(s):`, allPages.map(p => ({ id: p.id, name: p.name, category: p.category })));

    const pages = allPages;

    // Return user's long-lived token as the profile connection.
    // Don't auto-select a page — user picks pages via the page selector.
    return {
      accessToken: longLivedData.access_token,
      refreshToken: null, // Facebook long-lived tokens don't have refresh tokens
      expiresAt: longLivedData.expires_in
        ? new Date(Date.now() + longLivedData.expires_in * 1000)
        : null,
      scopes: tokenData.scope?.split(',') || [],
      platformUserId: userData.id,
      platformUsername: userData.name,
      platformPageId: undefined,
      platformPageName: undefined,
      accountType: 'profile',
      metadata: { pages },
    };
  },

  async refreshToken(_refreshToken: string): Promise<TokenData> {
    // Facebook long-lived tokens can't be refreshed with a refresh token
    // They need to be re-exchanged via a new short-lived token
    throw new Error('Facebook tokens must be reconnected via OAuth. Please reconnect your Facebook account.');
  },

  async publishPost(tokens: TokenData, post: PostPayload): Promise<PublishResult> {
    // Facebook only allows posting to Pages via API, not personal profiles
    const pageId = tokens.platformPageId;
    if (!pageId) {
      return {
        success: false,
        error: 'Facebook posting is only available for Pages. Please select a Facebook Page in your connection settings.'
      };
    }

    try {
      const message = buildFacebookMessage(post);

      // If media URLs exist, post as photo using Page Photo API
      if (post.mediaUrls && post.mediaUrls.length > 0) {
        const photoBody = new URLSearchParams({
          url: post.mediaUrls[0],
          caption: message,
          access_token: tokens.accessToken,
        });

        const res = await fetch(`${GRAPH_API_BASE}/${pageId}/photos`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: photoBody.toString(),
        });

        const data = await res.json();

        if (data.error) {
          return { success: false, error: `Facebook API Error: ${data.error.message}` };
        }

        return {
          success: true,
          platformPostId: data.id || data.post_id,
          postUrl: `https://www.facebook.com/${pageId}/posts/${data.post_id || data.id}`,
          metadata: data,
        };
      }

      // For text posts with optional link, use Page Feed API
      const feedBody = new URLSearchParams({
        message: message,
        access_token: tokens.accessToken,
      });

      if (post.link) {
        feedBody.append('link', post.link);
      }

      const res = await fetch(`${GRAPH_API_BASE}/${pageId}/feed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: feedBody.toString(),
      });

      const data = await res.json();

      if (data.error) {
        return { success: false, error: `Facebook API Error: ${data.error.message}` };
      }

      return {
        success: true,
        platformPostId: data.id,
        postUrl: `https://www.facebook.com/${pageId}/posts/${data.id?.split('_')[1] || data.id}`,
        metadata: data,
      };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Publishing failed' };
    }
  },

  async getPostAnalytics(tokens: TokenData, postId: string): Promise<AnalyticsData> {
    try {
      const fields = 'likes.summary(true),comments.summary(true),shares,insights.metric(post_impressions,post_impressions_unique,post_clicks,post_engaged_users)';
      const res = await fetch(
        `${GRAPH_API_BASE}/${postId}?fields=${fields}&access_token=${tokens.accessToken}`
      );
      const data = await res.json();

      const likes = data.likes?.summary?.total_count || 0;
      const comments = data.comments?.summary?.total_count || 0;
      const shares = data.shares?.count || 0;
      const impressions = getInsightValue(data.insights, 'post_impressions') || 0;
      const reach = getInsightValue(data.insights, 'post_impressions_unique') || 0;
      const clicks = getInsightValue(data.insights, 'post_clicks') || 0;

      const totalEngagement = likes + comments + shares;
      const engagementRate = impressions > 0 ? (totalEngagement / impressions) * 100 : 0;

      return {
        likes,
        comments,
        shares,
        saves: 0,
        impressions,
        reach,
        clicks,
        videoViews: 0,
        engagementRate: Math.round(engagementRate * 100) / 100,
        metadata: data,
      };
    } catch {
      return { likes: 0, comments: 0, shares: 0, saves: 0, impressions: 0, reach: 0, clicks: 0, videoViews: 0, engagementRate: 0 };
    }
  },

  async revokeAccess(tokens: TokenData): Promise<void> {
    await fetch(`${GRAPH_API_BASE}/me/permissions?access_token=${tokens.accessToken}`, {
      method: 'DELETE',
    });
  },
};

function buildFacebookMessage(post: PostPayload): string {
  let message = post.text || post.caption || '';
  if (post.hashtags && post.hashtags.length > 0) {
    message += '\n\n' + post.hashtags.map(h => h.startsWith('#') ? h : `#${h}`).join(' ');
  }
  return message;
}

function getInsightValue(insights: { data?: Array<{ name: string; values?: Array<{ value: number }> }> }, metric: string): number {
  if (!insights?.data) return 0;
  const insight = insights.data.find((d) => d.name === metric);
  return insight?.values?.[0]?.value || 0;
}
