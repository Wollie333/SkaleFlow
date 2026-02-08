import { createHash } from 'crypto';
import type {
  AdPlatformAdapter,
  AdTokenData,
  CampaignPayload,
  AdSetPayload,
  CreativePayload,
  MediaAsset,
  AdResult,
  AdInsights,
  AudiencePayload,
  CustomerListData,
} from '../types';

const GRAPH_API_VERSION = 'v19.0';
const GRAPH_API_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

const META_OBJECTIVE_MAP: Record<string, string> = {
  awareness: 'OUTCOME_AWARENESS',
  traffic: 'OUTCOME_TRAFFIC',
  engagement: 'OUTCOME_ENGAGEMENT',
  leads: 'OUTCOME_LEADS',
  sales: 'OUTCOME_SALES',
  app_promotion: 'OUTCOME_APP_PROMOTION',
  // Allow pass-through for already-mapped values
  OUTCOME_AWARENESS: 'OUTCOME_AWARENESS',
  OUTCOME_TRAFFIC: 'OUTCOME_TRAFFIC',
  OUTCOME_ENGAGEMENT: 'OUTCOME_ENGAGEMENT',
  OUTCOME_LEADS: 'OUTCOME_LEADS',
  OUTCOME_SALES: 'OUTCOME_SALES',
  OUTCOME_APP_PROMOTION: 'OUTCOME_APP_PROMOTION',
};

function getMetaAppId(): string {
  const id = process.env.META_ADS_APP_ID;
  if (!id) throw new Error('META_ADS_APP_ID environment variable is not set');
  return id;
}

function getMetaAppSecret(): string {
  const secret = process.env.META_ADS_APP_SECRET;
  if (!secret) throw new Error('META_ADS_APP_SECRET environment variable is not set');
  return secret;
}

function getAdAccountId(tokens: AdTokenData): string {
  const accountId = tokens.platformAccountId;
  if (!accountId) throw new Error('No Meta ad account ID found. Please reconnect your ad account.');
  // Meta API expects act_ prefix
  return accountId.startsWith('act_') ? accountId : `act_${accountId}`;
}

async function metaFetch<T = any>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  const data = await res.json();

  if (data.error) {
    const msg = data.error.message || data.error.error_user_msg || 'Meta API error';
    const code = data.error.code ? ` (code: ${data.error.code})` : '';
    throw new Error(`${msg}${code}`);
  }

  return data as T;
}

function sha256(value: string): string {
  return createHash('sha256').update(value.trim().toLowerCase()).digest('hex');
}

function buildEmptyInsights(currency: string): AdInsights {
  return {
    impressions: 0,
    reach: 0,
    frequency: 0,
    clicks: 0,
    likes: 0,
    comments: 0,
    shares: 0,
    saves: 0,
    videoViews: 0,
    video3sViews: 0,
    ctr: 0,
    engagementRate: 0,
    conversions: 0,
    conversionValueCents: 0,
    spendCents: 0,
    currency,
    cpcCents: 0,
    cpmCents: 0,
    cpaCents: null,
    roas: null,
  };
}

export class MetaAdsAdapter implements AdPlatformAdapter {
  platform = 'meta' as const;

  getAuthUrl(state: string, redirectUri: string): string {
    const params = new URLSearchParams({
      client_id: getMetaAppId(),
      redirect_uri: redirectUri,
      state,
      scope: 'ads_management,ads_read,business_management',
      response_type: 'code',
    });
    return `https://www.facebook.com/${GRAPH_API_VERSION}/dialog/oauth?${params}`;
  }

  async exchangeCode(code: string, redirectUri: string): Promise<AdTokenData> {
    // Exchange authorization code for short-lived token
    const tokenParams = new URLSearchParams({
      client_id: getMetaAppId(),
      client_secret: getMetaAppSecret(),
      redirect_uri: redirectUri,
      code,
    });

    const tokenData = await metaFetch<{
      access_token: string;
      token_type: string;
      expires_in?: number;
      scope?: string;
    }>(`${GRAPH_API_BASE}/oauth/access_token?${tokenParams}`);

    // Exchange for long-lived token (60-day expiry)
    const longLivedParams = new URLSearchParams({
      grant_type: 'fb_exchange_token',
      client_id: getMetaAppId(),
      client_secret: getMetaAppSecret(),
      fb_exchange_token: tokenData.access_token,
    });

    const longLivedData = await metaFetch<{
      access_token: string;
      token_type: string;
      expires_in?: number;
    }>(`${GRAPH_API_BASE}/oauth/access_token?${longLivedParams}`);

    // Get user info
    const userData = await metaFetch<{ id: string; name: string }>(
      `${GRAPH_API_BASE}/me?fields=id,name&access_token=${longLivedData.access_token}`
    );

    // Get ad accounts the user has access to
    const adAccountsData = await metaFetch<{
      data?: Array<{ id: string; account_id: string; name: string; currency: string; account_status: number }>;
    }>(
      `${GRAPH_API_BASE}/me/adaccounts?fields=id,account_id,name,currency,account_status&access_token=${longLivedData.access_token}`
    );

    const activeAccounts = (adAccountsData.data || []).filter(
      (acc) => acc.account_status === 1 // 1 = ACTIVE
    );
    const firstAccount = activeAccounts[0];

    return {
      accessToken: longLivedData.access_token,
      refreshToken: null, // Meta long-lived tokens do not use refresh tokens
      expiresAt: longLivedData.expires_in
        ? new Date(Date.now() + longLivedData.expires_in * 1000)
        : new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // Default 60 days
      scopes: tokenData.scope?.split(',') || ['ads_management', 'ads_read', 'business_management'],
      platformAccountId: firstAccount?.id || firstAccount?.account_id || '',
      platformAccountName: firstAccount?.name || userData.name,
      metadata: {
        userId: userData.id,
        userName: userData.name,
        adAccounts: activeAccounts,
        currency: firstAccount?.currency || 'USD',
      },
    };
  }

  async refreshToken(_refreshToken: string): Promise<AdTokenData> {
    // Meta long-lived tokens expire after ~60 days and cannot be refreshed
    // with a refresh token. The user must re-authenticate via OAuth.
    throw new Error(
      'Meta ad account tokens cannot be refreshed. Please re-authenticate your Meta ad account via OAuth.'
    );
  }

  async createCampaign(tokens: AdTokenData, payload: CampaignPayload): Promise<AdResult> {
    const adAccountId = getAdAccountId(tokens);
    const objective = META_OBJECTIVE_MAP[payload.objective] || META_OBJECTIVE_MAP[payload.objective.toLowerCase()];

    if (!objective) {
      return {
        success: false,
        error: `Unsupported campaign objective: ${payload.objective}. Supported: awareness, traffic, engagement, leads, sales, app_promotion`,
      };
    }

    try {
      const body: Record<string, any> = {
        name: payload.name,
        objective,
        status: payload.status,
        special_ad_categories: payload.specialAdCategory ? [payload.specialAdCategory] : [],
        access_token: tokens.accessToken,
      };

      // Set budget at campaign level (Campaign Budget Optimization)
      if (payload.budgetType === 'daily') {
        body.daily_budget = payload.budgetCents;
      } else {
        body.lifetime_budget = payload.budgetCents;
        if (payload.endDate) {
          body.end_time = payload.endDate;
        }
      }

      if (payload.startDate) {
        body.start_time = payload.startDate;
      }

      const data = await metaFetch<{ id: string }>(
        `${GRAPH_API_BASE}/${adAccountId}/campaigns`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        }
      );

      return {
        success: true,
        platformId: data.id,
        metadata: { adAccountId, objective },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create Meta campaign',
      };
    }
  }

  async updateCampaignStatus(
    tokens: AdTokenData,
    platformId: string,
    status: 'ACTIVE' | 'PAUSED'
  ): Promise<void> {
    await metaFetch(
      `${GRAPH_API_BASE}/${platformId}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          access_token: tokens.accessToken,
        }),
      }
    );
  }

  async getCampaignInsights(
    tokens: AdTokenData,
    platformId: string,
    dateRange: { since: string; until: string }
  ): Promise<AdInsights> {
    const currency = (tokens.metadata?.currency as string) || 'USD';

    try {
      const fields = [
        'impressions',
        'reach',
        'frequency',
        'clicks',
        'ctr',
        'spend',
        'cpc',
        'cpm',
        'actions',
        'action_values',
        'video_30_sec_watched_actions',
        'video_p25_watched_actions',
      ].join(',');

      const params = new URLSearchParams({
        fields,
        time_range: JSON.stringify({ since: dateRange.since, until: dateRange.until }),
        access_token: tokens.accessToken,
      });

      const data = await metaFetch<{ data?: Array<Record<string, any>> }>(
        `${GRAPH_API_BASE}/${platformId}/insights?${params}`
      );

      if (!data.data || data.data.length === 0) {
        return buildEmptyInsights(currency);
      }

      const row = data.data[0];
      return parseMetaInsights(row, currency);
    } catch {
      return buildEmptyInsights(currency);
    }
  }

  async createAdSet(tokens: AdTokenData, payload: AdSetPayload): Promise<AdResult> {
    const adAccountId = getAdAccountId(tokens);

    try {
      const targeting: Record<string, any> = {};

      if (payload.targetingConfig.ageMin) targeting.age_min = payload.targetingConfig.ageMin;
      if (payload.targetingConfig.ageMax) targeting.age_max = payload.targetingConfig.ageMax;
      if (payload.targetingConfig.genders && payload.targetingConfig.genders.length > 0) {
        targeting.genders = payload.targetingConfig.genders;
      }

      if (payload.targetingConfig.locations && payload.targetingConfig.locations.length > 0) {
        targeting.geo_locations = {
          countries: payload.targetingConfig.locations
            .filter((loc) => loc.type === 'country')
            .map((loc) => loc.key),
          cities: payload.targetingConfig.locations
            .filter((loc) => loc.type === 'city')
            .map((loc) => ({ key: loc.key, name: loc.name })),
          regions: payload.targetingConfig.locations
            .filter((loc) => loc.type === 'region')
            .map((loc) => ({ key: loc.key, name: loc.name })),
        };
      }

      if (payload.targetingConfig.interests && payload.targetingConfig.interests.length > 0) {
        targeting.flexible_spec = [
          {
            interests: payload.targetingConfig.interests.map((i) => ({
              id: i.id,
              name: i.name,
            })),
          },
        ];

        if (payload.targetingConfig.behaviors && payload.targetingConfig.behaviors.length > 0) {
          targeting.flexible_spec[0].behaviors = payload.targetingConfig.behaviors.map((b) => ({
            id: b.id,
            name: b.name,
          }));
        }
      } else if (payload.targetingConfig.behaviors && payload.targetingConfig.behaviors.length > 0) {
        targeting.flexible_spec = [
          {
            behaviors: payload.targetingConfig.behaviors.map((b) => ({
              id: b.id,
              name: b.name,
            })),
          },
        ];
      }

      if (payload.targetingConfig.customAudiences && payload.targetingConfig.customAudiences.length > 0) {
        targeting.custom_audiences = payload.targetingConfig.customAudiences.map((id) => ({ id }));
      }

      const body: Record<string, any> = {
        campaign_id: payload.campaignPlatformId,
        name: payload.name,
        targeting: JSON.stringify(targeting),
        billing_event: 'IMPRESSIONS',
        optimization_goal: mapBiddingToOptimization(payload.biddingStrategy),
        status: 'PAUSED',
        access_token: tokens.accessToken,
      };

      if (payload.bidAmountCents) {
        body.bid_amount = payload.bidAmountCents;
      }

      if (payload.budgetType === 'daily' && payload.budgetCents) {
        body.daily_budget = payload.budgetCents;
      } else if (payload.budgetType === 'lifetime' && payload.budgetCents) {
        body.lifetime_budget = payload.budgetCents;
      }

      if (payload.startDate) body.start_time = payload.startDate;
      if (payload.endDate) body.end_time = payload.endDate;

      // Handle placements
      if (payload.placements.length > 0 && !payload.placements.includes('automatic')) {
        body.targeting = JSON.stringify({
          ...targeting,
          publisher_platforms: payload.placements,
        });
      }

      const data = await metaFetch<{ id: string }>(
        `${GRAPH_API_BASE}/${adAccountId}/adsets`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        }
      );

      return {
        success: true,
        platformId: data.id,
        metadata: { adAccountId },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create Meta ad set',
      };
    }
  }

  async updateAdSet(
    tokens: AdTokenData,
    platformId: string,
    payload: Partial<AdSetPayload>
  ): Promise<void> {
    const body: Record<string, any> = {
      access_token: tokens.accessToken,
    };

    if (payload.name) body.name = payload.name;
    if (payload.biddingStrategy) body.optimization_goal = mapBiddingToOptimization(payload.biddingStrategy);
    if (payload.bidAmountCents) body.bid_amount = payload.bidAmountCents;
    if (payload.startDate) body.start_time = payload.startDate;
    if (payload.endDate) body.end_time = payload.endDate;

    if (payload.budgetType === 'daily' && payload.budgetCents) {
      body.daily_budget = payload.budgetCents;
    } else if (payload.budgetType === 'lifetime' && payload.budgetCents) {
      body.lifetime_budget = payload.budgetCents;
    }

    await metaFetch(
      `${GRAPH_API_BASE}/${platformId}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }
    );
  }

  async uploadMedia(tokens: AdTokenData, asset: MediaAsset): Promise<{ hash: string }> {
    const adAccountId = getAdAccountId(tokens);

    if (asset.buffer) {
      // Upload from buffer using multipart form data
      const formData = new FormData();
      const blob = new Blob([new Uint8Array(asset.buffer)], { type: asset.mimeType });
      formData.append('filename', blob, asset.filename);
      formData.append('access_token', tokens.accessToken);

      // Determine if image or video
      const isVideo = asset.mimeType.startsWith('video/');
      const endpoint = isVideo
        ? `${GRAPH_API_BASE}/${adAccountId}/advideos`
        : `${GRAPH_API_BASE}/${adAccountId}/adimages`;

      const data = await metaFetch<Record<string, any>>(endpoint, {
        method: 'POST',
        body: formData,
      });

      if (isVideo) {
        return { hash: data.id || data.video_id };
      }

      // For images, the response contains images keyed by filename
      const images = data.images || {};
      const imageData = images[asset.filename] || Object.values(images)[0];
      return { hash: (imageData as any)?.hash || '' };
    }

    if (asset.url) {
      // Upload from URL
      const isVideo = asset.mimeType.startsWith('video/');

      if (isVideo) {
        const data = await metaFetch<{ id: string }>(
          `${GRAPH_API_BASE}/${adAccountId}/advideos`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              file_url: asset.url,
              access_token: tokens.accessToken,
            }),
          }
        );
        return { hash: data.id };
      }

      // For images uploaded by URL
      const data = await metaFetch<Record<string, any>>(
        `${GRAPH_API_BASE}/${adAccountId}/adimages`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: asset.url,
            access_token: tokens.accessToken,
          }),
        }
      );

      const images = data.images || {};
      const imageData = Object.values(images)[0];
      return { hash: (imageData as any)?.hash || '' };
    }

    throw new Error('MediaAsset must have either a url or buffer');
  }

  async createAdCreative(tokens: AdTokenData, payload: CreativePayload): Promise<AdResult> {
    const adAccountId = getAdAccountId(tokens);

    try {
      const objectStorySpec: Record<string, any> = {
        page_id: tokens.metadata?.pageId || tokens.platformAccountId,
        link_data: {
          message: payload.primaryText,
          link: payload.targetUrl,
          name: payload.headline || '',
          description: payload.description || '',
          call_to_action: {
            type: mapCtaType(payload.ctaType),
            value: { link: payload.targetUrl },
          },
        },
      };

      if (payload.displayLink) {
        objectStorySpec.link_data.caption = payload.displayLink;
      }

      if (payload.mediaHashes && payload.mediaHashes.length > 0) {
        // Check if the hash looks like a video ID (numeric) or image hash (hex)
        const firstHash = payload.mediaHashes[0];
        const isVideoId = /^\d+$/.test(firstHash);

        if (isVideoId) {
          objectStorySpec.video_data = {
            video_id: firstHash,
            message: payload.primaryText,
            title: payload.headline || '',
            call_to_action: {
              type: mapCtaType(payload.ctaType),
              value: { link: payload.targetUrl },
            },
          };
          if (payload.thumbnailUrl) {
            objectStorySpec.video_data.image_url = payload.thumbnailUrl;
          }
          delete objectStorySpec.link_data;
        } else {
          objectStorySpec.link_data.image_hash = firstHash;
        }
      }

      const body: Record<string, any> = {
        name: payload.name,
        object_story_spec: JSON.stringify(objectStorySpec),
        access_token: tokens.accessToken,
      };

      const data = await metaFetch<{ id: string }>(
        `${GRAPH_API_BASE}/${adAccountId}/adcreatives`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        }
      );

      return {
        success: true,
        platformId: data.id,
        metadata: { adAccountId },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create Meta ad creative',
      };
    }
  }

  async createAd(
    tokens: AdTokenData,
    adSetPlatformId: string,
    creativePlatformId: string
  ): Promise<AdResult> {
    const adAccountId = getAdAccountId(tokens);

    try {
      const data = await metaFetch<{ id: string }>(
        `${GRAPH_API_BASE}/${adAccountId}/ads`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: `Ad - ${adSetPlatformId}`,
            adset_id: adSetPlatformId,
            creative: { creative_id: creativePlatformId },
            status: 'PAUSED',
            access_token: tokens.accessToken,
          }),
        }
      );

      return {
        success: true,
        platformId: data.id,
        metadata: { adAccountId, adSetId: adSetPlatformId, creativeId: creativePlatformId },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create Meta ad',
      };
    }
  }

  async getAdInsights(
    tokens: AdTokenData,
    platformAdId: string,
    dateRange: { since: string; until: string }
  ): Promise<AdInsights> {
    const currency = (tokens.metadata?.currency as string) || 'USD';

    try {
      const fields = [
        'impressions',
        'reach',
        'frequency',
        'clicks',
        'ctr',
        'spend',
        'cpc',
        'cpm',
        'actions',
        'action_values',
        'cost_per_action_type',
        'video_30_sec_watched_actions',
        'video_p25_watched_actions',
      ].join(',');

      const params = new URLSearchParams({
        fields,
        time_range: JSON.stringify({ since: dateRange.since, until: dateRange.until }),
        access_token: tokens.accessToken,
      });

      const data = await metaFetch<{ data?: Array<Record<string, any>> }>(
        `${GRAPH_API_BASE}/${platformAdId}/insights?${params}`
      );

      if (!data.data || data.data.length === 0) {
        return buildEmptyInsights(currency);
      }

      const row = data.data[0];
      return parseMetaInsights(row, currency);
    } catch {
      return buildEmptyInsights(currency);
    }
  }

  async createCustomAudience(tokens: AdTokenData, payload: AudiencePayload): Promise<AdResult> {
    const adAccountId = getAdAccountId(tokens);

    try {
      const body: Record<string, any> = {
        name: payload.name,
        subtype: payload.audienceType === 'lookalike' ? 'LOOKALIKE' : 'CUSTOM',
        description: payload.description || '',
        access_token: tokens.accessToken,
      };

      if (payload.audienceType === 'custom') {
        body.customer_file_source = payload.customerFileSource || 'USER_PROVIDED_ONLY';
      }

      if (payload.subtype) {
        body.subtype = payload.subtype;
      }

      const data = await metaFetch<{ id: string }>(
        `${GRAPH_API_BASE}/${adAccountId}/customaudiences`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        }
      );

      return {
        success: true,
        platformId: data.id,
        metadata: { adAccountId },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create Meta custom audience',
      };
    }
  }

  async addUsersToAudience(
    tokens: AdTokenData,
    audienceId: string,
    users: CustomerListData[]
  ): Promise<void> {
    // Meta requires hashed PII (SHA256) for customer list uploads
    const schema: string[] = [];
    const hasEmail = users.some((u) => u.email);
    const hasPhone = users.some((u) => u.phone);
    const hasFirstName = users.some((u) => u.firstName);
    const hasLastName = users.some((u) => u.lastName);

    if (hasEmail) schema.push('EMAIL');
    if (hasPhone) schema.push('PHONE');
    if (hasFirstName) schema.push('FN');
    if (hasLastName) schema.push('LN');

    const data = users.map((user) => {
      const row: string[] = [];
      if (hasEmail) row.push(user.email ? sha256(user.email) : '');
      if (hasPhone) row.push(user.phone ? sha256(user.phone.replace(/\D/g, '')) : '');
      if (hasFirstName) row.push(user.firstName ? sha256(user.firstName) : '');
      if (hasLastName) row.push(user.lastName ? sha256(user.lastName) : '');
      return row;
    });

    // Meta allows up to 10,000 users per batch
    const batchSize = 10000;
    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);

      await metaFetch(
        `${GRAPH_API_BASE}/${audienceId}/users`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            payload: {
              schema,
              data: batch,
            },
            access_token: tokens.accessToken,
          }),
        }
      );
    }
  }
}

// --- Helper functions ---

function mapBiddingToOptimization(strategy: string): string {
  const map: Record<string, string> = {
    lowest_cost: 'NONE',
    cost_cap: 'COST_CAP',
    bid_cap: 'BID_CAP',
    reach: 'REACH',
    impressions: 'IMPRESSIONS',
    link_clicks: 'LINK_CLICKS',
    landing_page_views: 'LANDING_PAGE_VIEWS',
    conversions: 'OFFSITE_CONVERSIONS',
    leads: 'LEAD_GENERATION',
    app_installs: 'APP_INSTALLS',
    video_views: 'THRUPLAY',
    engagement: 'POST_ENGAGEMENT',
  };
  return map[strategy.toLowerCase()] || strategy.toUpperCase();
}

function mapCtaType(cta: string): string {
  const map: Record<string, string> = {
    learn_more: 'LEARN_MORE',
    shop_now: 'SHOP_NOW',
    sign_up: 'SIGN_UP',
    book_now: 'BOOK_TRAVEL',
    contact_us: 'CONTACT_US',
    download: 'DOWNLOAD',
    get_offer: 'GET_OFFER',
    get_quote: 'GET_QUOTE',
    subscribe: 'SUBSCRIBE',
    apply_now: 'APPLY_NOW',
    watch_more: 'WATCH_MORE',
    send_message: 'MESSAGE_PAGE',
    whatsapp_message: 'WHATSAPP_MESSAGE',
    no_button: 'NO_BUTTON',
  };
  return map[cta.toLowerCase()] || cta.toUpperCase();
}

function parseMetaInsights(row: Record<string, any>, currency: string): AdInsights {
  const impressions = parseInt(row.impressions || '0', 10);
  const reach = parseInt(row.reach || '0', 10);
  const frequency = parseFloat(row.frequency || '0');
  const clicks = parseInt(row.clicks || '0', 10);
  const ctr = parseFloat(row.ctr || '0');
  const spendCents = Math.round(parseFloat(row.spend || '0') * 100);
  const cpcCents = Math.round(parseFloat(row.cpc || '0') * 100);
  const cpmCents = Math.round(parseFloat(row.cpm || '0') * 100);

  // Extract actions
  const actions: Array<{ action_type: string; value: string }> = row.actions || [];
  const actionValues: Array<{ action_type: string; value: string }> = row.action_values || [];

  const likes = parseInt(
    actions.find((a) => a.action_type === 'like')?.value || '0',
    10
  );
  const comments = parseInt(
    actions.find((a) => a.action_type === 'comment')?.value || '0',
    10
  );
  const shares = parseInt(
    actions.find((a) => a.action_type === 'post')?.value || '0',
    10
  );
  const videoViews = parseInt(
    actions.find((a) => a.action_type === 'video_view')?.value || '0',
    10
  );
  const video3sViews = parseInt(
    (row.video_p25_watched_actions || []).find(
      (a: { action_type: string; value: string }) => a.action_type === 'video_view'
    )?.value || '0',
    10
  );

  // Conversions (purchases, leads, etc.)
  const conversions = parseInt(
    actions.find((a) => a.action_type === 'offsite_conversion.fb_pixel_purchase')?.value ||
    actions.find((a) => a.action_type === 'offsite_conversion.fb_pixel_lead')?.value ||
    '0',
    10
  );

  const conversionValueCents = Math.round(
    parseFloat(
      actionValues.find((a) => a.action_type === 'offsite_conversion.fb_pixel_purchase')?.value || '0'
    ) * 100
  );

  const totalEngagement = likes + comments + shares + clicks;
  const engagementRate = impressions > 0 ? Math.round((totalEngagement / impressions) * 10000) / 100 : 0;

  const cpaCents = conversions > 0 ? Math.round(spendCents / conversions) : null;
  const roas = spendCents > 0 && conversionValueCents > 0
    ? Math.round((conversionValueCents / spendCents) * 100) / 100
    : null;

  return {
    impressions,
    reach,
    frequency,
    clicks,
    likes,
    comments,
    shares,
    saves: 0, // Meta does not expose saves in standard insights
    videoViews,
    video3sViews,
    ctr,
    engagementRate,
    conversions,
    conversionValueCents,
    spendCents,
    currency,
    cpcCents,
    cpmCents,
    cpaCents,
    roas,
  };
}
