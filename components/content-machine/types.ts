import type { ContentFormat } from '@/config/script-frameworks';
import type { FunnelStage, StoryBrandStage, PlacementType, SocialPlatform } from '@/types/database';

export interface SharedConfig {
  format: ContentFormat;
  funnelStage: FunnelStage;
  storybrandStage: StoryBrandStage;
}

export interface PlacementConfig {
  format?: ContentFormat;
  funnelStage?: FunnelStage;
  storybrandStage?: StoryBrandStage;
}

export interface GeneratedItem {
  id: string;
  caption: string | null;
  hashtags: string[] | null;
  topic: string | null;
  media_urls: string[] | null;
  status: string;
  platforms: string[] | null;
  format: string | null;
  funnel_stage: string | null;
  storybrand_stage: string | null;
  scheduled_date: string | null;
}

export interface EditFields {
  caption?: string;
  hashtags?: string;
  topic?: string;
}

export type ContentType = 'social' | null;

export type ContentMachineType = 'social' | 'blog' | 'email' | 'ads' | 'video-scripts' | 'landing-pages';

export type ModalAction = 'draft' | 'schedule' | 'publish' | 'decline';

export interface PlacementEntry {
  platform: SocialPlatform;
  placement: PlacementType;
}
