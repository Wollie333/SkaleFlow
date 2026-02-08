import type { FunnelStage, StoryBrandStage, TimeSlot } from '@/types/database';

export interface DailySlot {
  slot: TimeSlot;
  time: string;
  funnel: FunnelStage;
  format: string;
  storybrand: StoryBrandStage;
}

export interface GeneratedContentItem {
  scheduled_date: string;
  time_slot: TimeSlot;
  scheduled_time: string;
  funnel_stage: FunnelStage;
  storybrand_stage: StoryBrandStage;
  format: string;
  platforms: string[];
  generation_week: number;
}

// AGGRESSIVE rhythm: 3-4 posts/day + medium/long-form
const DAILY_RHYTHM: Record<number, DailySlot[]> = {
  0: [], // Sunday - Rest
  1: [ // Monday
    { slot: 'AM', time: '08:00', funnel: 'awareness', format: 'short_video_30_60', storybrand: 'character' },
    { slot: 'PM', time: '12:00', funnel: 'awareness', format: 'short_video_60_90', storybrand: 'external_problem' },
    { slot: 'EVE', time: '18:00', funnel: 'conversion', format: 'short_video_60_120', storybrand: 'call_to_action' },
  ],
  2: [ // Tuesday
    { slot: 'AM', time: '08:00', funnel: 'consideration', format: 'medium_video_2_3', storybrand: 'guide' },
    { slot: 'PM', time: '12:00', funnel: 'awareness', format: 'short_video_60_90', storybrand: 'philosophical_problem' },
    { slot: 'EVE', time: '18:00', funnel: 'conversion', format: 'short_video_60_120', storybrand: 'failure' },
  ],
  3: [ // Wednesday - includes MID
    { slot: 'AM', time: '08:00', funnel: 'awareness', format: 'short_video_30_60', storybrand: 'character' },
    { slot: 'PM', time: '12:00', funnel: 'awareness', format: 'short_video_60_90', storybrand: 'external_problem' },
    { slot: 'MID', time: '15:00', funnel: 'consideration', format: 'carousel_5_7', storybrand: 'guide' },
    { slot: 'EVE', time: '18:00', funnel: 'conversion', format: 'short_video_60_120', storybrand: 'success' },
  ],
  4: [ // Thursday
    { slot: 'AM', time: '08:00', funnel: 'consideration', format: 'medium_video_4_6', storybrand: 'plan' },
    { slot: 'PM', time: '12:00', funnel: 'awareness', format: 'short_video_60_90', storybrand: 'internal_problem' },
    { slot: 'EVE', time: '18:00', funnel: 'conversion', format: 'short_video_60_120', storybrand: 'call_to_action' },
  ],
  5: [ // Friday - includes MID
    { slot: 'AM', time: '08:00', funnel: 'awareness', format: 'short_video_30_60', storybrand: 'character' },
    { slot: 'PM', time: '12:00', funnel: 'awareness', format: 'short_video_60_90', storybrand: 'external_problem' },
    { slot: 'MID', time: '15:00', funnel: 'consideration', format: 'static_infographic', storybrand: 'plan' },
    { slot: 'EVE', time: '18:00', funnel: 'conversion', format: 'short_video_60_120', storybrand: 'success' },
  ],
  6: [ // Saturday - authority piece
    { slot: 'AM', time: '10:00', funnel: 'conversion', format: 'long_video_10_15', storybrand: 'guide' },
  ],
};

// MODERATE rhythm: 1-2 posts/day + medium + long every other Saturday
const MODERATE_RHYTHM: Record<number, DailySlot[]> = {
  0: [], // Sunday
  1: [ // Monday
    { slot: 'AM', time: '08:00', funnel: 'awareness', format: 'short_video_30_60', storybrand: 'character' },
    { slot: 'EVE', time: '18:00', funnel: 'conversion', format: 'short_video_60_120', storybrand: 'call_to_action' },
  ],
  2: [], // Tuesday
  3: [ // Wednesday
    { slot: 'AM', time: '08:00', funnel: 'consideration', format: 'medium_video_2_3', storybrand: 'guide' },
    { slot: 'MID', time: '15:00', funnel: 'consideration', format: 'carousel_5_7', storybrand: 'plan' },
  ],
  4: [], // Thursday
  5: [ // Friday
    { slot: 'AM', time: '08:00', funnel: 'awareness', format: 'short_video_30_60', storybrand: 'internal_problem' },
    { slot: 'EVE', time: '18:00', funnel: 'conversion', format: 'short_video_60_120', storybrand: 'success' },
  ],
  6: [], // Saturday (long-form added every other week in generation logic)
};

// LIGHT rhythm: ~1 post/day
const LIGHT_RHYTHM: Record<number, DailySlot[]> = {
  0: [], // Sunday
  1: [ // Monday
    { slot: 'AM', time: '08:00', funnel: 'consideration', format: 'medium_video_2_3', storybrand: 'guide' },
  ],
  2: [], // Tuesday
  3: [ // Wednesday
    { slot: 'AM', time: '08:00', funnel: 'consideration', format: 'carousel_5_7', storybrand: 'plan' },
  ],
  4: [], // Thursday
  5: [ // Friday
    { slot: 'EVE', time: '18:00', funnel: 'conversion', format: 'short_video_60_120', storybrand: 'call_to_action' },
  ],
  6: [], // Saturday
};

export type Frequency = 'aggressive' | 'moderate' | 'light';

/** Map of date → Set of taken times for conflict checking */
export type ScheduleConflictMap = Record<string, Set<string>>;

/**
 * Build a conflict map from existing content items.
 * The map is: { "2025-02-10": Set(["08:00", "12:00"]), ... }
 */
export function buildConflictMap(
  existingItems: Array<{ scheduled_date: string; scheduled_time: string | null }>
): ScheduleConflictMap {
  const map: ScheduleConflictMap = {};
  for (const item of existingItems) {
    if (!item.scheduled_time) continue;
    if (!map[item.scheduled_date]) {
      map[item.scheduled_date] = new Set();
    }
    map[item.scheduled_date].add(item.scheduled_time);
  }
  return map;
}

/**
 * Find an available time slot that doesn't conflict with existing items.
 * Offsets by 15-minute increments until a free slot is found.
 */
export function findAvailableTime(
  date: string,
  baseTime: string,
  conflictMap: ScheduleConflictMap
): string {
  const takenTimes = conflictMap[date];
  if (!takenTimes || !takenTimes.has(baseTime)) {
    return baseTime;
  }

  const [baseHour, baseMin] = baseTime.split(':').map(Number);
  let totalMinutes = baseHour * 60 + baseMin;

  // Try 15-minute increments, up to 4 hours from base time
  for (let i = 1; i <= 16; i++) {
    totalMinutes += 15;
    if (totalMinutes >= 24 * 60) break; // Don't go past midnight
    const hour = Math.floor(totalMinutes / 60);
    const min = totalMinutes % 60;
    const candidate = `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
    if (!takenTimes.has(candidate)) {
      return candidate;
    }
  }

  // Fallback: return baseTime + 15 even if it conflicts (very unlikely to exhaust 16 slots)
  return baseTime;
}

export function generateCalendarSlots(
  startDate: Date,
  endDate: Date,
  frequency: Frequency = 'aggressive',
  platforms: string[] = ['linkedin', 'facebook', 'instagram'],
  conflictMap?: ScheduleConflictMap
): GeneratedContentItem[] {
  const items: GeneratedContentItem[] = [];
  const rhythm = frequency === 'aggressive'
    ? DAILY_RHYTHM
    : frequency === 'moderate'
    ? MODERATE_RHYTHM
    : LIGHT_RHYTHM;

  // Internal map tracks times assigned in THIS batch too
  const internalMap: ScheduleConflictMap = {};
  if (conflictMap) {
    for (const [date, times] of Object.entries(conflictMap)) {
      internalMap[date] = new Set(times);
    }
  }

  const current = new Date(startDate);
  let saturdayCount = 0;

  while (current <= endDate) {
    const dayOfWeek = current.getDay();
    const weekNumber = getWeekNumber(current);
    let slots = rhythm[dayOfWeek] || [];

    // Moderate: add long-form on every other Saturday
    if (frequency === 'moderate' && dayOfWeek === 6) {
      saturdayCount++;
      if (saturdayCount % 2 === 1) {
        slots = [{ slot: 'AM' as TimeSlot, time: '10:00', funnel: 'conversion' as FunnelStage, format: 'long_video_10_15', storybrand: 'guide' as StoryBrandStage }];
      }
    }

    // Light: add long-form on first Saturday of month
    if (frequency === 'light' && dayOfWeek === 6 && current.getDate() <= 7) {
      slots = [{ slot: 'AM' as TimeSlot, time: '10:00', funnel: 'conversion' as FunnelStage, format: 'long_video_10_15', storybrand: 'plan' as StoryBrandStage }];
    }

    const dateStr = current.toISOString().split('T')[0];

    for (const slot of slots) {
      // Resolve conflict-free time
      const resolvedTime = findAvailableTime(dateStr, slot.time, internalMap);

      // Track in internal map so subsequent items in this batch also avoid it
      if (!internalMap[dateStr]) {
        internalMap[dateStr] = new Set();
      }
      internalMap[dateStr].add(resolvedTime);

      items.push({
        scheduled_date: dateStr,
        time_slot: slot.slot,
        scheduled_time: resolvedTime,
        funnel_stage: slot.funnel,
        storybrand_stage: slot.storybrand,
        format: slot.format,
        platforms,
        generation_week: weekNumber,
      });
    }

    current.setDate(current.getDate() + 1);
  }

  return items;
}

export function getWeekNumber(date: Date): number {
  const dayOfMonth = date.getDate();
  return Math.min(Math.ceil(dayOfMonth / 7), 5);
}

export function getTotalWeeks(startDate: Date, endDate: Date): number {
  const items = generateCalendarSlots(startDate, endDate, 'aggressive', []);
  const weeks = new Set(items.map(i => i.generation_week));
  return weeks.size;
}

export function getMonthBounds(year: number, month: number): { start: Date; end: Date } {
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0);
  return { start, end };
}
