import type { PlatformAdapter, TokenData, PostPayload, PublishResult, AnalyticsData } from '../types';

const GRAPH_API_VERSION = 'v22.0';
const GRAPH_API_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

export const instagramAdapter: PlatformAdapter = {
  platform: 'instagram',

  getAuthUrl(state: string, redirectUri: string): string {
    // Instagram uses the same Meta OAuth flow as Facebook
    const params = new URLSearchParams({
      client_id: process.env.META_APP_ID!,
      redirect_uri: redirectUri,
      state,
      scope: 'instagram_basic,instagram_content_publish,instagram_manage_insights,pages_show_list,pages_read_engagement',
      response_type: 'code',
    });
    return `https://www.facebook.com/${GRAPH_API_VERSION}/dialog/oauth?${params}`;
  },

  async exchangeCode(code: string, redirectUri: string): Promise<TokenData> {
    console.log('Instagram OAuth: Starting token exchange...');

    // Same Meta OAuth exchange
    const tokenParams = new URLSearchParams({
      client_id: process.env.META_APP_ID!,
      client_secret: process.env.META_APP_SECRET!,
      redirect_uri: redirectUri,
      code,
    });

    const tokenRes = await fetch(`${GRAPH_API_BASE}/oauth/access_token?${tokenParams}`);
    const tokenData = await tokenRes.json();

    if (tokenData.error) {
      console.error('Instagram OAuth token error:', tokenData.error);
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

    console.log('Instagram OAuth: Fetching pages with Instagram Business accounts...');

    // Get pages and find Instagram business account
    const pagesRes = await fetch(
      `${GRAPH_API_BASE}/me/accounts?fields=id,name,instagram_business_account{id,username}&access_token=${longLivedData.access_token}`
    );
    const pagesData = await pagesRes.json();

    console.log('Instagram OAuth pages response:', {
      status: pagesRes.status,
      hasError: !!pagesData.error,
      error: pagesData.error,
      pagesCount: pagesData.data?.length || 0,
      pagesWithIG: pagesData.data?.filter((p: { instagram_business_account?: unknown }) => p.instagram_business_account).length || 0,
    });

    const pageWithIG = pagesData.data?.find(
      (p: { instagram_business_account?: { id: string } }) => p.instagram_business_account
    );

    if (!pageWithIG?.instagram_business_account) {
      console.error('No Instagram Business account found in pages:', pagesData.data);
      throw new Error('No Instagram Business account found. Please connect a Facebook Page with an Instagram Business account.');
    }

    console.log('Found Instagram Business account:', {
      igId: pageWithIG.instagram_business_account.id,
      igUsername: pageWithIG.instagram_business_account.username,
      fbPageId: pageWithIG.id,
      fbPageName: pageWithIG.name,
    });

    return {
      accessToken: pageWithIG.access_token || longLivedData.access_token,
      refreshToken: null,
      expiresAt: longLivedData.expires_in
        ? new Date(Date.now() + longLivedData.expires_in * 1000)
        : null,
      platformUserId: pageWithIG.instagram_business_account.id,
      platformUsername: pageWithIG.instagram_business_account.username,
      platformPageId: pageWithIG.id,
      platformPageName: pageWithIG.name,
      accountType: 'page',
      scopes: tokenData.scope?.split(',') || [],
      metadata: { pages: pagesData.data || [] },
    };
  },

  async refreshToken(_refreshToken: string): Promise<TokenData> {
    throw new Error('Instagram tokens must be reconnected via OAuth. Please reconnect your Instagram account.');
  },

  async publishPost(tokens: TokenData, post: PostPayload): Promise<PublishResult> {
    const igUserId = tokens.platformUserId;
    if (!igUserId) {
      return { success: false, error: 'No Instagram account connected.' };
    }

    if (!post.mediaUrls || post.mediaUrls.length === 0) {
      return { success: false, error: 'Instagram requires at least one image or video to publish.' };
    }

    try {
      const caption = buildInstagramCaption(post);
      const mediaUrl = post.mediaUrls[0];
      const isVideo = /\.(mp4|mov|avi|wmv)$/i.test(mediaUrl);

      // Step 1: Create media container
      const containerBody: Record<string, string> = {
        caption,
        access_token: tokens.accessToken,
      };

      if (isVideo) {
        containerBody.video_url = mediaUrl;
        containerBody.media_type = 'VIDEO';
      } else {
        containerBody.image_url = mediaUrl;
      }

      const containerRes = await fetch(`${GRAPH_API_BASE}/${igUserId}/media`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(containerBody),
      });
      const containerData = await containerRes.json();

      if (containerData.error) {
        return { success: false, error: containerData.error.message };
      }

      // Step 2: Wait for video processing if needed
      if (isVideo) {
        await waitForMediaProcessing(containerData.id, tokens.accessToken);
      }

      // Step 3: Publish the container
      const publishRes = await fetch(`${GRAPH_API_BASE}/${igUserId}/media_publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creation_id: containerData.id,
          access_token: tokens.accessToken,
        }),
      });
      const publishData = await publishRes.json();

      if (publishData.error) {
        return { success: false, error: publishData.error.message };
      }

      // Get permalink
      const mediaRes = await fetch(
        `${GRAPH_API_BASE}/${publishData.id}?fields=permalink&access_token=${tokens.accessToken}`
      );
      const mediaData = await mediaRes.json();

      return {
        success: true,
        platformPostId: publishData.id,
        postUrl: mediaData.permalink || `https://www.instagram.com/p/${publishData.id}`,
        metadata: publishData,
      };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Publishing failed' };
    }
  },

  async getPostAnalytics(tokens: TokenData, postId: string): Promise<AnalyticsData> {
    try {
      // Step 1: Fetch basic counts (works for all media types)
      const basicRes = await fetch(
        `${GRAPH_API_BASE}/${postId}?fields=like_count,comments_count,media_type&access_token=${tokens.accessToken}`
      );
      const basicData = await basicRes.json();

      if (basicData.error) {
        console.error('[Instagram Analytics] Basic fields error:', basicData.error.message);
        return { likes: 0, comments: 0, shares: 0, saves: 0, impressions: 0, reach: 0, clicks: 0, videoViews: 0, engagementRate: 0 };
      }

      const likes = basicData.like_count || 0;
      const comments = basicData.comments_count || 0;

      // Step 2: Fetch insights — only use metrics valid for Instagram media objects
      // Valid: impressions, reach, saved (all media types)
      // Video-only: video_views, plays, ig_reels_aggregated_all_plays_count
      let impressions = 0;
      let reach = 0;
      let saves = 0;
      let videoViews = 0;

      try {
        const insightMetrics = 'impressions,reach,saved';
        const metricsRes = await fetch(
          `${GRAPH_API_BASE}/${postId}/insights?metric=${insightMetrics}&access_token=${tokens.accessToken}`
        );
        const metricsData = await metricsRes.json();

        if (metricsData.data && !metricsData.error) {
          const getMetric = (name: string): number => {
            const metric = metricsData.data?.find((d: { name: string }) => d.name === name);
            return metric?.values?.[0]?.value || 0;
          };
          impressions = getMetric('impressions');
          reach = getMetric('reach');
          saves = getMetric('saved');
        }
      } catch {
        // Insights may not be available for all post types (e.g., promoted posts)
      }

      // Step 3: For VIDEO/REEL, try to fetch video views separately
      const mediaType = basicData.media_type;
      if (mediaType === 'VIDEO') {
        try {
          const videoRes = await fetch(
            `${GRAPH_API_BASE}/${postId}/insights?metric=plays&access_token=${tokens.accessToken}`
          );
          const videoData = await videoRes.json();
          if (videoData.data && !videoData.error) {
            const playsMetric = videoData.data.find((d: { name: string }) => d.name === 'plays');
            videoViews = playsMetric?.values?.[0]?.value || 0;
          }
        } catch {
          // Video metrics not available
        }
      }

      const totalEngagement = likes + comments + saves;
      const engagementRate = reach > 0 ? (totalEngagement / reach) * 100 : 0;

      return {
        likes,
        comments,
        shares: 0, // Instagram API doesn't expose share counts
        saves,
        impressions,
        reach,
        clicks: 0,
        videoViews,
        engagementRate: Math.round(engagementRate * 100) / 100,
        metadata: basicData,
      };
    } catch (error) {
      console.error('[Instagram Analytics] Failed:', error);
      return { likes: 0, comments: 0, shares: 0, saves: 0, impressions: 0, reach: 0, clicks: 0, videoViews: 0, engagementRate: 0 };
    }
  },

  async revokeAccess(tokens: TokenData): Promise<void> {
    await fetch(`${GRAPH_API_BASE}/me/permissions?access_token=${tokens.accessToken}`, {
      method: 'DELETE',
    });
  },
};

function buildInstagramCaption(post: PostPayload): string {
  let caption = post.caption || post.text || '';
  if (post.hashtags && post.hashtags.length > 0) {
    caption += '\n\n' + post.hashtags.map(h => h.startsWith('#') ? h : `#${h}`).join(' ');
  }
  // Instagram caption limit: 2200 chars
  return caption.slice(0, 2200);
}

async function waitForMediaProcessing(containerId: string, accessToken: string, maxRetries = 30): Promise<void> {
  for (let i = 0; i < maxRetries; i++) {
    const res = await fetch(
      `${GRAPH_API_BASE}/${containerId}?fields=status_code&access_token=${accessToken}`
    );
    const data = await res.json();

    if (data.status_code === 'FINISHED') return;
    if (data.status_code === 'ERROR') throw new Error('Instagram media processing failed');

    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  throw new Error('Instagram media processing timed out');
}
