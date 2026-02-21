import crypto from 'crypto';
import type { PlatformAdapter, TokenData, PostPayload, PublishResult, AnalyticsData, InboxItem, ReplyResult, AccountMetrics } from '../types';

const TWITTER_API_BASE = 'https://api.twitter.com/2';

function computeS256Challenge(verifier: string): string {
  return crypto.createHash('sha256').update(verifier).digest('base64url');
}

export const twitterAdapter: PlatformAdapter = {
  platform: 'twitter',

  getAuthUrl(state: string, redirectUri: string): string {
    // Twitter OAuth 2.0 with PKCE (S256)
    // state doubles as code_verifier — it's a random string stored by the caller
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: process.env.TWITTER_CLIENT_ID!,
      redirect_uri: redirectUri,
      scope: 'tweet.read tweet.write users.read offline.access',
      state,
      code_challenge: computeS256Challenge(state),
      code_challenge_method: 'S256',
    });
    return `https://twitter.com/i/oauth2/authorize?${params}`;
  },

  async exchangeCode(code: string, redirectUri: string, codeVerifier?: string): Promise<TokenData> {
    const basicAuth = Buffer.from(
      `${process.env.TWITTER_CLIENT_ID}:${process.env.TWITTER_CLIENT_SECRET}`
    ).toString('base64');

    const tokenRes = await fetch('https://api.twitter.com/2/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${basicAuth}`,
      },
      body: new URLSearchParams({
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
        code_verifier: codeVerifier || code, // codeVerifier should be the original state value used in getAuthUrl
      }),
    });

    const tokenData = await tokenRes.json();

    if (tokenData.error) {
      throw new Error(tokenData.error_description || 'Failed to exchange code');
    }

    // Get user profile
    const userRes = await fetch(`${TWITTER_API_BASE}/users/me`, {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const userData = await userRes.json();

    return {
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token || null,
      expiresAt: tokenData.expires_in
        ? new Date(Date.now() + tokenData.expires_in * 1000)
        : null,
      scopes: tokenData.scope?.split(' ') || [],
      platformUserId: userData.data?.id,
      platformUsername: `@${userData.data?.username}`,
    };
  },

  async refreshToken(refreshToken: string): Promise<TokenData> {
    const basicAuth = Buffer.from(
      `${process.env.TWITTER_CLIENT_ID}:${process.env.TWITTER_CLIENT_SECRET}`
    ).toString('base64');

    const tokenRes = await fetch('https://api.twitter.com/2/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${basicAuth}`,
      },
      body: new URLSearchParams({
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
    try {
      const tweetText = buildTweetText(post);

      const res = await fetch(`${TWITTER_API_BASE}/tweets`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${tokens.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: tweetText }),
      });

      const data = await res.json();

      if (data.errors || !data.data) {
        return {
          success: false,
          error: data.errors?.[0]?.message || data.detail || 'Failed to publish tweet',
        };
      }

      return {
        success: true,
        platformPostId: data.data.id,
        postUrl: `https://twitter.com/i/status/${data.data.id}`,
        metadata: data,
      };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Publishing failed' };
    }
  },

  async getPostAnalytics(tokens: TokenData, postId: string): Promise<AnalyticsData> {
    try {
      const res = await fetch(
        `${TWITTER_API_BASE}/tweets/${postId}?tweet.fields=public_metrics,non_public_metrics,organic_metrics`,
        {
          headers: { Authorization: `Bearer ${tokens.accessToken}` },
        }
      );

      const data = await res.json();
      const metrics = data.data?.public_metrics || {};
      const nonPublic = data.data?.non_public_metrics || {};

      const likes = metrics.like_count || 0;
      const comments = metrics.reply_count || 0;
      const shares = metrics.retweet_count + (metrics.quote_count || 0);
      const impressions = nonPublic.impression_count || metrics.impression_count || 0;
      const clicks = nonPublic.url_link_clicks || 0;

      const totalEngagement = likes + comments + shares;
      const engagementRate = impressions > 0 ? (totalEngagement / impressions) * 100 : 0;

      return {
        likes,
        comments,
        shares,
        saves: metrics.bookmark_count || 0,
        impressions,
        reach: 0,
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
    const basicAuth = Buffer.from(
      `${process.env.TWITTER_CLIENT_ID}:${process.env.TWITTER_CLIENT_SECRET}`
    ).toString('base64');

    await fetch('https://api.twitter.com/2/oauth2/revoke', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${basicAuth}`,
      },
      body: new URLSearchParams({
        token: tokens.accessToken,
        token_type_hint: 'access_token',
      }),
    });
  },

  async fetchComments(tokens: TokenData, postId: string): Promise<InboxItem[]> {
    try {
      const res = await fetch(
        `https://api.x.com/2/tweets/search/recent?query=conversation_id:${postId}&tweet.fields=created_at,author_id,in_reply_to_user_id&user.fields=name,username,profile_image_url&expansions=author_id`,
        { headers: { Authorization: `Bearer ${tokens.accessToken}` } }
      );
      const data = await res.json();
      if (data.errors || !data.data) return [];

      // Build a user lookup map from includes
      const userMap = new Map<string, { name: string; username: string; profile_image_url?: string }>();
      if (data.includes?.users) {
        for (const u of data.includes.users as Array<{ id: string; name: string; username: string; profile_image_url?: string }>) {
          userMap.set(u.id, u);
        }
      }

      return (data.data as Array<{
        id: string;
        text: string;
        author_id?: string;
        created_at?: string;
        in_reply_to_user_id?: string;
      }>).map((t) => {
        const author = userMap.get(t.author_id || '');
        return {
          platformInteractionId: t.id,
          type: 'reply' as const,
          message: t.text,
          authorId: t.author_id || '',
          authorName: author?.name || 'Unknown',
          authorUsername: author ? `@${author.username}` : undefined,
          authorAvatarUrl: author?.profile_image_url,
          timestamp: t.created_at || new Date().toISOString(),
          postId,
        };
      });
    } catch {
      return [];
    }
  },

  async fetchMentions(tokens: TokenData): Promise<InboxItem[]> {
    try {
      const userId = tokens.platformUserId;
      if (!userId) return [];

      const res = await fetch(
        `https://api.x.com/2/users/${userId}/mentions?tweet.fields=created_at,author_id&user.fields=name,username,profile_image_url&expansions=author_id`,
        { headers: { Authorization: `Bearer ${tokens.accessToken}` } }
      );
      const data = await res.json();
      if (data.errors || !data.data) return [];

      const userMap = new Map<string, { name: string; username: string; profile_image_url?: string }>();
      if (data.includes?.users) {
        for (const u of data.includes.users as Array<{ id: string; name: string; username: string; profile_image_url?: string }>) {
          userMap.set(u.id, u);
        }
      }

      return (data.data as Array<{
        id: string;
        text: string;
        author_id?: string;
        created_at?: string;
      }>).map((t) => {
        const author = userMap.get(t.author_id || '');
        return {
          platformInteractionId: t.id,
          type: 'mention' as const,
          message: t.text,
          authorId: t.author_id || '',
          authorName: author?.name || 'Unknown',
          authorUsername: author ? `@${author.username}` : undefined,
          authorAvatarUrl: author?.profile_image_url,
          timestamp: t.created_at || new Date().toISOString(),
        };
      });
    } catch {
      return [];
    }
  },

  async replyToComment(tokens: TokenData, commentId: string, message: string): Promise<ReplyResult> {
    try {
      const res = await fetch(`${TWITTER_API_BASE}/tweets`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${tokens.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: message,
          reply: { in_reply_to_tweet_id: commentId },
        }),
      });
      const data = await res.json();

      if (data.errors || !data.data) {
        return { success: false, error: data.errors?.[0]?.message || data.detail || 'Failed to reply' };
      }

      return { success: true, platformReplyId: data.data.id };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Reply failed' };
    }
  },

  async fetchAccountMetrics(tokens: TokenData): Promise<AccountMetrics> {
    try {
      const userId = tokens.platformUserId;
      if (!userId) return { followersCount: 0, followingCount: 0, postsCount: 0 };

      const res = await fetch(
        `https://api.x.com/2/users/${userId}?user.fields=public_metrics`,
        { headers: { Authorization: `Bearer ${tokens.accessToken}` } }
      );
      const data = await res.json();

      if (data.errors || !data.data) return { followersCount: 0, followingCount: 0, postsCount: 0 };

      const metrics = data.data.public_metrics || {};
      return {
        followersCount: metrics.followers_count || 0,
        followingCount: metrics.following_count || 0,
        postsCount: metrics.tweet_count || 0,
        metadata: metrics,
      };
    } catch {
      return { followersCount: 0, followingCount: 0, postsCount: 0 };
    }
  },
};

function buildTweetText(post: PostPayload): string {
  let text = post.caption || post.text || '';

  // Add hashtags if room
  if (post.hashtags && post.hashtags.length > 0) {
    const hashtagStr = post.hashtags.map(h => h.startsWith('#') ? h : `#${h}`).join(' ');
    if (text.length + 2 + hashtagStr.length <= 280) {
      text += '\n\n' + hashtagStr;
    }
  }

  // Twitter limit: 280 chars
  if (text.length > 280) {
    text = text.slice(0, 277) + '...';
  }

  return text;
}
