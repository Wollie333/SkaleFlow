import type { PlatformAdapter, TokenData, PostPayload, PublishResult, AnalyticsData } from '../types';

const TIKTOK_API_BASE = 'https://open.tiktokapis.com/v2';

export const tiktokAdapter: PlatformAdapter = {
  platform: 'tiktok',

  getAuthUrl(state: string, redirectUri: string): string {
    const params = new URLSearchParams({
      client_key: process.env.TIKTOK_CLIENT_KEY!,
      response_type: 'code',
      scope: 'user.info.basic,video.publish,video.list',
      redirect_uri: redirectUri,
      state,
    });
    return `https://www.tiktok.com/v2/auth/authorize/?${params}`;
  },

  async exchangeCode(code: string, redirectUri: string): Promise<TokenData> {
    const tokenRes = await fetch(`${TIKTOK_API_BASE}/oauth/token/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_key: process.env.TIKTOK_CLIENT_KEY!,
        client_secret: process.env.TIKTOK_CLIENT_SECRET!,
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      }),
    });

    const tokenData = await tokenRes.json();

    if (tokenData.error || !tokenData.data?.access_token) {
      throw new Error(tokenData.error?.message || 'Failed to exchange code');
    }

    const data = tokenData.data;

    // Get user info
    const userRes = await fetch(`${TIKTOK_API_BASE}/user/info/?fields=open_id,union_id,display_name,avatar_url`, {
      headers: { Authorization: `Bearer ${data.access_token}` },
    });
    const userData = await userRes.json();
    const userInfo = userData.data?.user;

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token || null,
      expiresAt: data.expires_in
        ? new Date(Date.now() + data.expires_in * 1000)
        : null,
      scopes: data.scope?.split(',') || [],
      platformUserId: data.open_id,
      platformUsername: userInfo?.display_name || data.open_id,
    };
  },

  async refreshToken(refreshToken: string): Promise<TokenData> {
    const tokenRes = await fetch(`${TIKTOK_API_BASE}/oauth/token/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_key: process.env.TIKTOK_CLIENT_KEY!,
        client_secret: process.env.TIKTOK_CLIENT_SECRET!,
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
    });

    const tokenData = await tokenRes.json();

    if (tokenData.error || !tokenData.data?.access_token) {
      throw new Error(tokenData.error?.message || 'Failed to refresh token');
    }

    const data = tokenData.data;

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token || refreshToken,
      expiresAt: data.expires_in
        ? new Date(Date.now() + data.expires_in * 1000)
        : null,
    };
  },

  async publishPost(tokens: TokenData, post: PostPayload): Promise<PublishResult> {
    // TikTok only supports video posts
    const videoUrl = post.mediaUrls?.find(url => /\.(mp4|mov|avi|wmv)$/i.test(url));

    if (!videoUrl) {
      return { success: false, error: 'TikTok requires a video file to publish. No video found in media.' };
    }

    try {
      // Step 1: Initialize upload
      const initRes = await fetch(`${TIKTOK_API_BASE}/post/publish/video/init/`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${tokens.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          post_info: {
            title: buildTikTokDescription(post),
            privacy_level: 'PUBLIC_TO_EVERYONE',
            disable_duet: false,
            disable_comment: false,
            disable_stitch: false,
          },
          source_info: {
            source: 'PULL_FROM_URL',
            video_url: videoUrl,
          },
        }),
      });

      const initData = await initRes.json();

      if (initData.error?.code !== 'ok' && initData.error?.code) {
        return { success: false, error: initData.error.message || 'TikTok upload initialization failed' };
      }

      const publishId = initData.data?.publish_id;

      // Step 2: Check publish status (poll)
      let postId: string | undefined;
      for (let i = 0; i < 30; i++) {
        await new Promise(resolve => setTimeout(resolve, 3000));

        const statusRes = await fetch(`${TIKTOK_API_BASE}/post/publish/status/fetch/`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${tokens.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ publish_id: publishId }),
        });

        const statusData = await statusRes.json();
        const status = statusData.data?.status;

        if (status === 'PUBLISH_COMPLETE') {
          postId = statusData.data?.publicaly_available_post_id?.[0];
          break;
        }
        if (status === 'FAILED') {
          return { success: false, error: statusData.data?.fail_reason || 'TikTok publishing failed' };
        }
      }

      return {
        success: true,
        platformPostId: postId || publishId,
        postUrl: postId ? `https://www.tiktok.com/@${tokens.platformUsername}/video/${postId}` : undefined,
        metadata: { publishId },
      };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Publishing failed' };
    }
  },

  async getPostAnalytics(tokens: TokenData, postId: string): Promise<AnalyticsData> {
    try {
      const res = await fetch(`${TIKTOK_API_BASE}/video/query/?fields=id,like_count,comment_count,share_count,view_count`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${tokens.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filters: { video_ids: [postId] },
        }),
      });

      const data = await res.json();
      const video = data.data?.videos?.[0];

      if (!video) {
        return { likes: 0, comments: 0, shares: 0, saves: 0, impressions: 0, reach: 0, clicks: 0, videoViews: 0, engagementRate: 0 };
      }

      const likes = video.like_count || 0;
      const comments = video.comment_count || 0;
      const shares = video.share_count || 0;
      const views = video.view_count || 0;

      const totalEngagement = likes + comments + shares;
      const engagementRate = views > 0 ? (totalEngagement / views) * 100 : 0;

      return {
        likes,
        comments,
        shares,
        saves: 0,
        impressions: views,
        reach: 0,
        clicks: 0,
        videoViews: views,
        engagementRate: Math.round(engagementRate * 100) / 100,
        metadata: video,
      };
    } catch {
      return { likes: 0, comments: 0, shares: 0, saves: 0, impressions: 0, reach: 0, clicks: 0, videoViews: 0, engagementRate: 0 };
    }
  },

  async revokeAccess(tokens: TokenData): Promise<void> {
    await fetch(`${TIKTOK_API_BASE}/oauth/revoke/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_key: process.env.TIKTOK_CLIENT_KEY!,
        token: tokens.accessToken,
      }),
    });
  },
};

function buildTikTokDescription(post: PostPayload): string {
  let desc = post.caption || post.text || '';
  if (post.hashtags && post.hashtags.length > 0) {
    desc += ' ' + post.hashtags.join(' ');
  }
  return desc.slice(0, 2200);
}
