// Parses raw presence outputs into structured data for the playbook

import type { PlatformKey } from '@/types/presence';
import { PLATFORM_CONFIGS } from '@/config/platform-configs';

export interface ParsedPresencePlaybook {
  strategy: {
    activePlatforms: string[];
    platformGoals: Record<string, string>;
    timeCommitment: string;
    northStar: string;
    strategySummary: string;
  };
  platforms: Record<string, ParsedPlatformProfile>;
  audit: {
    consistencyScore: number;
    consistencyBreakdown: unknown;
    priorityPlatform: string;
    thirtyDayPlan: string;
    universalCta: string;
    quickWins: unknown;
    gapSummary: string;
  };
}

export interface ParsedPlatformProfile {
  platformKey: PlatformKey;
  platformName: string;
  fields: Record<string, unknown>;
  completionScore: number | null;
}

export function parsePresenceOutputs(
  outputs: Array<{ output_key: string; output_value: unknown }>
): ParsedPresencePlaybook {
  const map: Record<string, unknown> = {};
  for (const o of outputs) {
    map[o.output_key] = o.output_value;
  }

  // Strategy (Phase 1)
  const strategy = {
    activePlatforms: parseArray(map.presence_platforms_active),
    platformGoals: parseObject(map.presence_platform_goals),
    timeCommitment: String(map.presence_time_commitment || ''),
    northStar: String(map.presence_north_star || ''),
    strategySummary: String(map.presence_strategy_summary || ''),
  };

  // Platform profiles
  const platforms: Record<string, ParsedPlatformProfile> = {};

  // LinkedIn
  if (hasAnyKey(map, 'linkedin_')) {
    platforms.linkedin = {
      platformKey: 'linkedin',
      platformName: 'LinkedIn',
      fields: extractPrefixed(map, 'linkedin_'),
      completionScore: parseNumber(map.linkedin_completion_score),
    };
  }

  // Facebook
  if (hasAnyKey(map, 'facebook_')) {
    platforms.facebook = {
      platformKey: 'facebook',
      platformName: 'Facebook',
      fields: extractPrefixed(map, 'facebook_'),
      completionScore: parseNumber(map.facebook_completion_score),
    };
  }

  // Instagram
  if (hasAnyKey(map, 'instagram_')) {
    platforms.instagram = {
      platformKey: 'instagram',
      platformName: 'Instagram',
      fields: extractPrefixed(map, 'instagram_'),
      completionScore: parseNumber(map.instagram_completion_score),
    };
  }

  // Google My Business
  if (hasAnyKey(map, 'gmb_')) {
    platforms.google_my_business = {
      platformKey: 'google_my_business',
      platformName: 'Google Business',
      fields: extractPrefixed(map, 'gmb_'),
      completionScore: parseNumber(map.gmb_completion_score),
    };
  }

  // YouTube
  if (hasAnyKey(map, 'youtube_')) {
    platforms.youtube = {
      platformKey: 'youtube',
      platformName: 'YouTube',
      fields: extractPrefixed(map, 'youtube_'),
      completionScore: null,
    };
  }

  // TikTok
  if (hasAnyKey(map, 'tiktok_')) {
    platforms.tiktok = {
      platformKey: 'tiktok',
      platformName: 'TikTok',
      fields: extractPrefixed(map, 'tiktok_'),
      completionScore: null,
    };
  }

  // Video completion score applies to both
  const videoScore = parseNumber(map.video_completion_score);
  if (platforms.youtube) platforms.youtube.completionScore = videoScore;
  if (platforms.tiktok) platforms.tiktok.completionScore = videoScore;

  // Audit (Phase 7)
  const audit = {
    consistencyScore: parseNumber(map.presence_consistency_score) || 0,
    consistencyBreakdown: map.presence_consistency_breakdown || null,
    priorityPlatform: String(map.presence_priority_platform || ''),
    thirtyDayPlan: String(map.presence_30day_plan || ''),
    universalCta: String(map.presence_universal_cta || ''),
    quickWins: map.presence_quick_wins || null,
    gapSummary: String(map.presence_gap_summary || ''),
  };

  return { strategy, platforms, audit };
}

function parseArray(val: unknown): string[] {
  if (Array.isArray(val)) return val.map(String);
  if (typeof val === 'string') {
    try { return JSON.parse(val); } catch { return [val]; }
  }
  return [];
}

function parseObject(val: unknown): Record<string, string> {
  if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
    const result: Record<string, string> = {};
    for (const [k, v] of Object.entries(val)) {
      result[k] = String(v);
    }
    return result;
  }
  if (typeof val === 'string') {
    try { return JSON.parse(val); } catch { return {}; }
  }
  return {};
}

function parseNumber(val: unknown): number | null {
  if (typeof val === 'number') return val;
  if (typeof val === 'string') {
    const n = parseInt(val, 10);
    return isNaN(n) ? null : n;
  }
  return null;
}

function hasAnyKey(map: Record<string, unknown>, prefix: string): boolean {
  return Object.keys(map).some(k => k.startsWith(prefix) && map[k] !== null && map[k] !== undefined);
}

function extractPrefixed(map: Record<string, unknown>, prefix: string): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(map)) {
    if (k.startsWith(prefix) && v !== null && v !== undefined) {
      // Remove prefix for cleaner field names
      const fieldName = k.replace(prefix, '');
      result[fieldName] = v;
    }
  }
  return result;
}
