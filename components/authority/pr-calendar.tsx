'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

interface CalendarEvent {
  id: string;
  event_type: string;
  title: string;
  description: string | null;
  event_date: string;
  event_time: string | null;
  is_completed: boolean;
  color: string | null;
  card_id: string | null;
  authority_pipeline_cards?: { opportunity_name: string; category: string } | null;
}

interface PrCalendarProps {
  organizationId: string;
}

const EVENT_TYPE_LABELS: Record<string, string> = {
  submission_deadline: 'Deadline',
  publication_date: 'Publication',
  embargo_lift: 'Embargo Lifts',
  follow_up: 'Follow-Up',
  speaking_event: 'Speaking',
  amplification_post: 'Amplification',
  quest_deadline: 'Quest',
  custom: 'Event',
};

export function PrCalendar({ organizationId }: PrCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [view, setView] = useState<'month' | 'agenda'>('month');
  const [loading, setLoading] = useState(true);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const loadEvents = useCallback(async () => {
    setLoading(true);
    const startDate = new Date(year, month, 1).toISOString().slice(0, 10);
    const endDate = new Date(year, month + 1, 0).toISOString().slice(0, 10);

    const res = await fetch(
      `/api/authority/calendar?organizationId=${organizationId}&startDate=${startDate}&endDate=${endDate}`
    );
    if (res.ok) setEvents(await res.json());
    setLoading(false);
  }, [organizationId, year, month]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const handleComplete = async (eventId: string) => {
    await fetch(`/api/authority/calendar/${eventId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_completed: true }),
    });
    loadEvents();
  };

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  // Build calendar grid
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days: Array<{ day: number | null; events: CalendarEvent[] }> = [];

  // Padding for first week
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push({ day: null, events: [] });
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const dayEvents = events.filter(e => e.event_date === dateStr);
    days.push({ day: d, events: dayEvents });
  }

  const today = new Date();
  const isToday = (d: number) =>
    d === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-cream transition-colors">
            <ChevronLeftIcon className="w-4 h-4 text-stone" />
          </button>
          <h2 className="text-lg font-serif font-semibold text-charcoal min-w-[180px] text-center">{monthName}</h2>
          <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-cream transition-colors">
            <ChevronRightIcon className="w-4 h-4 text-stone" />
          </button>
        </div>

        <div className="flex items-center bg-cream-warm/50 rounded-lg p-0.5">
          <button
            onClick={() => setView('month')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              view === 'month' ? 'bg-cream-warm text-charcoal shadow-sm' : 'text-stone'
            }`}
          >
            Month
          </button>
          <button
            onClick={() => setView('agenda')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              view === 'agenda' ? 'bg-cream-warm text-charcoal shadow-sm' : 'text-stone'
            }`}
          >
            Agenda
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <span className="text-sm text-stone animate-pulse">Loading calendar...</span>
        </div>
      ) : view === 'month' ? (
        /* Month View */
        <div className="bg-cream-warm rounded-xl border border-stone/10 overflow-hidden">
          <div className="grid grid-cols-7 border-b border-stone/10">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <div key={d} className="px-2 py-1.5 text-[10px] font-semibold text-stone text-center uppercase">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {days.map((cell, i) => (
              <div
                key={i}
                className={`min-h-[80px] p-1 border-b border-r border-stone/5 ${
                  cell.day === null ? 'bg-cream-warm/20' : ''
                }`}
              >
                {cell.day && (
                  <>
                    <span
                      className={`text-xs font-medium ${
                        isToday(cell.day)
                          ? 'w-5 h-5 rounded-full bg-teal text-white flex items-center justify-center'
                          : 'text-charcoal'
                      }`}
                    >
                      {cell.day}
                    </span>
                    <div className="mt-0.5 space-y-0.5">
                      {cell.events.slice(0, 3).map(ev => (
                        <div
                          key={ev.id}
                          className={`text-[9px] px-1 py-0.5 rounded truncate cursor-pointer ${
                            ev.is_completed ? 'line-through opacity-50' : ''
                          }`}
                          style={{
                            backgroundColor: `${ev.color || '#14b8a6'}15`,
                            color: ev.color || '#14b8a6',
                          }}
                          title={ev.title}
                        >
                          {ev.title}
                        </div>
                      ))}
                      {cell.events.length > 3 && (
                        <span className="text-[9px] text-stone">+{cell.events.length - 3} more</span>
                      )}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Agenda View */
        <div className="bg-cream-warm rounded-xl border border-stone/10 divide-y divide-stone/5">
          {events.length === 0 ? (
            <div className="text-center py-12">
              <CalendarDaysIcon className="w-8 h-8 text-stone/30 mx-auto mb-2" />
              <p className="text-sm text-stone">No events this month</p>
            </div>
          ) : (
            events.map(ev => (
              <div key={ev.id} className="flex items-center gap-3 p-3 hover:bg-cream/20 transition-colors">
                <div
                  className="w-1 h-8 rounded-full flex-shrink-0"
                  style={{ backgroundColor: ev.color || '#14b8a6' }}
                />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium text-charcoal ${ev.is_completed ? 'line-through opacity-50' : ''}`}>
                    {ev.title}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-stone">{new Date(ev.event_date).toLocaleDateString()}</span>
                    {ev.event_time && <span className="text-[10px] text-stone">{ev.event_time}</span>}
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-cream-warm text-stone">
                      {EVENT_TYPE_LABELS[ev.event_type] || ev.event_type}
                    </span>
                  </div>
                </div>
                {!ev.is_completed && (
                  <button
                    onClick={() => handleComplete(ev.id)}
                    className="p-1 rounded hover:bg-green-50 text-stone hover:text-green-500 transition-colors"
                    title="Mark complete"
                  >
                    <CheckCircleIcon className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
