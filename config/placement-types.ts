import type { SocialPlatform, PlacementType } from '@/types/database';

export interface PlacementOption {
  value: PlacementType;
  label: string;
  description: string;
  requiresMedia: boolean;
  requiresVideo: boolean;
  maxCaptionLength: number;
  aspectRatios: string[];
}

export const PLACEMENT_OPTIONS: Record<SocialPlatform, PlacementOption[]> = {
  facebook: [
    {
      value: 'facebook_feed',
      label: 'Feed Post',
      description: 'Standard feed post with text, images or video',
      requiresMedia: false,
      requiresVideo: false,
      maxCaptionLength: 63206,
      aspectRatios: ['1:1', '4:5', '16:9'],
    },
    {
      value: 'facebook_reel',
      label: 'Reel',
      description: 'Short-form vertical video (up to 90s)',
      requiresMedia: true,
      requiresVideo: true,
      maxCaptionLength: 2200,
      aspectRatios: ['9:16'],
    },
    {
      value: 'facebook_story',
      label: 'Story',
      description: '24-hour vertical content',
      requiresMedia: true,
      requiresVideo: false,
      maxCaptionLength: 250,
      aspectRatios: ['9:16'],
    },
  ],
  instagram: [
    {
      value: 'instagram_feed',
      label: 'Feed Post',
      description: 'Photo or carousel post in the main feed',
      requiresMedia: true,
      requiresVideo: false,
      maxCaptionLength: 2200,
      aspectRatios: ['1:1', '4:5'],
    },
    {
      value: 'instagram_reel',
      label: 'Reel',
      description: 'Short-form vertical video (up to 90s)',
      requiresMedia: true,
      requiresVideo: true,
      maxCaptionLength: 2200,
      aspectRatios: ['9:16'],
    },
    {
      value: 'instagram_story',
      label: 'Story',
      description: '24-hour vertical content with stickers and links',
      requiresMedia: true,
      requiresVideo: false,
      maxCaptionLength: 250,
      aspectRatios: ['9:16'],
    },
  ],
  linkedin: [
    {
      value: 'linkedin_feed',
      label: 'Feed Post',
      description: 'Standard LinkedIn post with text and optional media',
      requiresMedia: false,
      requiresVideo: false,
      maxCaptionLength: 3000,
      aspectRatios: ['1:1', '1.91:1', '4:5'],
    },
    {
      value: 'linkedin_article',
      label: 'Article',
      description: 'Long-form article published on LinkedIn',
      requiresMedia: false,
      requiresVideo: false,
      maxCaptionLength: 120000,
      aspectRatios: ['1.91:1'],
    },
    {
      value: 'linkedin_document',
      label: 'Document',
      description: 'PDF carousel / slide document post',
      requiresMedia: true,
      requiresVideo: false,
      maxCaptionLength: 3000,
      aspectRatios: ['4:3', '16:9'],
    },
  ],
  twitter: [
    {
      value: 'twitter_tweet',
      label: 'Tweet',
      description: 'Single tweet with optional media',
      requiresMedia: false,
      requiresVideo: false,
      maxCaptionLength: 280,
      aspectRatios: ['16:9', '1:1'],
    },
    {
      value: 'twitter_thread',
      label: 'Thread',
      description: 'Multi-tweet thread for longer content',
      requiresMedia: false,
      requiresVideo: false,
      maxCaptionLength: 25000,
      aspectRatios: ['16:9', '1:1'],
    },
  ],
  tiktok: [
    {
      value: 'tiktok_video',
      label: 'Video',
      description: 'Standard TikTok video (up to 10 min)',
      requiresMedia: true,
      requiresVideo: true,
      maxCaptionLength: 2200,
      aspectRatios: ['9:16'],
    },
    {
      value: 'tiktok_story',
      label: 'Story',
      description: '24-hour story content',
      requiresMedia: true,
      requiresVideo: false,
      maxCaptionLength: 150,
      aspectRatios: ['9:16'],
    },
  ],
  youtube: [
    {
      value: 'youtube_video',
      label: 'Video',
      description: 'Standard YouTube video',
      requiresMedia: true,
      requiresVideo: true,
      maxCaptionLength: 5000,
      aspectRatios: ['16:9'],
    },
    {
      value: 'youtube_short',
      label: 'Short',
      description: 'Vertical short-form video (up to 60s)',
      requiresMedia: true,
      requiresVideo: true,
      maxCaptionLength: 100,
      aspectRatios: ['9:16'],
    },
    {
      value: 'youtube_community_post',
      label: 'Community Post',
      description: 'Text or image post in the Community tab',
      requiresMedia: false,
      requiresVideo: false,
      maxCaptionLength: 5000,
      aspectRatios: ['1:1', '16:9'],
    },
  ],
};

export const PLATFORM_LABELS: Record<SocialPlatform, string> = {
  linkedin: 'LinkedIn',
  facebook: 'Facebook',
  instagram: 'Instagram',
  twitter: 'X (Twitter)',
  tiktok: 'TikTok',
  youtube: 'YouTube',
};

export const PLATFORM_ORDER: SocialPlatform[] = [
  'linkedin',
  'facebook',
  'instagram',
  'twitter',
  'tiktok',
  'youtube',
];

export function getPlacementOptions(platform: SocialPlatform): PlacementOption[] {
  return PLACEMENT_OPTIONS[platform] || [];
}

export function getDefaultPlacement(platform: SocialPlatform): PlacementType {
  const options = PLACEMENT_OPTIONS[platform];
  return options[0].value;
}

export function getPlatformFromPlacement(placement: PlacementType): SocialPlatform {
  const prefix = placement.split('_')[0];
  const platformMap: Record<string, SocialPlatform> = {
    facebook: 'facebook',
    instagram: 'instagram',
    linkedin: 'linkedin',
    twitter: 'twitter',
    tiktok: 'tiktok',
    youtube: 'youtube',
  };
  return platformMap[prefix] || 'linkedin';
}

export function getPlacementLabel(placement: PlacementType): string {
  for (const platform of PLATFORM_ORDER) {
    const option = PLACEMENT_OPTIONS[platform].find(o => o.value === placement);
    if (option) return option.label;
  }
  return placement;
}

export function getPlacementConfig(placement: PlacementType): PlacementOption | undefined {
  for (const platform of PLATFORM_ORDER) {
    const option = PLACEMENT_OPTIONS[platform].find(o => o.value === placement);
    if (option) return option;
  }
  return undefined;
}

export interface PlatformPlacementState {
  enabled: boolean;
  placements: Set<PlacementType>;
}

export type PlatformPlacementsMap = Record<SocialPlatform, PlatformPlacementState>;

export function createDefaultPlacementsMap(
  enabledPlatforms?: SocialPlatform[]
): PlatformPlacementsMap {
  const map: PlatformPlacementsMap = {} as PlatformPlacementsMap;
  for (const platform of PLATFORM_ORDER) {
    const enabled = enabledPlatforms ? enabledPlatforms.includes(platform) : false;
    map[platform] = {
      enabled,
      placements: new Set(enabled ? [getDefaultPlacement(platform)] : []),
    };
  }
  return map;
}

export function getSelectedPlacements(map: PlatformPlacementsMap): PlacementType[] {
  const placements: PlacementType[] = [];
  for (const platform of PLATFORM_ORDER) {
    if (map[platform].enabled) {
      map[platform].placements.forEach(p => placements.push(p));
    }
  }
  return placements;
}

export function getEnabledPlatforms(map: PlatformPlacementsMap): SocialPlatform[] {
  return PLATFORM_ORDER.filter(p => map[p].enabled);
}

export function countPlacements(map: PlatformPlacementsMap): { platforms: number; placements: number } {
  let platforms = 0;
  let placements = 0;
  for (const platform of PLATFORM_ORDER) {
    if (map[platform].enabled) {
      platforms++;
      placements += map[platform].placements.size;
    }
  }
  return { platforms, placements };
}
