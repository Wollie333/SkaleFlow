import type { PlatformAdapter, TokenData, PostPayload, PublishResult, AnalyticsData } from '../types';

const LINKEDIN_API_BASE = 'https://api.linkedin.com';

export const linkedinAdapter: PlatformAdapter = {
  platform: 'linkedin',

  getAuthUrl(state: string, redirectUri: string): string {
    const scope = 'openid profile w_member_social r_organization_social w_organization_social';
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: process.env.LINKEDIN_CLIENT_ID!,
      redirect_uri: redirectUri,
      state,
      scope,
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

    // Try to fetch managed organizations (requires org scopes)
    const pages: Array<{ id: string; name: string; access_token: string; category: string | null }> = [];
    try {
      const orgsRes = await fetch(
        `${LINKEDIN_API_BASE}/rest/organizationAcls?q=roleAssignee&role=ADMINISTRATOR&projection=(elements*(organization~(id,localizedName)))`,
        {
          headers: {
            Authorization: `Bearer ${tokenData.access_token}`,
            'LinkedIn-Version': '202601',
            'X-Restli-Protocol-Version': '2.0.0',
          },
        }
      );
      if (orgsRes.ok) {
        const orgsData = await orgsRes.json();
        const elements = orgsData.elements || [];
        for (const el of elements) {
          const org = el['organization~'];
          if (org) {
            pages.push({
              id: String(org.id),
              name: org.localizedName || 'Organization',
              access_token: tokenData.access_token, // same token used for org posting
              category: 'Company Page',
            });
          }
        }
      }
    } catch {
      // Org scope not granted — personal profile still works
    }

    return {
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token || null,
      expiresAt: tokenData.expires_in
        ? new Date(Date.now() + tokenData.expires_in * 1000)
        : null,
      scopes: tokenData.scope?.split(' ') || [],
      platformUserId: profileData.sub,
      platformUsername: profileData.name || `${profileData.given_name} ${profileData.family_name}`,
      accountType: 'profile',
      metadata: pages.length > 0 ? { pages } : undefined,
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
    // Use organization URN when platformPageId is set (company page), else personal profile
    const authorUrn = tokens.platformPageId
      ? `urn:li:organization:${tokens.platformPageId}`
      : `urn:li:person:${tokens.platformUserId}`;

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

      // If there are media URLs (images), upload natively via LinkedIn's image API
      if (post.mediaUrls && post.mediaUrls.length > 0 && !post.link) {
        const imageUrn = await uploadImageToLinkedIn(tokens.accessToken, authorUrn, post.mediaUrls[0]);
        if (imageUrn) {
          postBody.content = {
            media: {
              id: imageUrn,
            },
          };
        }
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
      // The URN is typically urn:li:share:{id} — use it directly in the feed URL
      // LinkedIn feed URLs work with both share and activity URNs
      const postUrl = postUrn
        ? `https://www.linkedin.com/feed/update/${postUrn}`
        : undefined;

      return {
        success: true,
        platformPostId: postUrn,
        postUrl,
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
    text += '\n\n' + post.hashtags.map(h => h.startsWith('#') ? h : `#${h}`).join(' ');
  }
  // LinkedIn limit: 3000 chars
  return text.slice(0, 3000);
}

/**
 * Upload an image to LinkedIn using the Images API (2-step: register then upload binary).
 * Returns the image URN for use in a post, or null on failure.
 */
async function uploadImageToLinkedIn(
  accessToken: string,
  ownerUrn: string,
  imageUrl: string
): Promise<string | null> {
  try {
    // Step 1: Initialize the upload
    const initRes = await fetch(`${LINKEDIN_API_BASE}/rest/images?action=initializeUpload`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'LinkedIn-Version': '202601',
        'X-Restli-Protocol-Version': '2.0.0',
      },
      body: JSON.stringify({
        initializeUploadRequest: {
          owner: ownerUrn,
        },
      }),
    });

    if (!initRes.ok) {
      console.error('[LinkedIn Image] Init upload failed:', initRes.status, await initRes.text());
      return null;
    }

    const initData = await initRes.json();
    const uploadUrl = initData.value?.uploadUrl;
    const imageUrn = initData.value?.image;

    if (!uploadUrl || !imageUrn) {
      console.error('[LinkedIn Image] Missing uploadUrl or image URN in response');
      return null;
    }

    // Step 2: Download the image from the external URL
    const imageRes = await fetch(imageUrl);
    if (!imageRes.ok) {
      console.error('[LinkedIn Image] Failed to download image from:', imageUrl);
      return null;
    }
    const imageBuffer = await imageRes.arrayBuffer();

    // Step 3: Upload the binary to LinkedIn's upload URL
    const uploadRes = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/octet-stream',
      },
      body: imageBuffer,
    });

    if (!uploadRes.ok) {
      console.error('[LinkedIn Image] Binary upload failed:', uploadRes.status);
      return null;
    }

    return imageUrn;
  } catch (error) {
    console.error('[LinkedIn Image] Upload error:', error);
    return null;
  }
}
