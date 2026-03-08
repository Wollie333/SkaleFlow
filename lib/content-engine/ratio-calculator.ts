// ============================================================
// V3 Content Engine — Ratio Calculator
// Distributes posts across dates based on objective ratios,
// aggressiveness, and platform format ratios
// ============================================================

import { CAMPAIGN_OBJECTIVES, type CampaignObjectiveId, type ContentTypeRatio } from '@/config/campaign-objectives';
import { CONTENT_TYPES, type ContentTypeId, type ContentFormat } from '@/config/content-types';
import { PLATFORM_DEFAULTS, AGGRESSIVENESS_TIERS, type SocialChannel, type Aggressiveness } from '@/config/platform-defaults';

export interface AdSetInput {
  id: string;
  channel: SocialChannel;
  aggressiveness: Aggressiveness;
  contentTypeRatio?: ContentTypeRatio;  // override defaults
  formatRatio?: Record<ContentFormat, number>; // override defaults
  postingSchedule?: Record<string, string[]>;  // override defaults
}

export interface PostSlot {
  adsetId: string;
  platform: SocialChannel;
  contentType: ContentTypeId;
  contentTypeName: string;
  format: ContentFormat;
  scheduledDate: string;  // YYYY-MM-DD
  scheduledTime: string;  // HH:MM
  generationWeek: number; // 1-5
  objective: string;
}

interface DateTimeSlot {
  date: string;
  time: string;
}

// ---- Main entry point ----

export function calculatePostDistribution(
  objective: CampaignObjectiveId,
  adsets: AdSetInput[],
  startDate: Date,
  endDate: Date
): PostSlot[] {
  const allSlots: PostSlot[] = [];

  for (const adset of adsets) {
    const slots = calculateAdSetSlots(objective, adset, startDate, endDate);
    allSlots.push(...slots);
  }

  return allSlots;
}

// ---- Per ad-set calculation ----

function calculateAdSetSlots(
  objective: CampaignObjectiveId,
  adset: AdSetInput,
  startDate: Date,
  endDate: Date
): PostSlot[] {
  const objectiveConfig = CAMPAIGN_OBJECTIVES[objective];
  const platformConfig = PLATFORM_DEFAULTS[adset.channel];
  const aggressiveness = AGGRESSIVENESS_TIERS[adset.aggressiveness];

  // Determine total posts
  const totalWeeks = Math.max(1, Math.ceil(daysBetween(startDate, endDate) / 7));
  const totalPosts = totalWeeks * aggressiveness.postsPerWeek;

  // Get ratios (user override or objective default)
  const typeRatio = adset.contentTypeRatio || objectiveConfig.defaultRatio;
  const formatRatio = adset.formatRatio || platformConfig.formatRatio;
  const schedule = adset.postingSchedule || platformConfig.defaultSchedule;

  // Distribute posts by content type
  const typeCounts = distributeByRatio(typeRatio, totalPosts);

  // Build date/time slots from schedule
  const dateTimeSlots = buildDateTimeSlots(startDate, endDate, schedule, platformConfig.limits.maxPerDay);

  // Assign content types + formats to slots
  const slots: PostSlot[] = [];
  const typeQueue = buildTypeQueue(typeCounts);
  const formatWeights = normalizeFormatRatio(formatRatio, platformConfig.supportedFormats);

  for (let i = 0; i < Math.min(typeQueue.length, dateTimeSlots.length); i++) {
    const contentType = typeQueue[i];
    const dt = dateTimeSlots[i];
    const format = pickFormat(contentType, formatWeights, platformConfig.supportedFormats);
    const week = Math.min(5, Math.ceil((daysBetween(startDate, parseDate(dt.date)) + 1) / 7));

    slots.push({
      adsetId: adset.id,
      platform: adset.channel,
      contentType,
      contentTypeName: CONTENT_TYPES[contentType].name,
      format,
      scheduledDate: dt.date,
      scheduledTime: dt.time,
      generationWeek: week,
      objective,
    });
  }

  return slots;
}

// ---- Content type count distribution ----

function distributeByRatio(ratio: ContentTypeRatio, totalPosts: number): Record<ContentTypeId, number> {
  const counts: Record<number, number> = {};
  let assigned = 0;

  // First pass: floor values
  for (let t = 1; t <= 7; t++) {
    const key = `type_${t}` as keyof ContentTypeRatio;
    const pct = ratio[key];
    counts[t] = Math.floor((pct / 100) * totalPosts);
    assigned += counts[t];
  }

  // Distribute remainder to highest-ratio types
  let remaining = totalPosts - assigned;
  const sorted = [1, 2, 3, 4, 5, 6, 7].sort((a, b) => {
    const ka = `type_${a}` as keyof ContentTypeRatio;
    const kb = `type_${b}` as keyof ContentTypeRatio;
    return ratio[kb] - ratio[ka];
  });

  for (const t of sorted) {
    if (remaining <= 0) break;
    counts[t]++;
    remaining--;
  }

  return counts as Record<ContentTypeId, number>;
}

// ---- Build a flat queue of content types, interleaved ----

function buildTypeQueue(counts: Record<ContentTypeId, number>): ContentTypeId[] {
  // Interleave types so we don't get 5 of the same type in a row
  const remaining = { ...counts };
  const queue: ContentTypeId[] = [];
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  let lastType: ContentTypeId | null = null;
  let lastLastType: ContentTypeId | null = null;

  for (let i = 0; i < total; i++) {
    // Pick the type with the most remaining, avoiding 3 in a row
    const candidates = ([1, 2, 3, 4, 5, 6, 7] as ContentTypeId[])
      .filter(t => remaining[t] > 0)
      .filter(t => !(t === lastType && t === lastLastType)) // no 3 in a row
      .sort((a, b) => remaining[b] - remaining[a]);

    if (candidates.length === 0) break;

    const pick = candidates[0];
    queue.push(pick);
    remaining[pick]--;
    lastLastType = lastType;
    lastType = pick;
  }

  return queue;
}

// ---- Date/time slot generation ----

const DAYS_OF_WEEK = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

function buildDateTimeSlots(
  startDate: Date,
  endDate: Date,
  schedule: Record<string, string[]>,
  maxPerDay: number
): DateTimeSlot[] {
  const slots: DateTimeSlot[] = [];
  const current = new Date(startDate);

  while (current <= endDate) {
    const dayName = DAYS_OF_WEEK[current.getDay()];
    const times = schedule[dayName];

    if (times && times.length > 0) {
      const limitedTimes = times.slice(0, maxPerDay);
      for (const time of limitedTimes) {
        slots.push({
          date: formatDate(current),
          time,
        });
      }
    }

    current.setDate(current.getDate() + 1);
  }

  return slots;
}

// ---- Format selection ----

function normalizeFormatRatio(
  ratio: Record<ContentFormat, number>,
  supported: ContentFormat[]
): Record<ContentFormat, number> {
  const filtered: Record<string, number> = {};
  let sum = 0;

  for (const fmt of supported) {
    if (ratio[fmt] > 0) {
      filtered[fmt] = ratio[fmt];
      sum += ratio[fmt];
    }
  }

  if (sum === 0) {
    // fallback: equal distribution
    for (const fmt of supported) {
      filtered[fmt] = 100 / supported.length;
    }
    return filtered as Record<ContentFormat, number>;
  }

  // Normalize to 100
  for (const fmt of Object.keys(filtered)) {
    filtered[fmt] = (filtered[fmt] / sum) * 100;
  }

  return filtered as Record<ContentFormat, number>;
}

function pickFormat(
  contentType: ContentTypeId,
  weights: Record<ContentFormat, number>,
  supported: ContentFormat[]
): ContentFormat {
  const bestFormats = CONTENT_TYPES[contentType].bestFormats.filter(f => supported.includes(f));

  if (bestFormats.length === 0) {
    // Fallback to any supported format with weight
    const available = supported.filter(f => (weights[f] || 0) > 0);
    return available[0] || supported[0];
  }

  // Weighted random from best formats that have weight
  const candidates = bestFormats.filter(f => (weights[f] || 0) > 0);
  if (candidates.length === 0) return bestFormats[0];

  const totalWeight = candidates.reduce((sum, f) => sum + (weights[f] || 0), 0);
  let random = Math.random() * totalWeight;

  for (const fmt of candidates) {
    random -= weights[fmt] || 0;
    if (random <= 0) return fmt;
  }

  return candidates[0];
}

// ---- Utility helpers ----

function daysBetween(a: Date, b: Date): number {
  return Math.ceil((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

function formatDate(d: Date): string {
  return d.toISOString().split('T')[0];
}

function parseDate(s: string): Date {
  return new Date(s + 'T00:00:00');
}

// ---- Exported helpers for UI ----

export function calculateContentTypeCounts(
  ratio: ContentTypeRatio,
  totalPosts: number
): Record<ContentTypeId, number> {
  return distributeByRatio(ratio, totalPosts);
}

export function calculateTotalPostsForAdSet(
  aggressiveness: Aggressiveness,
  startDate: Date,
  endDate: Date
): number {
  const weeks = Math.max(1, Math.ceil(daysBetween(startDate, endDate) / 7));
  return weeks * AGGRESSIVENESS_TIERS[aggressiveness].postsPerWeek;
}
