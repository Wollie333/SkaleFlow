import type { PlatformAdapter, TokenData, PostPayload, PublishResult, AnalyticsData, InboxItem, ReplyResult, AccountMetrics } from '../types';

const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';

export const youtubeAdapter: PlatformAdapter = {
  platform: 'youtube',

  getAuthUrl(state: string, redirectUri: string): string {
    const params = new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube.readonly https://www.googleapis.com/auth/youtube.force-ssl',
      access_type: 'offline',
      prompt: 'consent',
      state,
    });
    return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
  },

  async exchangeCode(code: string, redirectUri: string): Promise<TokenData> {
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = await tokenRes.json();

    if (tokenData.error) {
      throw new Error(tokenData.error_description || 'Failed to exchange code');
    }

    // Get channel info
    const channelRes = await fetch(
      `${YOUTUBE_API_BASE}/channels?part=snippet&mine=true`,
      { headers: { Authorization: `Bearer ${tokenData.access_token}` } }
    );
    const channelData = await channelRes.json();
    const channel = channelData.items?.[0];

    return {
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token || null,
      expiresAt: tokenData.expires_in
        ? new Date(Date.now() + tokenData.expires_in * 1000)
        : null,
      scopes: tokenData.scope?.split(' ') || [],
      platformUserId: channel?.id || null,
      platformUsername: channel?.snippet?.title || null,
      platformPageId: channel?.id || null,
      platformPageName: channel?.snippet?.title || null,
      metadata: { channel: channel?.snippet || {} },
    };
  },

  async refreshToken(refreshToken: string): Promise<TokenData> {
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
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
    const videoUrl = post.mediaUrls?.find(url => /\.(mp4|mov|avi|wmv|mkv|flv|webm)$/i.test(url));

    if (!videoUrl) {
      return { success: false, error: 'YouTube requires a video file to publish.' };
    }

    try {
      const title = (post.caption || post.text || 'Untitled').slice(0, 100);
      const description = buildYouTubeDescription(post);

      // Download the video first
      const videoRes = await fetch(videoUrl);
      if (!videoRes.ok) {
        return { success: false, error: 'Failed to download video for upload.' };
      }
      const videoBlob = await videoRes.blob();

      // Step 1: Start resumable upload
      const initRes = await fetch(
        `https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${tokens.accessToken}`,
            'Content-Type': 'application/json',
            'X-Upload-Content-Type': videoBlob.type || 'video/mp4',
            'X-Upload-Content-Length': videoBlob.size.toString(),
          },
          body: JSON.stringify({
            snippet: {
              title,
              description,
              tags: post.hashtags?.map(h => h.replace('#', '')) || [],
            },
            status: {
              privacyStatus: 'public',
              selfDeclaredMadeForKids: false,
            },
          }),
        }
      );

      if (!initRes.ok) {
        const errorData = await initRes.json().catch(() => ({}));
        return { success: false, error: (errorData as { error?: { message?: string } }).error?.message || 'Failed to initialize YouTube upload' };
      }

      const uploadUrl = initRes.headers.get('Location');
      if (!uploadUrl) {
        return { success: false, error: 'No upload URL returned from YouTube' };
      }

      // Step 2: Upload the video
      const uploadRes = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': videoBlob.type || 'video/mp4',
          'Content-Length': videoBlob.size.toString(),
        },
        body: videoBlob,
      });

      const uploadData = await uploadRes.json();

      if (!uploadRes.ok || !uploadData.id) {
        return { success: false, error: (uploadData as { error?: { message?: string } }).error?.message || 'YouTube video upload failed' };
      }

      return {
        success: true,
        platformPostId: uploadData.id,
        postUrl: `https://www.youtube.com/watch?v=${uploadData.id}`,
        metadata: uploadData,
      };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Publishing failed' };
    }
  },

  async getPostAnalytics(tokens: TokenData, postId: string): Promise<AnalyticsData> {
    try {
      const res = await fetch(
        `${YOUTUBE_API_BASE}/videos?part=statistics&id=${postId}`,
        { headers: { Authorization: `Bearer ${tokens.accessToken}` } }
      );

      const data = await res.json();
      const stats = data.items?.[0]?.statistics;

      if (!stats) {
        return { likes: 0, comments: 0, shares: 0, saves: 0, impressions: 0, reach: 0, clicks: 0, videoViews: 0, engagementRate: 0 };
      }

      const likes = parseInt(stats.likeCount || '0', 10);
      const comments = parseInt(stats.commentCount || '0', 10);
      const views = parseInt(stats.viewCount || '0', 10);
      const favorites = parseInt(stats.favoriteCount || '0', 10);

      const totalEngagement = likes + comments;
      const engagementRate = views > 0 ? (totalEngagement / views) * 100 : 0;

      return {
        likes,
        comments,
        shares: 0,
        saves: favorites,
        impressions: views,
        reach: 0,
        clicks: 0,
        videoViews: views,
        engagementRate: Math.round(engagementRate * 100) / 100,
        metadata: stats,
      };
    } catch {
      return { likes: 0, comments: 0, shares: 0, saves: 0, impressions: 0, reach: 0, clicks: 0, videoViews: 0, engagementRate: 0 };
    }
  },

  async revokeAccess(tokens: TokenData): Promise<void> {
    await fetch(`https://oauth2.googleapis.com/revoke?token=${tokens.accessToken}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
  },

  async fetchComments(tokens: TokenData, postId: string): Promise<InboxItem[]> {
    try {
      const res = await fetch(
        `${YOUTUBE_API_BASE}/commentThreads?videoId=${postId}&part=snippet&maxResults=50`,
        { headers: { Authorization: `Bearer ${tokens.accessToken}` } }
      );
      const data = await res.json();
      if (data.error || !data.items) return [];

      return (data.items as Array<{
        id: string;
        snippet: {
          topLevelComment: {
            id: string;
            snippet: {
              textDisplay?: string;
              authorDisplayName?: string;
              authorChannelId?: { value?: string };
              authorProfileImageUrl?: string;
              publishedAt?: string;
            };
          };
        };
      }>).map((item) => {
        const c = item.snippet.topLevelComment.snippet;
        return {
          platformInteractionId: item.snippet.topLevelComment.id,
          type: 'comment' as const,
          message: c.textDisplay || '',
          authorId: c.authorChannelId?.value || '',
          authorName: c.authorDisplayName || 'Unknown',
          authorAvatarUrl: c.authorProfileImageUrl,
          timestamp: c.publishedAt || new Date().toISOString(),
          postId,
        };
      });
    } catch {
      return [];
    }
  },

  async replyToComment(tokens: TokenData, commentId: string, message: string): Promise<ReplyResult> {
    try {
      const res = await fetch(`${YOUTUBE_API_BASE}/comments?part=snippet`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${tokens.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          snippet: {
            parentId: commentId,
            textOriginal: message,
          },
        }),
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
      const res = await fetch(
        `${YOUTUBE_API_BASE}/channels?mine=true&part=statistics`,
        { headers: { Authorization: `Bearer ${tokens.accessToken}` } }
      );
      const data = await res.json();
      const stats = data.items?.[0]?.statistics;

      if (!stats) return { followersCount: 0, followingCount: 0, postsCount: 0 };

      return {
        followersCount: parseInt(stats.subscriberCount || '0', 10),
        followingCount: 0,
        postsCount: parseInt(stats.videoCount || '0', 10),
        metadata: {
          viewCount: parseInt(stats.viewCount || '0', 10),
          hiddenSubscriberCount: stats.hiddenSubscriberCount || false,
        },
      };
    } catch {
      return { followersCount: 0, followingCount: 0, postsCount: 0 };
    }
  },
};

function buildYouTubeDescription(post: PostPayload): string {
  let desc = post.caption || post.text || '';
  if (post.link) {
    desc += `\n\n${post.link}`;
  }
  if (post.hashtags && post.hashtags.length > 0) {
    desc += '\n\n' + post.hashtags.map(h => h.startsWith('#') ? h : `#${h}`).join(' ');
  }
  return desc.slice(0, 5000);
}
