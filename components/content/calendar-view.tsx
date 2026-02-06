'use client';

import { useState } from 'react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, startOfWeek, endOfWeek, isSameMonth } from 'date-fns';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import type { FunnelStage, TimeSlot, ContentStatus } from '@/types/database';

interface ContentItem {
  id: string;
  scheduled_date: string;
  time_slot: TimeSlot;
  funnel_stage: FunnelStage;
  format: string;
  topic: string | null;
  status: ContentStatus;
}

interface CalendarViewProps {
  items: ContentItem[];
  onItemClick: (item: ContentItem) => void;
  onMonthChange?: (date: Date) => void;
}

const TIME_SLOT_ORDER: TimeSlot[] = ['AM', 'PM', 'MID', 'EVE'];

export function CalendarView({ items, onItemClick, onMonthChange }: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const handlePreviousMonth = () => {
    const newMonth = subMonths(currentMonth, 1);
    setCurrentMonth(newMonth);
    onMonthChange?.(newMonth);
  };

  const handleNextMonth = () => {
    const newMonth = addMonths(currentMonth, 1);
    setCurrentMonth(newMonth);
    onMonthChange?.(newMonth);
  };

  // Get all days to display (including padding days from prev/next month)
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 }); // Start on Monday
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  return (
    <div className="bg-white rounded-xl border border-stone/10 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-stone/10 flex items-center justify-between">
        <h2 className="text-heading-md text-charcoal">
          {format(currentMonth, 'MMMM yyyy')}
        </h2>
        <div className="flex gap-2">
          <button
            onClick={handlePreviousMonth}
            className="p-2 rounded-lg hover:bg-cream-warm transition-colors"
          >
            <ChevronLeftIcon className="w-5 h-5 text-stone" />
          </button>
          <button
            onClick={() => {
              setCurrentMonth(new Date());
              onMonthChange?.(new Date());
            }}
            className="px-3 py-1 text-sm font-medium text-teal hover:bg-teal/10 rounded-lg transition-colors"
          >
            Today
          </button>
          <button
            onClick={handleNextMonth}
            className="p-2 rounded-lg hover:bg-cream-warm transition-colors"
          >
            <ChevronRightIcon className="w-5 h-5 text-stone" />
          </button>
        </div>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 border-b border-stone/10">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
          <div key={day} className="py-3 text-center text-sm font-medium text-stone">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7">
        {days.map((day, i) => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const dayItems = items
            .filter(item => item.scheduled_date === dateStr)
            .sort((a, b) => TIME_SLOT_ORDER.indexOf(a.time_slot) - TIME_SLOT_ORDER.indexOf(b.time_slot));

          const isCurrentMonth = isSameMonth(day, currentMonth);

          return (
            <div
              key={i}
              className={cn(
                'min-h-[120px] p-2 border-r border-b border-stone/5',
                !isCurrentMonth && 'bg-stone/5',
                isToday(day) && 'bg-teal/5'
              )}
            >
              <p
                className={cn(
                  'text-sm font-medium mb-2',
                  !isCurrentMonth && 'text-stone/40',
                  isToday(day) && 'text-teal font-bold'
                )}
              >
                {format(day, 'd')}
              </p>

              <div className="space-y-1">
                {dayItems.slice(0, 3).map((item) => (
                  <button
                    key={item.id}
                    onClick={() => onItemClick(item)}
                    className={cn(
                      'w-full text-left px-2 py-1 rounded text-xs truncate transition-colors',
                      item.funnel_stage === 'awareness' && 'bg-green-100 text-green-800 hover:bg-green-200',
                      item.funnel_stage === 'consideration' && 'bg-blue-100 text-blue-800 hover:bg-blue-200',
                      item.funnel_stage === 'conversion' && 'bg-orange-100 text-orange-800 hover:bg-orange-200'
                    )}
                  >
                    <span className="font-medium">{item.time_slot}</span>
                    {' • '}
                    {item.topic || item.format.replace(/_/g, ' ')}
                  </button>
                ))}

                {dayItems.length > 3 && (
                  <p className="text-xs text-stone px-2">
                    +{dayItems.length - 3} more
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="px-6 py-3 border-t border-stone/10 flex gap-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-green-100" />
          <span className="text-xs text-stone">Awareness</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-blue-100" />
          <span className="text-xs text-stone">Consideration</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-orange-100" />
          <span className="text-xs text-stone">Conversion</span>
        </div>
      </div>
    </div>
  );
}
