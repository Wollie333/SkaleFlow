import type { PlatformAdapter, TokenData, PostPayload, PublishResult, AnalyticsData, InboxItem, ReplyResult, AccountMetrics } from '../types';

const GRAPH_API_VERSION = 'v22.0';
const GRAPH_API_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

export const facebookAdapter: PlatformAdapter = {
  platform: 'facebook',

  getAuthUrl(state: string, redirectUri: string): string {
    const params = new URLSearchParams({
      client_id: process.env.META_APP_ID!,
      redirect_uri: redirectUri,
      state,
      scope: 'pages_manage_posts,pages_read_engagement,pages_show_list,pages_read_user_content,pages_manage_metadata,business_management',
      response_type: 'code',
      auth_type: 'rerequest',
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

    // Fetch ALL pages (handle pagination, request 100 per batch)
    let allPages: { id: string; name: string; access_token: string; category?: string | null }[] = [];
    let nextUrl: string | null = `${GRAPH_API_BASE}/me/accounts?fields=id,name,access_token,category&limit=100&access_token=${longLivedData.access_token}`;
    let pageCount = 0;

    console.log(`[facebook] Fetching pages for user ${userData.name} (${userData.id})...`);

    while (nextUrl && pageCount < 10) {
      pageCount++;
      const pagesRes: Response = await fetch(nextUrl);
      const pagesData: Record<string, unknown> = await pagesRes.json();

      if (pagesData.error) {
        console.error('[facebook] API error fetching pages:', pagesData.error);
        break;
      }

      const pagesBatch = ((pagesData.data || []) as Array<{ id: string; name: string; access_token: string; category?: string }>).map(p => ({
        id: p.id,
        name: p.name,
        access_token: p.access_token,
        category: p.category || null,
      }));

      console.log(`[facebook] Batch ${pageCount}: got ${pagesBatch.length} pages — ${pagesBatch.map(p => p.name).join(', ')}`);

      allPages = [...allPages, ...pagesBatch];

      nextUrl = (pagesData.paging as Record<string, string> | undefined)?.next || null;
      if (nextUrl) {
        console.log(`[facebook] Has next page cursor, fetching more...`);
      }
    }

    console.log(`[facebook] Pages from /me/accounts: ${allPages.length}`);

    // Also fetch pages via Business Manager (gets pages not selected in granular OAuth)
    const knownPageIds = new Set(allPages.map(p => p.id));
    try {
      const bizRes = await fetch(`${GRAPH_API_BASE}/me/businesses?access_token=${longLivedData.access_token}`);
      const bizData = await bizRes.json();
      const businesses = bizData.data || [];
      console.log(`[facebook] Found ${businesses.length} businesses`);

      for (const biz of businesses) {
        try {
          // Fetch pages owned by this business
          let bizPagesUrl: string | null = `${GRAPH_API_BASE}/${biz.id}/owned_pages?fields=id,name,access_token,category&limit=100&access_token=${longLivedData.access_token}`;
          while (bizPagesUrl) {
            const bpRes: Response = await fetch(bizPagesUrl);
            const bpData: Record<string, unknown> = await bpRes.json();
            if (bpData.error) {
              console.error(`[facebook] Error fetching pages for business ${biz.id}:`, (bpData.error as Record<string, string>).message);
              break;
            }
            for (const p of (bpData.data || []) as Array<{ id: string; name: string; access_token: string; category?: string }>) {
              if (!knownPageIds.has(p.id)) {
                allPages.push({ id: p.id, name: p.name, access_token: p.access_token, category: p.category || null });
                knownPageIds.add(p.id);
                console.log(`[facebook] + Business page: ${p.name} (${p.id})`);
              }
            }
            bizPagesUrl = (bpData.paging as Record<string, string> | undefined)?.next || null;
          }

          // Also fetch client pages (pages managed for clients)
          let clientPagesUrl: string | null = `${GRAPH_API_BASE}/${biz.id}/client_pages?fields=id,name,access_token,category&limit=100&access_token=${longLivedData.access_token}`;
          while (clientPagesUrl) {
            const cpRes: Response = await fetch(clientPagesUrl);
            const cpData: Record<string, unknown> = await cpRes.json();
            if (cpData.error) break;
            for (const p of (cpData.data || []) as Array<{ id: string; name: string; access_token: string; category?: string }>) {
              if (!knownPageIds.has(p.id) && p.access_token) {
                allPages.push({ id: p.id, name: p.name, access_token: p.access_token, category: p.category || null });
                knownPageIds.add(p.id);
                console.log(`[facebook] + Client page: ${p.name} (${p.id})`);
              }
            }
            clientPagesUrl = (cpData.paging as Record<string, string> | undefined)?.next || null;
          }
        } catch (bizErr) {
          console.error(`[facebook] Error processing business ${biz.id}:`, bizErr);
        }
      }
    } catch (err) {
      console.error('[facebook] Error fetching businesses (may not have business_management scope):', err);
    }

    console.log(`[facebook] Total pages found (accounts + businesses): ${allPages.length}`);

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

  async fetchComments(tokens: TokenData, postId: string): Promise<InboxItem[]> {
    try {
      const res = await fetch(
        `${GRAPH_API_BASE}/${postId}/comments?fields=id,message,from,created_time,parent&access_token=${tokens.accessToken}`
      );
      const data = await res.json();
      if (data.error || !data.data) return [];

      return (data.data as Array<{
        id: string;
        message?: string;
        from?: { id: string; name: string };
        created_time?: string;
        parent?: { id: string };
      }>).map((c) => ({
        platformInteractionId: c.id,
        type: (c.parent ? 'reply' : 'comment') as 'comment' | 'reply',
        message: c.message || '',
        authorId: c.from?.id || '',
        authorName: c.from?.name || 'Unknown',
        timestamp: c.created_time || new Date().toISOString(),
        parentId: c.parent?.id,
        postId,
      }));
    } catch {
      return [];
    }
  },

  async fetchMentions(tokens: TokenData): Promise<InboxItem[]> {
    try {
      const pageOrUserId = tokens.platformPageId || tokens.platformUserId;
      if (!pageOrUserId) return [];

      const res = await fetch(
        `${GRAPH_API_BASE}/${pageOrUserId}/tagged?fields=id,message,from,created_time&access_token=${tokens.accessToken}`
      );
      const data = await res.json();
      if (data.error || !data.data) return [];

      return (data.data as Array<{
        id: string;
        message?: string;
        from?: { id: string; name: string };
        created_time?: string;
      }>).map((m) => ({
        platformInteractionId: m.id,
        type: 'mention' as const,
        message: m.message || '',
        authorId: m.from?.id || '',
        authorName: m.from?.name || 'Unknown',
        timestamp: m.created_time || new Date().toISOString(),
        postId: m.id,
      }));
    } catch {
      return [];
    }
  },

  async replyToComment(tokens: TokenData, commentId: string, message: string): Promise<ReplyResult> {
    try {
      const res = await fetch(`${GRAPH_API_BASE}/${commentId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, access_token: tokens.accessToken }),
      });
      const data = await res.json();

      if (data.error) {
        return { success: false, error: data.error.message || 'Failed to reply' };
      }

      return { success: true, platformReplyId: data.id };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Reply failed' };
    }
  },

  async fetchAccountMetrics(tokens: TokenData): Promise<AccountMetrics> {
    try {
      const pageOrUserId = tokens.platformPageId || tokens.platformUserId;
      if (!pageOrUserId) return { followersCount: 0, followingCount: 0, postsCount: 0 };

      const res = await fetch(
        `${GRAPH_API_BASE}/${pageOrUserId}?fields=fan_count,followers_count,name&access_token=${tokens.accessToken}`
      );
      const data = await res.json();

      if (data.error) return { followersCount: 0, followingCount: 0, postsCount: 0 };

      return {
        followersCount: data.followers_count || data.fan_count || 0,
        followingCount: 0,
        postsCount: 0,
        metadata: { name: data.name },
      };
    } catch {
      return { followersCount: 0, followingCount: 0, postsCount: 0 };
    }
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
