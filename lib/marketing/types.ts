import type { Json } from '@/types/database';

export type AdPlatform = 'meta' | 'tiktok';

export interface AdTokenData {
  accessToken: string;
  refreshToken: string | null;
  expiresAt: Date | null;
  scopes?: string[];
  platformAccountId?: string;
  platformAccountName?: string;
  metadata?: Record<string, unknown>;
}

export interface CampaignPayload {
  name: string;
  objective: string;
  status: 'PAUSED' | 'ACTIVE';
  budgetType: 'daily' | 'lifetime';
  budgetCents: number;
  currency: string;
  startDate?: string;
  endDate?: string;
  specialAdCategory?: string | null;
}

export interface AdSetPayload {
  campaignPlatformId: string;
  name: string;
  targetingConfig: {
    ageMin?: number;
    ageMax?: number;
    genders?: number[];
    locations?: Array<{ key: string; name: string; type: string }>;
    interests?: Array<{ id: string; name: string }>;
    behaviors?: Array<{ id: string; name: string }>;
    customAudiences?: string[];
  };
  placements: string[];
  biddingStrategy: string;
  bidAmountCents?: number;
  budgetType?: string;
  budgetCents?: number;
  startDate?: string;
  endDate?: string;
}

export interface CreativePayload {
  name: string;
  format: string;
  primaryText: string;
  headline?: string;
  description?: string;
  ctaType: string;
  targetUrl: string;
  displayLink?: string;
  mediaHashes?: string[];
  thumbnailUrl?: string;
}

export interface MediaAsset {
  url?: string;
  buffer?: Buffer;
  filename: string;
  mimeType: string;
}

export interface AdResult {
  success: boolean;
  platformId?: string;
  error?: string;
  metadata?: Record<string, unknown>;
}

export interface AdInsights {
  impressions: number;
  reach: number;
  frequency: number;
  clicks: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  videoViews: number;
  video3sViews: number;
  ctr: number;
  engagementRate: number;
  conversions: number;
  conversionValueCents: number;
  spendCents: number;
  currency: string;
  cpcCents: number;
  cpmCents: number;
  cpaCents: number | null;
  roas: number | null;
  metadata?: Record<string, unknown>;
}

export interface AudiencePayload {
  name: string;
  description?: string;
  audienceType: 'custom' | 'lookalike';
  subtype?: string;
  customerFileSource?: string;
}

export interface CustomerListData {
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
}

export interface AdPlatformAdapter {
  platform: AdPlatform;
  // OAuth
  getAuthUrl(state: string, redirectUri: string): string;
  exchangeCode(code: string, redirectUri: string): Promise<AdTokenData>;
  refreshToken(refreshToken: string): Promise<AdTokenData>;
  // Campaign CRUD
  createCampaign(tokens: AdTokenData, payload: CampaignPayload): Promise<AdResult>;
  updateCampaignStatus(tokens: AdTokenData, platformId: string, status: 'ACTIVE' | 'PAUSED'): Promise<void>;
  getCampaignInsights(tokens: AdTokenData, platformId: string, dateRange: { since: string; until: string }): Promise<AdInsights>;
  // Ad Set / Ad Group CRUD
  createAdSet(tokens: AdTokenData, payload: AdSetPayload): Promise<AdResult>;
  updateAdSet(tokens: AdTokenData, platformId: string, payload: Partial<AdSetPayload>): Promise<void>;
  // Creative + Ad CRUD
  uploadMedia(tokens: AdTokenData, asset: MediaAsset): Promise<{ hash: string }>;
  createAdCreative(tokens: AdTokenData, payload: CreativePayload): Promise<AdResult>;
  createAd(tokens: AdTokenData, adSetPlatformId: string, creativePlatformId: string): Promise<AdResult>;
  getAdInsights(tokens: AdTokenData, platformAdId: string, dateRange: { since: string; until: string }): Promise<AdInsights>;
  // Audiences
  createCustomAudience(tokens: AdTokenData, payload: AudiencePayload): Promise<AdResult>;
  addUsersToAudience(tokens: AdTokenData, audienceId: string, users: CustomerListData[]): Promise<void>;
}

export const AD_PLATFORM_CONFIG: Record<AdPlatform, {
  name: string;
  color: string;
  bgColor: string;
  icon: string;
  minAudienceSize: number;
}> = {
  meta: {
    name: 'Meta',
    color: '#1877F2',
    bgColor: '#E7F3FF',
    icon: 'meta',
    minAudienceSize: 100,
  },
  tiktok: {
    name: 'TikTok',
    color: '#000000',
    bgColor: '#F0F0F0',
    icon: 'tiktok',
    minAudienceSize: 1000,
  },
};
