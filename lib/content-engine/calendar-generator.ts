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
}

// Daily rhythm based on day of week
const DAILY_RHYTHM: Record<number, DailySlot[]> = {
  0: [], // Sunday - Rest
  1: [ // Monday
    { slot: 'AM', time: '08:00', funnel: 'awareness', format: 'short_video_30_60', storybrand: 'character' },
    { slot: 'PM', time: '12:00', funnel: 'awareness', format: 'short_video_60_90', storybrand: 'external_problem' },
    { slot: 'EVE', time: '18:00', funnel: 'conversion', format: 'short_video_60_120', storybrand: 'call_to_action' },
  ],
  2: [ // Tuesday
    { slot: 'AM', time: '08:00', funnel: 'awareness', format: 'short_video_30_60', storybrand: 'internal_problem' },
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
    { slot: 'AM', time: '08:00', funnel: 'awareness', format: 'short_video_30_60', storybrand: 'internal_problem' },
    { slot: 'PM', time: '12:00', funnel: 'awareness', format: 'short_video_60_90', storybrand: 'philosophical_problem' },
    { slot: 'EVE', time: '18:00', funnel: 'conversion', format: 'short_video_60_120', storybrand: 'call_to_action' },
  ],
  5: [ // Friday - includes MID
    { slot: 'AM', time: '08:00', funnel: 'awareness', format: 'short_video_30_60', storybrand: 'character' },
    { slot: 'PM', time: '12:00', funnel: 'awareness', format: 'short_video_60_90', storybrand: 'external_problem' },
    { slot: 'MID', time: '15:00', funnel: 'consideration', format: 'static_infographic', storybrand: 'plan' },
    { slot: 'EVE', time: '18:00', funnel: 'conversion', format: 'short_video_60_120', storybrand: 'success' },
  ],
  6: [ // Saturday - Light
    { slot: 'AM', time: '10:00', funnel: 'awareness', format: 'short_video_30_60', storybrand: 'character' },
  ],
};

// Moderate rhythm (fewer slots)
const MODERATE_RHYTHM: Record<number, DailySlot[]> = {
  0: [], // Sunday
  1: [ // Monday
    { slot: 'AM', time: '08:00', funnel: 'awareness', format: 'short_video_30_60', storybrand: 'character' },
    { slot: 'EVE', time: '18:00', funnel: 'conversion', format: 'short_video_60_120', storybrand: 'call_to_action' },
  ],
  2: [], // Tuesday
  3: [ // Wednesday
    { slot: 'AM', time: '08:00', funnel: 'awareness', format: 'short_video_60_90', storybrand: 'external_problem' },
    { slot: 'MID', time: '15:00', funnel: 'consideration', format: 'carousel_5_7', storybrand: 'guide' },
  ],
  4: [], // Thursday
  5: [ // Friday
    { slot: 'AM', time: '08:00', funnel: 'awareness', format: 'short_video_30_60', storybrand: 'internal_problem' },
    { slot: 'EVE', time: '18:00', funnel: 'conversion', format: 'short_video_60_120', storybrand: 'success' },
  ],
  6: [], // Saturday
};

// Light rhythm
const LIGHT_RHYTHM: Record<number, DailySlot[]> = {
  0: [], // Sunday
  1: [ // Monday
    { slot: 'AM', time: '08:00', funnel: 'awareness', format: 'short_video_30_60', storybrand: 'character' },
  ],
  2: [], // Tuesday
  3: [ // Wednesday
    { slot: 'AM', time: '08:00', funnel: 'consideration', format: 'carousel_5_7', storybrand: 'guide' },
  ],
  4: [], // Thursday
  5: [ // Friday
    { slot: 'EVE', time: '18:00', funnel: 'conversion', format: 'short_video_60_120', storybrand: 'call_to_action' },
  ],
  6: [], // Saturday
};

export type Frequency = 'aggressive' | 'moderate' | 'light';

export function generateCalendarSlots(
  startDate: Date,
  endDate: Date,
  frequency: Frequency = 'aggressive',
  platforms: string[] = ['linkedin', 'facebook', 'instagram']
): GeneratedContentItem[] {
  const items: GeneratedContentItem[] = [];
  const rhythm = frequency === 'aggressive'
    ? DAILY_RHYTHM
    : frequency === 'moderate'
    ? MODERATE_RHYTHM
    : LIGHT_RHYTHM;

  const current = new Date(startDate);

  while (current <= endDate) {
    const dayOfWeek = current.getDay();
    const slots = rhythm[dayOfWeek] || [];

    for (const slot of slots) {
      items.push({
        scheduled_date: current.toISOString().split('T')[0],
        time_slot: slot.slot,
        scheduled_time: slot.time,
        funnel_stage: slot.funnel,
        storybrand_stage: slot.storybrand,
        format: slot.format,
        platforms,
      });
    }

    current.setDate(current.getDate() + 1);
  }

  return items;
}

export function getWeekNumber(date: Date): number {
  // Get week number within the month (1-4)
  const dayOfMonth = date.getDate();
  return Math.ceil(dayOfMonth / 7);
}

export function getMonthBounds(year: number, month: number): { start: Date; end: Date } {
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0);
  return { start, end };
}
