'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { PageHeader } from '@/components/ui';
import {
  VideoCameraIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  ArrowTopRightOnSquareIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ListBulletIcon,
  CalendarDaysIcon,
} from '@heroicons/react/24/outline';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
} from 'date-fns';

interface Meeting {
  id: string;
  application_id: string;
  scheduled_at: string | null;
  duration_minutes: number;
  attendee_email: string;
  attendee_name: string;
  meet_link: string | null;
  status: string;
  booked_at: string | null;
  created_at: string;
  applications: {
    full_name: string;
    email: string;
    business_name: string;
  } | null;
}

type FilterTab = 'upcoming' | 'past' | 'all';
type ViewMode = 'list' | 'calendar';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  pending: { label: 'Pending', color: 'text-amber-700', bg: 'bg-amber-100', dot: 'bg-amber-400' },
  scheduled: { label: 'Scheduled', color: 'text-teal', bg: 'bg-teal/10', dot: 'bg-teal' },
  completed: { label: 'Completed', color: 'text-green-700', bg: 'bg-green-100', dot: 'bg-green-500' },
  cancelled: { label: 'Cancelled', color: 'text-red-700', bg: 'bg-red-100', dot: 'bg-red-500' },
  no_show: { label: 'No Show', color: 'text-amber-700', bg: 'bg-amber-100', dot: 'bg-amber-400' },
};

export default function MeetingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const filterParam = searchParams.get('filter') as FilterTab | null;
  const viewParam = searchParams.get('view') as ViewMode | null;

  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterTab>(filterParam || 'upcoming');
  const [viewMode, setViewMode] = useState<ViewMode>(viewParam || 'calendar');
  const [actionLoading, setActionLoading] = useState('');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  useEffect(() => {
    fetchMeetings();
  }, []);

  // Sync filters with URL parameters
  useEffect(() => {
    if (filterParam && ['upcoming', 'past', 'all'].includes(filterParam)) {
      setFilter(filterParam);
    }
  }, [filterParam]);

  useEffect(() => {
    if (viewParam && ['list', 'calendar'].includes(viewParam)) {
      setViewMode(viewParam);
    }
  }, [viewParam]);

  const handleFilterChange = (newFilter: FilterTab) => {
    setFilter(newFilter);
    const params = new URLSearchParams(searchParams.toString());
    if (newFilter === 'upcoming') {
      params.delete('filter');
    } else {
      params.set('filter', newFilter);
    }
    const queryString = params.toString();
    router.push(queryString ? `/crm/meetings?${queryString}` : '/crm/meetings', { scroll: false });
  };

  const handleViewModeChange = (newView: ViewMode) => {
    setViewMode(newView);
    const params = new URLSearchParams(searchParams.toString());
    if (newView === 'calendar') {
      params.delete('view');
    } else {
      params.set('view', newView);
    }
    const queryString = params.toString();
    router.push(queryString ? `/crm/meetings?${queryString}` : '/crm/meetings', { scroll: false });
  };

  const fetchMeetings = async () => {
    try {
      const res = await fetch('/api/crm/meetings');
      const data = await res.json();
      if (data.meetings) setMeetings(data.meetings);
    } catch (error) {
      console.error('Failed to fetch meetings:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (meetingId: string, status: string) => {
    setActionLoading(meetingId);
    try {
      const res = await fetch('/api/crm/meetings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ meetingId, status }),
      });
      if (res.ok) await fetchMeetings();
    } catch (error) {
      console.error('Failed to update meeting:', error);
    } finally {
      setActionLoading('');
    }
  };

  const now = new Date();

  const filteredMeetings = meetings.filter((m) => {
    if (filter === 'upcoming') {
      return m.status === 'scheduled' && m.scheduled_at && new Date(m.scheduled_at) >= now;
    }
    if (filter === 'past') {
      return m.status !== 'pending' && (m.status !== 'scheduled' || (m.scheduled_at && new Date(m.scheduled_at) < now));
    }
    return true;
  });

  // Calendar helpers
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: calStart, end: calEnd });
  }, [currentMonth]);

  const meetingsByDate = useMemo(() => {
    const map: Record<string, Meeting[]> = {};
    for (const m of meetings) {
      if (!m.scheduled_at) continue;
      const key = format(new Date(m.scheduled_at), 'yyyy-MM-dd');
      if (!map[key]) map[key] = [];
      map[key].push(m);
    }
    return map;
  }, [meetings]);

  const selectedDayMeetings = useMemo(() => {
    if (!selectedDay) return [];
    const key = format(selectedDay, 'yyyy-MM-dd');
    return (meetingsByDate[key] || []).sort((a, b) => {
      if (!a.scheduled_at || !b.scheduled_at) return 0;
      return new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime();
    });
  }, [selectedDay, meetingsByDate]);

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-ZA', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('en-ZA', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-teal" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={CalendarDaysIcon}
        title="Meetings"
        subtitle="Manage onboarding calls with approved applicants"
        breadcrumbs={[{ label: 'CRM' }, { label: 'Meetings' }]}
        action={
          <div className="flex gap-1 bg-cream-warm rounded-lg p-1 w-fit">
            <button
              onClick={() => handleViewModeChange('calendar')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'calendar'
                  ? 'bg-cream-warm text-charcoal shadow-sm'
                  : 'text-stone hover:text-charcoal'
              }`}
            >
              <CalendarDaysIcon className="w-4 h-4" />
              Calendar
            </button>
            <button
              onClick={() => handleViewModeChange('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'list'
                  ? 'bg-cream-warm text-charcoal shadow-sm'
                  : 'text-stone hover:text-charcoal'
              }`}
            >
              <ListBulletIcon className="w-4 h-4" />
              List
            </button>
          </div>
        }
      />

      {/* ─── CALENDAR VIEW ─── */}
      {viewMode === 'calendar' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar Grid */}
          <div className="lg:col-span-2 bg-cream-warm rounded-xl border border-stone/10 p-6">
            {/* Month Navigation */}
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                className="p-2 rounded-lg hover:bg-cream-warm transition-colors"
              >
                <ChevronLeftIcon className="w-5 h-5 text-stone" />
              </button>
              <h2 className="font-serif text-lg font-bold text-charcoal">
                {format(currentMonth, 'MMMM yyyy')}
              </h2>
              <button
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                className="p-2 rounded-lg hover:bg-cream-warm transition-colors"
              >
                <ChevronRightIcon className="w-5 h-5 text-stone" />
              </button>
            </div>

            {/* Day Headers */}
            <div className="grid grid-cols-7 mb-2">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
                <div key={d} className="text-center text-xs font-semibold text-stone uppercase tracking-wider py-2">
                  {d}
                </div>
              ))}
            </div>

            {/* Day Cells */}
            <div className="grid grid-cols-7">
              {calendarDays.map((day) => {
                const key = format(day, 'yyyy-MM-dd');
                const dayMeetings = meetingsByDate[key] || [];
                const inMonth = isSameMonth(day, currentMonth);
                const today = isToday(day);
                const selected = selectedDay && isSameDay(day, selectedDay);

                return (
                  <button
                    key={key}
                    onClick={() => setSelectedDay(day)}
                    className={`relative min-h-[80px] p-1.5 border border-stone/5 text-left transition-colors ${
                      !inMonth ? 'bg-cream-warm/50' : 'bg-cream-warm hover:bg-cream/50'
                    } ${selected ? 'ring-2 ring-teal ring-inset' : ''}`}
                  >
                    <span
                      className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-medium ${
                        today
                          ? 'bg-teal text-white font-bold'
                          : inMonth
                            ? 'text-charcoal'
                            : 'text-stone/40'
                      }`}
                    >
                      {format(day, 'd')}
                    </span>

                    {/* Meeting dots/chips */}
                    {dayMeetings.length > 0 && (
                      <div className="mt-1 space-y-0.5">
                        {dayMeetings.slice(0, 2).map((m) => {
                          const cfg = STATUS_CONFIG[m.status] || STATUS_CONFIG.pending;
                          return (
                            <div
                              key={m.id}
                              className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium truncate ${cfg.bg} ${cfg.color}`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
                              <span className="truncate">
                                {m.scheduled_at ? formatTime(m.scheduled_at) : ''}{' '}
                                {m.applications?.full_name?.split(' ')[0] || m.attendee_name.split(' ')[0]}
                              </span>
                            </div>
                          );
                        })}
                        {dayMeetings.length > 2 && (
                          <div className="text-[10px] text-stone font-medium px-1.5">
                            +{dayMeetings.length - 2} more
                          </div>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Day Detail Sidebar */}
          <div className="space-y-4">
            <div className="bg-cream-warm rounded-xl border border-stone/10 p-6">
              <h3 className="font-serif text-lg font-bold text-charcoal mb-1">
                {selectedDay ? format(selectedDay, 'EEEE, d MMMM yyyy') : 'Select a day'}
              </h3>
              {selectedDay && (
                <p className="text-sm text-stone">
                  {selectedDayMeetings.length === 0
                    ? 'No meetings on this day'
                    : `${selectedDayMeetings.length} meeting${selectedDayMeetings.length > 1 ? 's' : ''}`}
                </p>
              )}
            </div>

            {selectedDayMeetings.map((meeting) => {
              const statusConfig = STATUS_CONFIG[meeting.status] || STATUS_CONFIG.pending;
              const app = meeting.applications;

              return (
                <div
                  key={meeting.id}
                  className="bg-cream-warm rounded-xl border border-stone/10 p-5 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold text-charcoal">
                        {app?.full_name || meeting.attendee_name}
                      </h4>
                      <p className="text-sm text-stone">{app?.business_name || meeting.attendee_email}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold flex-shrink-0 ${statusConfig.color} ${statusConfig.bg}`}>
                      {statusConfig.label}
                    </span>
                  </div>

                  {meeting.scheduled_at && (
                    <div className="flex items-center gap-1.5 text-sm text-stone">
                      <ClockIcon className="w-4 h-4" />
                      {formatTime(meeting.scheduled_at)} ({meeting.duration_minutes} min)
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    {meeting.meet_link && (
                      <a
                        href={meeting.meet_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-teal/10 text-teal hover:bg-teal/20 transition-colors"
                      >
                        <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5" />
                        Join Meet
                      </a>
                    )}

                    {meeting.status === 'scheduled' && (
                      <>
                        <button
                          onClick={() => updateStatus(meeting.id, 'completed')}
                          disabled={!!actionLoading}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-green-50 text-green-700 hover:bg-green-100 transition-colors disabled:opacity-40"
                        >
                          <CheckCircleIcon className="w-3.5 h-3.5" />
                          Done
                        </button>
                        <button
                          onClick={() => updateStatus(meeting.id, 'no_show')}
                          disabled={!!actionLoading}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors disabled:opacity-40"
                        >
                          <ExclamationTriangleIcon className="w-3.5 h-3.5" />
                          No Show
                        </button>
                        <button
                          onClick={() => updateStatus(meeting.id, 'cancelled')}
                          disabled={!!actionLoading}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-50 text-red-700 hover:bg-red-100 transition-colors disabled:opacity-40"
                        >
                          <XCircleIcon className="w-3.5 h-3.5" />
                          Cancel
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}

            {/* No day selected empty state */}
            {!selectedDay && (
              <div className="bg-cream-warm rounded-xl border border-stone/10 p-8 text-center">
                <CalendarDaysIcon className="w-10 h-10 mx-auto text-stone/20 mb-3" />
                <p className="text-sm text-stone">Click a day on the calendar to see meetings</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── LIST VIEW ─── */}
      {viewMode === 'list' && (
        <>
          {/* Filter Tabs */}
          <div className="flex gap-1 bg-cream-warm rounded-lg p-1 w-fit">
            {(['upcoming', 'past', 'all'] as FilterTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => handleFilterChange(tab)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors capitalize ${
                  filter === tab
                    ? 'bg-cream-warm text-charcoal shadow-sm'
                    : 'text-stone hover:text-charcoal'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Meetings List */}
          {filteredMeetings.length === 0 ? (
            <div className="text-center py-20">
              <VideoCameraIcon className="w-12 h-12 mx-auto text-stone/30 mb-4" />
              <h3 className="font-serif text-lg font-bold text-charcoal mb-2">No meetings found</h3>
              <p className="text-stone text-sm">
                {filter === 'upcoming'
                  ? 'No upcoming meetings scheduled.'
                  : filter === 'past'
                    ? 'No past meetings yet.'
                    : 'No meetings have been created yet.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredMeetings.map((meeting) => {
                const statusConfig = STATUS_CONFIG[meeting.status] || STATUS_CONFIG.pending;
                const app = meeting.applications;

                return (
                  <div
                    key={meeting.id}
                    className="bg-cream-warm rounded-xl border border-stone/10 p-5 flex flex-col md:flex-row md:items-center gap-4"
                  >
                    {/* Applicant Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-charcoal truncate">
                          {app?.full_name || meeting.attendee_name}
                        </h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusConfig.color} ${statusConfig.bg}`}>
                          {statusConfig.label}
                        </span>
                      </div>
                      <p className="text-sm text-stone truncate">
                        {app?.business_name || meeting.attendee_email}
                      </p>
                      {meeting.scheduled_at && (
                        <div className="flex items-center gap-1.5 mt-1.5">
                          <ClockIcon className="w-3.5 h-3.5 text-stone" />
                          <span className="text-xs text-stone">
                            {formatDateTime(meeting.scheduled_at)} ({meeting.duration_minutes} min)
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {meeting.meet_link && (
                        <a
                          href={meeting.meet_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-teal/10 text-teal hover:bg-teal/20 transition-colors"
                        >
                          <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5" />
                          Join Meet
                        </a>
                      )}

                      {meeting.status === 'scheduled' && (
                        <>
                          <button
                            onClick={() => updateStatus(meeting.id, 'completed')}
                            disabled={!!actionLoading}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-green-50 text-green-700 hover:bg-green-100 transition-colors disabled:opacity-40"
                          >
                            <CheckCircleIcon className="w-3.5 h-3.5" />
                            Completed
                          </button>
                          <button
                            onClick={() => updateStatus(meeting.id, 'no_show')}
                            disabled={!!actionLoading}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors disabled:opacity-40"
                          >
                            <ExclamationTriangleIcon className="w-3.5 h-3.5" />
                            No Show
                          </button>
                          <button
                            onClick={() => updateStatus(meeting.id, 'cancelled')}
                            disabled={!!actionLoading}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-50 text-red-700 hover:bg-red-100 transition-colors disabled:opacity-40"
                          >
                            <XCircleIcon className="w-3.5 h-3.5" />
                            Cancel
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
