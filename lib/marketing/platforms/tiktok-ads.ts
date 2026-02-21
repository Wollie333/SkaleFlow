import crypto from 'crypto';
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

const TIKTOK_API_BASE = 'https://business-api.tiktok.com/open_api/v1.3';

const TIKTOK_OBJECTIVE_MAP: Record<string, string> = {
  awareness: 'REACH',
  reach: 'REACH',
  traffic: 'TRAFFIC',
  engagement: 'VIDEO_VIEWS',
  video_views: 'VIDEO_VIEWS',
  leads: 'LEAD_GENERATION',
  lead_generation: 'LEAD_GENERATION',
  sales: 'CONVERSIONS',
  conversions: 'CONVERSIONS',
  app_promotion: 'APP_PROMOTION',
  // Allow pass-through for already-mapped values
  REACH: 'REACH',
  TRAFFIC: 'TRAFFIC',
  VIDEO_VIEWS: 'VIDEO_VIEWS',
  LEAD_GENERATION: 'LEAD_GENERATION',
  CONVERSIONS: 'CONVERSIONS',
  APP_PROMOTION: 'APP_PROMOTION',
};

function getTikTokAppId(): string {
  const id = process.env.TIKTOK_ADS_APP_ID;
  if (!id) throw new Error('TIKTOK_ADS_APP_ID environment variable is not set');
  return id;
}

function getTikTokAppSecret(): string {
  const secret = process.env.TIKTOK_ADS_APP_SECRET;
  if (!secret) throw new Error('TIKTOK_ADS_APP_SECRET environment variable is not set');
  return secret;
}

function getAdvertiserId(tokens: AdTokenData): string {
  const advertiserId =
    (tokens.metadata?.advertiserId as string) ||
    tokens.platformAccountId;
  if (!advertiserId) {
    throw new Error('No TikTok advertiser ID found. Please reconnect your ad account.');
  }
  return advertiserId;
}

async function tiktokFetch<T = any>(
  url: string,
  options: RequestInit & { accessToken?: string } = {}
): Promise<T> {
  const { accessToken, ...fetchOptions } = options;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(fetchOptions.headers as Record<string, string> || {}),
  };

  if (accessToken) {
    headers['Access-Token'] = accessToken;
  }

  const res = await fetch(url, { ...fetchOptions, headers });
  const data = await res.json();

  if (data.code !== 0) {
    const msg = data.message || 'TikTok API error';
    throw new Error(`TikTok API error (code ${data.code}): ${msg}`);
  }

  return data.data as T;
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

export class TikTokAdsAdapter implements AdPlatformAdapter {
  platform = 'tiktok' as const;

  getAuthUrl(state: string, redirectUri: string): string {
    const params = new URLSearchParams({
      app_id: getTikTokAppId(),
      redirect_uri: redirectUri,
      state,
      scope: '',
      response_type: 'code',
    });
    return `https://business-api.tiktok.com/portal/auth?${params}`;
  }

  async exchangeCode(code: string, _redirectUri: string): Promise<AdTokenData> {
    const res = await fetch(`${TIKTOK_API_BASE}/oauth2/access_token/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        app_id: getTikTokAppId(),
        secret: getTikTokAppSecret(),
        auth_code: code,
      }),
    });

    const result = await res.json();

    if (result.code !== 0 || !result.data?.access_token) {
      throw new Error(
        result.message || 'Failed to exchange TikTok authorization code'
      );
    }

    const data = result.data;

    // Get advertiser accounts associated with this token
    const advertiserRes = await fetch(
      `${TIKTOK_API_BASE}/oauth2/advertiser/get/?app_id=${getTikTokAppId()}&secret=${getTikTokAppSecret()}&access_token=${data.access_token}`,
      { method: 'GET' }
    );
    const advertiserResult = await advertiserRes.json();

    const advertisers: Array<{ advertiser_id: string; advertiser_name: string }> =
      advertiserResult.data?.list || [];
    const firstAdvertiser = advertisers[0];

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token || null,
      expiresAt: data.access_token_expires_in
        ? new Date(Date.now() + data.access_token_expires_in * 1000)
        : null,
      scopes: data.scope ? data.scope.split(',') : [],
      platformAccountId: firstAdvertiser?.advertiser_id || '',
      platformAccountName: firstAdvertiser?.advertiser_name || 'TikTok Ads',
      metadata: {
        advertiserId: firstAdvertiser?.advertiser_id || '',
        advertiserName: firstAdvertiser?.advertiser_name || '',
        advertisers,
        refreshTokenExpiresIn: data.refresh_token_expires_in,
      },
    };
  }

  async refreshToken(refreshToken: string): Promise<AdTokenData> {
    const res = await fetch(`${TIKTOK_API_BASE}/oauth2/refresh_token/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        app_id: getTikTokAppId(),
        secret: getTikTokAppSecret(),
        refresh_token: refreshToken,
      }),
    });

    const result = await res.json();

    if (result.code !== 0 || !result.data?.access_token) {
      throw new Error(
        result.message || 'Failed to refresh TikTok token'
      );
    }

    const data = result.data;

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token || refreshToken,
      expiresAt: data.access_token_expires_in
        ? new Date(Date.now() + data.access_token_expires_in * 1000)
        : null,
      scopes: data.scope ? data.scope.split(',') : [],
    };
  }

  async createCampaign(tokens: AdTokenData, payload: CampaignPayload): Promise<AdResult> {
    const advertiserId = getAdvertiserId(tokens);
    const objective = TIKTOK_OBJECTIVE_MAP[payload.objective] || TIKTOK_OBJECTIVE_MAP[payload.objective.toLowerCase()];

    if (!objective) {
      return {
        success: false,
        error: `Unsupported campaign objective: ${payload.objective}. Supported: awareness, reach, traffic, engagement, video_views, leads, sales, conversions, app_promotion`,
      };
    }

    try {
      const body: Record<string, any> = {
        advertiser_id: advertiserId,
        campaign_name: payload.name,
        objective_type: objective,
        operation_status: payload.status === 'ACTIVE' ? 'ENABLE' : 'DISABLE',
        budget_mode: payload.budgetType === 'daily' ? 'BUDGET_MODE_DAY' : 'BUDGET_MODE_TOTAL',
        budget: payload.budgetCents / 100, // TikTok uses whole currency units
      };

      if (payload.specialAdCategory) {
        body.special_industries = [payload.specialAdCategory];
      }

      const data = await tiktokFetch<{ campaign_id: string }>(
        `${TIKTOK_API_BASE}/campaign/create/`,
        {
          method: 'POST',
          accessToken: tokens.accessToken,
          body: JSON.stringify(body),
        }
      );

      return {
        success: true,
        platformId: data.campaign_id,
        metadata: { advertiserId, objective },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create TikTok campaign',
      };
    }
  }

  async updateCampaignStatus(
    tokens: AdTokenData,
    platformId: string,
    status: 'ACTIVE' | 'PAUSED'
  ): Promise<void> {
    const advertiserId = getAdvertiserId(tokens);

    await tiktokFetch(
      `${TIKTOK_API_BASE}/campaign/status/update/`,
      {
        method: 'POST',
        accessToken: tokens.accessToken,
        body: JSON.stringify({
          advertiser_id: advertiserId,
          campaign_ids: [platformId],
          operation_status: status === 'ACTIVE' ? 'ENABLE' : 'DISABLE',
        }),
      }
    );
  }

  async getCampaignInsights(
    tokens: AdTokenData,
    platformId: string,
    dateRange: { since: string; until: string }
  ): Promise<AdInsights> {
    const advertiserId = getAdvertiserId(tokens);
    const currency = (tokens.metadata?.currency as string) || 'USD';

    try {
      const metrics = [
        'spend',
        'impressions',
        'reach',
        'frequency',
        'clicks',
        'ctr',
        'cpc',
        'cpm',
        'likes',
        'comments',
        'shares',
        'follows',
        'video_views_p25',
        'video_views_p50',
        'video_views_p75',
        'video_play_actions',
        'conversion',
        'cost_per_conversion',
        'conversion_rate',
        'total_purchase_value',
      ];

      const params = new URLSearchParams({
        advertiser_id: advertiserId,
        service_type: 'AUCTION',
        report_type: 'BASIC',
        data_level: 'AUCTION_CAMPAIGN',
        dimensions: JSON.stringify(['campaign_id']),
        metrics: JSON.stringify(metrics),
        start_date: dateRange.since,
        end_date: dateRange.until,
        filtering: JSON.stringify([
          { field_name: 'campaign_ids', filter_type: 'IN', filter_value: JSON.stringify([platformId]) },
        ]),
        page_size: '1',
      });

      const data = await tiktokFetch<{ list?: Array<{ metrics: Record<string, any> }> }>(
        `${TIKTOK_API_BASE}/report/integrated/get/?${params}`,
        { method: 'GET', accessToken: tokens.accessToken }
      );

      if (!data.list || data.list.length === 0) {
        return buildEmptyInsights(currency);
      }

      const row = data.list[0].metrics;
      return parseTikTokInsights(row, currency);
    } catch {
      return buildEmptyInsights(currency);
    }
  }

  async createAdSet(tokens: AdTokenData, payload: AdSetPayload): Promise<AdResult> {
    const advertiserId = getAdvertiserId(tokens);

    try {
      const body: Record<string, any> = {
        advertiser_id: advertiserId,
        campaign_id: payload.campaignPlatformId,
        adgroup_name: payload.name,
        placement_type: payload.placements.includes('automatic') ? 'PLACEMENT_TYPE_AUTOMATIC' : 'PLACEMENT_TYPE_NORMAL',
        billing_event: 'CPC',
        optimization_goal: mapTikTokOptimization(payload.biddingStrategy),
        bid_type: payload.bidAmountCents ? 'BID_TYPE_CUSTOM' : 'BID_TYPE_NO_BID',
        operation_status: 'DISABLE',
      };

      // Budget
      if (payload.budgetType === 'daily' && payload.budgetCents) {
        body.budget_mode = 'BUDGET_MODE_DAY';
        body.budget = payload.budgetCents / 100;
      } else if (payload.budgetType === 'lifetime' && payload.budgetCents) {
        body.budget_mode = 'BUDGET_MODE_TOTAL';
        body.budget = payload.budgetCents / 100;
      }

      if (payload.bidAmountCents) {
        body.bid_price = payload.bidAmountCents / 100;
      }

      // Schedule
      if (payload.startDate) body.schedule_start_time = payload.startDate;
      if (payload.endDate) {
        body.schedule_end_time = payload.endDate;
        body.schedule_type = 'SCHEDULE_START_END';
      } else {
        body.schedule_type = 'SCHEDULE_FROM_NOW';
      }

      // Targeting
      const targeting: Record<string, any> = {};

      if (payload.targetingConfig.ageMin || payload.targetingConfig.ageMax) {
        targeting.age_groups = buildTikTokAgeGroups(
          payload.targetingConfig.ageMin || 13,
          payload.targetingConfig.ageMax || 65
        );
      }

      if (payload.targetingConfig.genders && payload.targetingConfig.genders.length > 0) {
        // TikTok: GENDER_MALE, GENDER_FEMALE, or omit for all
        const genderMap: Record<number, string> = { 1: 'GENDER_MALE', 2: 'GENDER_FEMALE' };
        const mapped = payload.targetingConfig.genders
          .map((g) => genderMap[g])
          .filter(Boolean);
        if (mapped.length === 1) {
          targeting.gender = mapped[0];
        }
      }

      if (payload.targetingConfig.locations && payload.targetingConfig.locations.length > 0) {
        targeting.location_ids = payload.targetingConfig.locations.map((loc) => loc.key);
      }

      if (payload.targetingConfig.interests && payload.targetingConfig.interests.length > 0) {
        targeting.interest_category_ids = payload.targetingConfig.interests.map((i) => i.id);
      }

      if (payload.targetingConfig.behaviors && payload.targetingConfig.behaviors.length > 0) {
        targeting.action_category_ids = payload.targetingConfig.behaviors.map((b) => b.id);
      }

      if (payload.targetingConfig.customAudiences && payload.targetingConfig.customAudiences.length > 0) {
        targeting.audience_ids = payload.targetingConfig.customAudiences;
      }

      // Manual placements
      if (!payload.placements.includes('automatic') && payload.placements.length > 0) {
        body.placements = payload.placements.map((p) => mapTikTokPlacement(p));
      }

      body.targeting = targeting;

      const data = await tiktokFetch<{ adgroup_id: string }>(
        `${TIKTOK_API_BASE}/adgroup/create/`,
        {
          method: 'POST',
          accessToken: tokens.accessToken,
          body: JSON.stringify(body),
        }
      );

      return {
        success: true,
        platformId: data.adgroup_id,
        metadata: { advertiserId },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create TikTok ad group',
      };
    }
  }

  async updateAdSet(
    tokens: AdTokenData,
    platformId: string,
    payload: Partial<AdSetPayload>
  ): Promise<void> {
    const advertiserId = getAdvertiserId(tokens);

    const body: Record<string, any> = {
      advertiser_id: advertiserId,
      adgroup_id: platformId,
    };

    if (payload.name) body.adgroup_name = payload.name;
    if (payload.bidAmountCents) body.bid_price = payload.bidAmountCents / 100;
    if (payload.biddingStrategy) body.optimization_goal = mapTikTokOptimization(payload.biddingStrategy);
    if (payload.startDate) body.schedule_start_time = payload.startDate;
    if (payload.endDate) body.schedule_end_time = payload.endDate;

    if (payload.budgetType === 'daily' && payload.budgetCents) {
      body.budget_mode = 'BUDGET_MODE_DAY';
      body.budget = payload.budgetCents / 100;
    } else if (payload.budgetType === 'lifetime' && payload.budgetCents) {
      body.budget_mode = 'BUDGET_MODE_TOTAL';
      body.budget = payload.budgetCents / 100;
    }

    await tiktokFetch(
      `${TIKTOK_API_BASE}/adgroup/update/`,
      {
        method: 'POST',
        accessToken: tokens.accessToken,
        body: JSON.stringify(body),
      }
    );
  }

  async uploadMedia(tokens: AdTokenData, asset: MediaAsset): Promise<{ hash: string }> {
    const advertiserId = getAdvertiserId(tokens);
    const isVideo = asset.mimeType.startsWith('video/');

    if (asset.url) {
      // Upload via URL
      const endpoint = isVideo
        ? `${TIKTOK_API_BASE}/file/video/ad/upload/`
        : `${TIKTOK_API_BASE}/file/image/ad/upload/`;

      const body: Record<string, any> = {
        advertiser_id: advertiserId,
        upload_type: 'UPLOAD_BY_URL',
        ...(isVideo
          ? { video_url: asset.url, file_name: asset.filename }
          : { image_url: asset.url, file_name: asset.filename }),
      };

      const data = await tiktokFetch<Record<string, any>>(endpoint, {
        method: 'POST',
        accessToken: tokens.accessToken,
        body: JSON.stringify(body),
      });

      return { hash: data.video_id || data.image_id || data.id || '' };
    }

    if (asset.buffer) {
      // Upload via file (multipart)
      const endpoint = isVideo
        ? `${TIKTOK_API_BASE}/file/video/ad/upload/`
        : `${TIKTOK_API_BASE}/file/image/ad/upload/`;

      const formData = new FormData();
      formData.append('advertiser_id', advertiserId);
      formData.append('upload_type', 'UPLOAD_BY_FILE');

      const blob = new Blob([new Uint8Array(asset.buffer)], { type: asset.mimeType });

      if (isVideo) {
        formData.append('video_file', blob, asset.filename);
      } else {
        formData.append('image_file', blob, asset.filename);
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Access-Token': tokens.accessToken },
        body: formData,
      });

      const result = await res.json();

      if (result.code !== 0) {
        throw new Error(`TikTok upload error (code ${result.code}): ${result.message}`);
      }

      return {
        hash: result.data?.video_id || result.data?.image_id || result.data?.id || '',
      };
    }

    throw new Error('MediaAsset must have either a url or buffer');
  }

  async createAdCreative(tokens: AdTokenData, payload: CreativePayload): Promise<AdResult> {
    // TikTok does not have a separate "creative" entity like Meta.
    // Creatives are embedded in the ad creation step.
    // We store the creative config and return a synthetic ID for later use.
    const creativeId = `tiktok_creative_${Date.now()}`;

    return {
      success: true,
      platformId: creativeId,
      metadata: {
        name: payload.name,
        format: payload.format,
        primaryText: payload.primaryText,
        headline: payload.headline,
        description: payload.description,
        ctaType: payload.ctaType,
        targetUrl: payload.targetUrl,
        displayLink: payload.displayLink,
        mediaHashes: payload.mediaHashes,
        thumbnailUrl: payload.thumbnailUrl,
      },
    };
  }

  async createAd(
    tokens: AdTokenData,
    adSetPlatformId: string,
    creativePlatformId: string
  ): Promise<AdResult> {
    const advertiserId = getAdvertiserId(tokens);

    try {
      // Parse creative metadata if it was stored from createAdCreative
      // In practice, the caller should pass the creative payload data alongside
      const body: Record<string, any> = {
        advertiser_id: advertiserId,
        adgroup_id: adSetPlatformId,
        ad_name: `Ad - ${adSetPlatformId}`,
        ad_format: 'SINGLE_VIDEO',
        operation_status: 'DISABLE',
        creatives: [
          {
            ad_name: `Ad - ${adSetPlatformId}`,
            display_name: tokens.platformAccountName || 'SkaleFlow Ad',
            ad_format: 'SINGLE_VIDEO',
            // The creative platform ID in TikTok's case holds the video_id
            video_id: creativePlatformId.startsWith('tiktok_creative_')
              ? undefined
              : creativePlatformId,
            call_to_action: 'LEARN_MORE',
          },
        ],
      };

      const data = await tiktokFetch<{ ad_ids?: string[]; ad_id?: string }>(
        `${TIKTOK_API_BASE}/ad/create/`,
        {
          method: 'POST',
          accessToken: tokens.accessToken,
          body: JSON.stringify(body),
        }
      );

      const adId = data.ad_ids?.[0] || data.ad_id || '';

      return {
        success: true,
        platformId: adId,
        metadata: { advertiserId, adGroupId: adSetPlatformId },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create TikTok ad',
      };
    }
  }

  async getAdInsights(
    tokens: AdTokenData,
    platformAdId: string,
    dateRange: { since: string; until: string }
  ): Promise<AdInsights> {
    const advertiserId = getAdvertiserId(tokens);
    const currency = (tokens.metadata?.currency as string) || 'USD';

    try {
      const metrics = [
        'spend',
        'impressions',
        'reach',
        'frequency',
        'clicks',
        'ctr',
        'cpc',
        'cpm',
        'likes',
        'comments',
        'shares',
        'video_play_actions',
        'video_views_p25',
        'conversion',
        'cost_per_conversion',
        'total_purchase_value',
      ];

      const params = new URLSearchParams({
        advertiser_id: advertiserId,
        service_type: 'AUCTION',
        report_type: 'BASIC',
        data_level: 'AUCTION_AD',
        dimensions: JSON.stringify(['ad_id']),
        metrics: JSON.stringify(metrics),
        start_date: dateRange.since,
        end_date: dateRange.until,
        filtering: JSON.stringify([
          { field_name: 'ad_ids', filter_type: 'IN', filter_value: JSON.stringify([platformAdId]) },
        ]),
        page_size: '1',
      });

      const data = await tiktokFetch<{ list?: Array<{ metrics: Record<string, any> }> }>(
        `${TIKTOK_API_BASE}/report/integrated/get/?${params}`,
        { method: 'GET', accessToken: tokens.accessToken }
      );

      if (!data.list || data.list.length === 0) {
        return buildEmptyInsights(currency);
      }

      const row = data.list[0].metrics;
      return parseTikTokInsights(row, currency);
    } catch {
      return buildEmptyInsights(currency);
    }
  }

  async createCustomAudience(tokens: AdTokenData, payload: AudiencePayload): Promise<AdResult> {
    const advertiserId = getAdvertiserId(tokens);

    try {
      const body: Record<string, any> = {
        advertiser_id: advertiserId,
        custom_audience_name: payload.name,
      };

      if (payload.audienceType === 'lookalike') {
        body.audience_type = 'LOOKALIKE';
        body.lookalike_spec = {
          is_auto_audience: true,
        };
      } else {
        body.audience_type = 'CUSTOMER_FILE';
        body.file_paths = []; // Will be populated when users are added
      }

      const data = await tiktokFetch<{ audience_id: string }>(
        `${TIKTOK_API_BASE}/dmp/custom_audience/create/`,
        {
          method: 'POST',
          accessToken: tokens.accessToken,
          body: JSON.stringify(body),
        }
      );

      return {
        success: true,
        platformId: data.audience_id,
        metadata: { advertiserId },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create TikTok custom audience',
      };
    }
  }

  async addUsersToAudience(
    tokens: AdTokenData,
    audienceId: string,
    users: CustomerListData[]
  ): Promise<void> {
    const advertiserId = getAdvertiserId(tokens);

    // TikTok supports: EMAIL_SHA256, PHONE_SHA256, IDFA_SHA256, GAID_SHA256
    // We build separate arrays for each identifier type
    const emails: string[] = [];
    const phones: string[] = [];

    for (const user of users) {
      if (user.email) {
        emails.push(crypto.createHash('sha256').update(user.email.trim().toLowerCase()).digest('hex'));
      }
      if (user.phone) {
        phones.push(crypto.createHash('sha256').update(user.phone.replace(/\D/g, '')).digest('hex'));
      }
    }

    const filePayloads: Array<{ id_type: string; id_list: string[] }> = [];

    if (emails.length > 0) {
      filePayloads.push({ id_type: 'EMAIL_SHA256', id_list: emails });
    }
    if (phones.length > 0) {
      filePayloads.push({ id_type: 'PHONE_SHA256', id_list: phones });
    }

    // TikTok recommends batches of up to 50,000 records
    const batchSize = 50000;

    for (const filePayload of filePayloads) {
      for (let i = 0; i < filePayload.id_list.length; i += batchSize) {
        const batch = filePayload.id_list.slice(i, i + batchSize);

        await tiktokFetch(
          `${TIKTOK_API_BASE}/dmp/custom_audience/update/`,
          {
            method: 'POST',
            accessToken: tokens.accessToken,
            body: JSON.stringify({
              advertiser_id: advertiserId,
              custom_audience_id: audienceId,
              action: 'APPEND',
              id_type: filePayload.id_type,
              id_list: batch,
            }),
          }
        );
      }
    }
  }
}

// --- Helper functions ---

function mapTikTokOptimization(strategy: string): string {
  const map: Record<string, string> = {
    lowest_cost: 'NONE',
    clicks: 'CLICK',
    link_clicks: 'CLICK',
    conversions: 'CONVERT',
    reach: 'SHOW',
    impressions: 'SHOW',
    video_views: 'VIDEO_VIEW',
    leads: 'LEAD_GENERATION',
    app_installs: 'INSTALL',
    engagement: 'ENGAGE',
  };
  return map[strategy.toLowerCase()] || strategy.toUpperCase();
}

function mapTikTokPlacement(placement: string): string {
  const map: Record<string, string> = {
    tiktok: 'PLACEMENT_TIKTOK',
    pangle: 'PLACEMENT_PANGLE',
    global_app_bundle: 'PLACEMENT_GLOBAL_APP_BUNDLE',
  };
  return map[placement.toLowerCase()] || placement.toUpperCase();
}

function buildTikTokAgeGroups(min: number, max: number): string[] {
  // TikTok uses predefined age group strings
  const groups: Array<{ key: string; low: number; high: number }> = [
    { key: 'AGE_13_17', low: 13, high: 17 },
    { key: 'AGE_18_24', low: 18, high: 24 },
    { key: 'AGE_25_34', low: 25, high: 34 },
    { key: 'AGE_35_44', low: 35, high: 44 },
    { key: 'AGE_45_54', low: 45, high: 54 },
    { key: 'AGE_55_100', low: 55, high: 100 },
  ];

  return groups
    .filter((g) => g.low <= max && g.high >= min)
    .map((g) => g.key);
}

function parseTikTokInsights(row: Record<string, any>, currency: string): AdInsights {
  const impressions = parseInt(row.impressions || '0', 10);
  const reach = parseInt(row.reach || '0', 10);
  const frequency = parseFloat(row.frequency || '0');
  const clicks = parseInt(row.clicks || '0', 10);
  const ctr = parseFloat(row.ctr || '0');
  const spendCents = Math.round(parseFloat(row.spend || '0') * 100);
  const cpcCents = Math.round(parseFloat(row.cpc || '0') * 100);
  const cpmCents = Math.round(parseFloat(row.cpm || '0') * 100);

  const likes = parseInt(row.likes || '0', 10);
  const comments = parseInt(row.comments || '0', 10);
  const shares = parseInt(row.shares || '0', 10);
  const videoViews = parseInt(row.video_play_actions || '0', 10);
  const video3sViews = parseInt(row.video_views_p25 || '0', 10);

  const conversions = parseInt(row.conversion || '0', 10);
  const conversionValueCents = Math.round(parseFloat(row.total_purchase_value || '0') * 100);

  const totalEngagement = likes + comments + shares + clicks;
  const engagementRate = impressions > 0
    ? Math.round((totalEngagement / impressions) * 10000) / 100
    : 0;

  const cpaCents = conversions > 0
    ? Math.round(parseFloat(row.cost_per_conversion || '0') * 100)
    : null;

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
    saves: 0, // TikTok Ads API does not expose saves in standard reporting
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
