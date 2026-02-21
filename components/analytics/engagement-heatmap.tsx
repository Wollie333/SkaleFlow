'use client';

import { Card } from '@/components/ui';
import { ClockIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import type { HeatmapPoint } from './types';

interface EngagementHeatmapProps {
  data: HeatmapPoint[];
  isLoading?: boolean;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

function getHourLabel(hour: number): string {
  if (hour === 0) return '12a';
  if (hour === 12) return '12p';
  if (hour < 12) return `${hour}a`;
  return `${hour - 12}p`;
}

function getIntensity(value: number, max: number): string {
  if (max === 0 || value === 0) return 'bg-stone/5';
  const ratio = value / max;
  if (ratio > 0.75) return 'bg-teal text-white';
  if (ratio > 0.5) return 'bg-teal/60 text-white';
  if (ratio > 0.25) return 'bg-teal/30';
  if (ratio > 0) return 'bg-teal/10';
  return 'bg-stone/5';
}

export function EngagementHeatmap({ data, isLoading }: EngagementHeatmapProps) {
  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gold/10 rounded-lg flex items-center justify-center">
            <ClockIcon className="w-5 h-5 text-gold" />
          </div>
          <div>
            <h3 className="text-heading-md text-charcoal">Best Posting Times</h3>
            <p className="text-sm text-stone">When your audience is most engaged</p>
          </div>
        </div>
        <div className="h-[240px] bg-stone/5 rounded-lg animate-pulse" />
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gold/10 rounded-lg flex items-center justify-center">
            <ClockIcon className="w-5 h-5 text-gold" />
          </div>
          <div>
            <h3 className="text-heading-md text-charcoal">Best Posting Times</h3>
            <p className="text-sm text-stone">When your audience is most engaged</p>
          </div>
        </div>
        <div className="h-[240px] flex items-center justify-center text-stone">
          Publish more content to see engagement patterns.
        </div>
      </Card>
    );
  }

  // Build lookup
  const lookup: Record<string, number> = {};
  let maxVal = 0;
  for (const point of data) {
    const key = `${point.day}-${point.hour}`;
    lookup[key] = point.avgEngagement;
    if (point.avgEngagement > maxVal) maxVal = point.avgEngagement;
  }

  // Find top 3 best times
  const sorted = [...data].sort((a, b) => b.avgEngagement - a.avgEngagement);
  const bestTimes = sorted.slice(0, 3);

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gold/10 rounded-lg flex items-center justify-center">
            <ClockIcon className="w-5 h-5 text-gold" />
          </div>
          <div>
            <h3 className="text-heading-md text-charcoal">Best Posting Times</h3>
            <p className="text-sm text-stone">When your audience is most engaged</p>
          </div>
        </div>
        {bestTimes.length > 0 && (
          <div className="flex gap-2">
            {bestTimes.map((t, i) => (
              <span key={i} className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-teal/10 text-teal">
                {DAYS[t.day]} {getHourLabel(t.hour)}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Heatmap Grid */}
      <div className="overflow-x-auto">
        <div className="min-w-[640px]">
          {/* Hour headers */}
          <div className="flex">
            <div className="w-12 flex-shrink-0" />
            {HOURS.filter(h => h % 3 === 0).map(hour => (
              <div key={hour} className="flex-1 text-center text-xs text-stone px-0.5">
                {getHourLabel(hour)}
              </div>
            ))}
          </div>

          {/* Grid rows */}
          {DAYS.map((day, dayIdx) => (
            <div key={day} className="flex items-center gap-0.5 mt-0.5">
              <div className="w-12 flex-shrink-0 text-xs text-stone font-medium text-right pr-2">
                {day}
              </div>
              {HOURS.map(hour => {
                const val = lookup[`${dayIdx}-${hour}`] || 0;
                return (
                  <div
                    key={hour}
                    className={cn(
                      'flex-1 aspect-square rounded-sm cursor-default transition-all',
                      getIntensity(val, maxVal)
                    )}
                    title={`${day} ${getHourLabel(hour)}: ${val} avg engagement`}
                  />
                );
              })}
            </div>
          ))}

          {/* Legend */}
          <div className="flex items-center justify-end gap-2 mt-3">
            <span className="text-xs text-stone">Less</span>
            <div className="flex gap-0.5">
              <div className="w-4 h-4 rounded-sm bg-stone/5" />
              <div className="w-4 h-4 rounded-sm bg-teal/10" />
              <div className="w-4 h-4 rounded-sm bg-teal/30" />
              <div className="w-4 h-4 rounded-sm bg-teal/60" />
              <div className="w-4 h-4 rounded-sm bg-teal" />
            </div>
            <span className="text-xs text-stone">More</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
