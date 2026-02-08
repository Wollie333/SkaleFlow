import type { AdPlatform, AdPlatformAdapter } from '../types';
import { MetaAdsAdapter } from './meta-ads';
import { TikTokAdsAdapter } from './tiktok-ads';

const adapters: Record<AdPlatform, AdPlatformAdapter> = {
  meta: new MetaAdsAdapter(),
  tiktok: new TikTokAdsAdapter(),
};

export function getAdPlatformAdapter(platform: AdPlatform): AdPlatformAdapter {
  const adapter = adapters[platform];
  if (!adapter) {
    throw new Error(`Unsupported ad platform: ${platform}`);
  }
  return adapter;
}
