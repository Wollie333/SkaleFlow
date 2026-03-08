// ============================================================
// V3 Content Engine — Platform Defaults
// Per-channel format ratios, posting schedules, limits
// ============================================================

import type { ContentFormat } from './content-types';

export type SocialChannel = 'linkedin' | 'facebook' | 'instagram' | 'tiktok' | 'youtube' | 'x';

export type Aggressiveness = 'focused' | 'committed' | 'aggressive';

export interface AggressivenessConfig {
  id: Aggressiveness;
  label: string;
  postsPerWeek: number;
  description: string;
}

export interface PostingLimit {
  maxPerDay: number;
  maxPerWeek: number;
}

export interface PlatformConfig {
  id: SocialChannel;
  label: string;
  icon: string;
  formatRatio: Record<ContentFormat, number>;
  defaultSchedule: Record<string, string[]>; // day → times
  limits: PostingLimit;
  charLimits: { caption: number; hashtags: number };
  supportedFormats: ContentFormat[];
}

// ---- Aggressiveness tiers ----

export const AGGRESSIVENESS_TIERS: Record<Aggressiveness, AggressivenessConfig> = {
  focused: {
    id: 'focused',
    label: 'Focused',
    postsPerWeek: 3,
    description: 'Solo founders running this alongside their business',
  },
  committed: {
    id: 'committed',
    label: 'Committed',
    postsPerWeek: 5,
    description: 'Founders with a small team or dedicated content blocks',
  },
  aggressive: {
    id: 'aggressive',
    label: 'Aggressive',
    postsPerWeek: 8,
    description: 'Teams with production support (designer, editor)',
  },
};

// ---- Platform configs ----

export const PLATFORM_DEFAULTS: Record<SocialChannel, PlatformConfig> = {
  linkedin: {
    id: 'linkedin',
    label: 'LinkedIn',
    icon: 'linkedin',
    formatRatio: {
      reel: 20, static: 20, carousel: 30, text: 30,
      video: 0, long_video: 0, thread: 0, story: 0,
    },
    defaultSchedule: {
      tuesday:   ['08:00', '12:00'],
      wednesday: ['08:00', '12:00'],
      thursday:  ['08:00', '12:00'],
    },
    limits: { maxPerDay: 2, maxPerWeek: 10 },
    charLimits: { caption: 3000, hashtags: 5 },
    supportedFormats: ['text', 'static', 'carousel', 'reel', 'video'],
  },
  facebook: {
    id: 'facebook',
    label: 'Facebook',
    icon: 'facebook',
    formatRatio: {
      reel: 25, static: 25, carousel: 25, text: 25,
      video: 0, long_video: 0, thread: 0, story: 0,
    },
    defaultSchedule: {
      monday:    ['09:00'],
      tuesday:   ['09:00'],
      wednesday: ['09:00', '12:00'],
      thursday:  ['09:00'],
      friday:    ['09:00'],
    },
    limits: { maxPerDay: 3, maxPerWeek: 14 },
    charLimits: { caption: 63206, hashtags: 10 },
    supportedFormats: ['text', 'static', 'carousel', 'reel', 'video', 'story'],
  },
  instagram: {
    id: 'instagram',
    label: 'Instagram',
    icon: 'instagram',
    formatRatio: {
      reel: 40, static: 30, carousel: 30, text: 0,
      video: 0, long_video: 0, thread: 0, story: 0,
    },
    defaultSchedule: {
      monday:    ['11:00'],
      tuesday:   ['11:00', '19:00'],
      wednesday: ['11:00'],
      thursday:  ['11:00', '19:00'],
      friday:    ['11:00'],
    },
    limits: { maxPerDay: 3, maxPerWeek: 14 },
    charLimits: { caption: 2200, hashtags: 30 },
    supportedFormats: ['static', 'carousel', 'reel', 'story'],
  },
  tiktok: {
    id: 'tiktok',
    label: 'TikTok',
    icon: 'tiktok',
    formatRatio: {
      reel: 80, static: 0, carousel: 0, text: 0,
      video: 20, long_video: 0, thread: 0, story: 0,
    },
    defaultSchedule: {
      tuesday:   ['19:00'],
      wednesday: ['19:00'],
      thursday:  ['19:00'],
    },
    limits: { maxPerDay: 4, maxPerWeek: 20 },
    charLimits: { caption: 2200, hashtags: 10 },
    supportedFormats: ['reel', 'video', 'story'],
  },
  youtube: {
    id: 'youtube',
    label: 'YouTube',
    icon: 'youtube',
    formatRatio: {
      reel: 0, static: 0, carousel: 0, text: 0,
      video: 0, long_video: 100, thread: 0, story: 0,
    },
    defaultSchedule: {
      friday:   ['12:00'],
      saturday: ['12:00'],
      sunday:   ['12:00'],
    },
    limits: { maxPerDay: 1, maxPerWeek: 5 },
    charLimits: { caption: 5000, hashtags: 15 },
    supportedFormats: ['long_video', 'reel', 'video'],
  },
  x: {
    id: 'x',
    label: 'X / Twitter',
    icon: 'twitter',
    formatRatio: {
      reel: 0, static: 20, carousel: 10, text: 70,
      video: 0, long_video: 0, thread: 0, story: 0,
    },
    defaultSchedule: {
      monday:    ['08:00', '12:00'],
      tuesday:   ['08:00'],
      wednesday: ['08:00', '12:00'],
      thursday:  ['08:00'],
      friday:    ['08:00'],
    },
    limits: { maxPerDay: 5, maxPerWeek: 25 },
    charLimits: { caption: 280, hashtags: 3 },
    supportedFormats: ['text', 'static', 'carousel', 'reel', 'thread'],
  },
};

// ---- Helpers ----

export function getPostsPerWeek(aggressiveness: Aggressiveness): number {
  return AGGRESSIVENESS_TIERS[aggressiveness].postsPerWeek;
}

export function calculateTotalPosts(
  aggressiveness: Aggressiveness,
  startDate: Date,
  endDate: Date
): number {
  const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  const weeks = Math.ceil((endDate.getTime() - startDate.getTime()) / msPerWeek);
  return weeks * getPostsPerWeek(aggressiveness);
}

export function getPlatform(channel: SocialChannel): PlatformConfig {
  return PLATFORM_DEFAULTS[channel];
}

export const ALL_CHANNELS: SocialChannel[] = ['linkedin', 'facebook', 'instagram', 'tiktok', 'youtube', 'x'];
