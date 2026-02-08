import type { SocialPlatform, PlatformAdapter, TokenData } from './types';
import { facebookAdapter } from './platforms/facebook';
import { instagramAdapter } from './platforms/instagram';
import { linkedinAdapter } from './platforms/linkedin';
import { twitterAdapter } from './platforms/twitter';
import { tiktokAdapter } from './platforms/tiktok';

const adapters: Record<SocialPlatform, PlatformAdapter> = {
  facebook: facebookAdapter,
  instagram: instagramAdapter,
  linkedin: linkedinAdapter,
  twitter: twitterAdapter,
  tiktok: tiktokAdapter,
};

export function getAdapter(platform: SocialPlatform): PlatformAdapter {
  const adapter = adapters[platform];
  if (!adapter) {
    throw new Error(`Unsupported platform: ${platform}`);
  }
  return adapter;
}

export function getAuthUrl(platform: SocialPlatform, state: string, redirectUri: string): string {
  return getAdapter(platform).getAuthUrl(state, redirectUri);
}

export function exchangeCode(platform: SocialPlatform, code: string, redirectUri: string): Promise<TokenData> {
  return getAdapter(platform).exchangeCode(code, redirectUri);
}

export function isValidPlatform(platform: string): platform is SocialPlatform {
  return ['linkedin', 'facebook', 'instagram', 'twitter', 'tiktok'].includes(platform);
}

export function getRedirectUri(platform: SocialPlatform): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  return `${baseUrl}/api/integrations/social/${platform}/callback`;
}
