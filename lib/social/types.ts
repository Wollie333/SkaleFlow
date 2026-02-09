import type { SocialPlatform, PublishStatus } from '@/types/database';

export type { SocialPlatform, PublishStatus };

export interface TokenData {
  accessToken: string;
  refreshToken: string | null;
  expiresAt: Date | null;
  scopes?: string[];
  platformUserId?: string;
  platformUsername?: string;
  platformPageId?: string;
  platformPageName?: string;
  metadata?: Record<string, unknown>;
}

export interface PostPayload {
  text: string;
  caption?: string;
  hashtags?: string[];
  mediaUrls?: string[];
  link?: string;
  thumbnailUrl?: string;
}

export interface PublishResult {
  success: boolean;
  platformPostId?: string;
  postUrl?: string;
  error?: string;
  metadata?: Record<string, unknown>;
}

export interface AnalyticsData {
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  impressions: number;
  reach: number;
  clicks: number;
  videoViews: number;
  engagementRate: number;
  metadata?: Record<string, unknown>;
}

export interface PlatformAdapter {
  platform: SocialPlatform;
  getAuthUrl(state: string, redirectUri: string): string;
  exchangeCode(code: string, redirectUri: string, codeVerifier?: string): Promise<TokenData>;
  refreshToken(refreshToken: string): Promise<TokenData>;
  publishPost(tokens: TokenData, post: PostPayload): Promise<PublishResult>;
  getPostAnalytics(tokens: TokenData, postId: string): Promise<AnalyticsData>;
  revokeAccess(tokens: TokenData): Promise<void>;
}

export interface SocialConnection {
  id: string;
  organizationId: string;
  platform: SocialPlatform;
  platformUsername: string | null;
  platformPageName: string | null;
  isActive: boolean;
  connectedAt: string;
  tokenExpiresAt: string | null;
}

export const PLATFORM_CONFIG: Record<SocialPlatform, {
  name: string;
  color: string;
  bgColor: string;
  maxCaptionLength?: number;
  requiresImage?: boolean;
  requiresVideo?: boolean;
}> = {
  linkedin: {
    name: 'LinkedIn',
    color: '#0A66C2',
    bgColor: 'bg-[#0A66C2]',
    maxCaptionLength: 3000,
  },
  facebook: {
    name: 'Facebook',
    color: '#1877F2',
    bgColor: 'bg-[#1877F2]',
    maxCaptionLength: 63206,
  },
  instagram: {
    name: 'Instagram',
    color: '#E4405F',
    bgColor: 'bg-[#E4405F]',
    requiresImage: true,
    maxCaptionLength: 2200,
  },
  twitter: {
    name: 'X (Twitter)',
    color: '#000000',
    bgColor: 'bg-black',
    maxCaptionLength: 280,
  },
  tiktok: {
    name: 'TikTok',
    color: '#000000',
    bgColor: 'bg-black',
    requiresVideo: true,
    maxCaptionLength: 2200,
  },
};
