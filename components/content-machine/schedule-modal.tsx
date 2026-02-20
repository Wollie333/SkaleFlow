'use client';

import { useState } from 'react';
import { Button } from '@/components/ui';
import { XMarkIcon, CalendarDaysIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import { getPlacementLabel } from '@/config/placement-types';
import type { PlacementType, SocialPlatform } from '@/types/database';
import type { GeneratedItem, PlacementEntry } from './types';

const PLATFORM_LABELS: Record<SocialPlatform, string> = {
  linkedin: 'LinkedIn',
  facebook: 'Facebook',
  instagram: 'Instagram',
  twitter: 'X',
  tiktok: 'TikTok',
  youtube: 'YouTube',
};

type Strategy = 'one_per_day' | 'same_day';
type TimeSlot = '09:00' | '13:00' | '17:00';

const TIME_LABELS: Record<TimeSlot, string> = {
  '09:00': 'Morning (09:00)',
  '13:00': 'Afternoon (13:00)',
  '17:00': 'Evening (17:00)',
};

interface ScheduleModalProps {
  open: boolean;
  onClose: () => void;
  placements: PlacementEntry[];
  itemMap: Record<string, GeneratedItem>;
  placementItemIdMap: Record<string, string>;
  onScheduled: () => void;
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-ZA', { weekday: 'short', day: 'numeric', month: 'short' });
}

export function ScheduleModal({
  open,
  onClose,
  placements,
  itemMap,
  placementItemIdMap,
  onScheduled,
}: ScheduleModalProps) {
  const tomorrow = addDays(new Date().toISOString().split('T')[0], 1);
  const [startDate, setStartDate] = useState(tomorrow);
  const [strategy, setStrategy] = useState<Strategy>('one_per_day');
  const [timeSlot, setTimeSlot] = useState<TimeSlot>('09:00');
  const [isScheduling, setIsScheduling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const schedulable = placements.filter(
    ({ placement }) => itemMap[placement] && placementItemIdMap[placement]
  );

  const schedulePreview = schedulable.map(({ platform, placement }, i) => ({
    platform,
    placement,
    date: strategy === 'same_day' ? startDate : addDays(startDate, i),
  }));

  const handleSchedule = async () => {
    setIsScheduling(true);
    setError(null);

    try {
      const results = await Promise.all(
        schedulePreview.map(async ({ placement, date }) => {
          const itemId = placementItemIdMap[placement];
          if (!itemId) return false;

          const res = await fetch(`/api/content/items/${itemId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              status: 'scheduled',
              scheduled_date: date,
              scheduled_time: timeSlot,
            }),
          });
          return res.ok;
        })
      );

      const allOk = results.every(Boolean);
      if (!allOk) {
        setError(`${results.filter(r => !r).length} post(s) failed to schedule`);
      } else {
        onScheduled();
        onClose();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Scheduling failed');
    }

    setIsScheduling(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-cream-warm rounded-2xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-stone/10">
          <div className="flex items-center gap-2">
            <CalendarDaysIcon className="w-5 h-5 text-teal" />
            <h2 className="text-base font-semibold text-charcoal">Push to Calendar</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-cream transition-colors">
            <XMarkIcon className="w-5 h-5 text-stone" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Start Date */}
          <div>
            <label className="text-xs font-medium text-charcoal-700 mb-1 block">Start Date</label>
            <input
              type="date"
              value={startDate}
              min={tomorrow}
              onChange={e => setStartDate(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-stone/20 text-sm focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal bg-cream-warm"
            />
          </div>

          {/* Strategy */}
          <div>
            <label className="text-xs font-medium text-charcoal-700 mb-2 block">Strategy</label>
            <div className="flex gap-2">
              <button
                onClick={() => setStrategy('one_per_day')}
                className={cn(
                  'flex-1 px-3 py-2 rounded-lg text-xs font-medium border transition-colors',
                  strategy === 'one_per_day'
                    ? 'bg-teal text-white border-teal'
                    : 'bg-cream text-stone border-stone/10 hover:border-stone/10'
                )}
              >
                One per day
              </button>
              <button
                onClick={() => setStrategy('same_day')}
                className={cn(
                  'flex-1 px-3 py-2 rounded-lg text-xs font-medium border transition-colors',
                  strategy === 'same_day'
                    ? 'bg-teal text-white border-teal'
                    : 'bg-cream text-stone border-stone/10 hover:border-stone/10'
                )}
              >
                All on same day
              </button>
            </div>
          </div>

          {/* Time Slot */}
          <div>
            <label className="text-xs font-medium text-charcoal-700 mb-2 block">Time Slot</label>
            <div className="flex gap-2">
              {(Object.entries(TIME_LABELS) as [TimeSlot, string][]).map(([value, label]) => (
                <button
                  key={value}
                  onClick={() => setTimeSlot(value)}
                  className={cn(
                    'flex-1 px-2 py-2 rounded-lg text-xs font-medium border transition-colors',
                    timeSlot === value
                      ? 'bg-teal text-white border-teal'
                      : 'bg-cream text-stone border-stone/10 hover:border-stone/10'
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div>
            <label className="text-xs font-medium text-charcoal-700 mb-2 block">
              Schedule Preview ({schedulable.length} post{schedulable.length !== 1 ? 's' : ''})
            </label>
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {schedulePreview.map(({ platform, placement, date }) => (
                <div
                  key={placement}
                  className="flex items-center justify-between px-3 py-2 bg-cream rounded-lg"
                >
                  <span className="text-xs text-charcoal">
                    {PLATFORM_LABELS[platform]} · {getPlacementLabel(placement as PlacementType)}
                  </span>
                  <span className="text-xs font-medium text-teal">{formatDate(date)}</span>
                </div>
              ))}
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-5 border-t border-stone/10">
          <Button variant="ghost" onClick={onClose} disabled={isScheduling}>
            Cancel
          </Button>
          <Button onClick={handleSchedule} isLoading={isScheduling} disabled={schedulable.length === 0}>
            <CalendarDaysIcon className="w-4 h-4 mr-1.5" />
            Schedule {schedulable.length} Post{schedulable.length !== 1 ? 's' : ''}
          </Button>
        </div>
      </div>
    </div>
  );
}
