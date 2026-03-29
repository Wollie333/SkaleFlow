'use client';

import { useState, useEffect, useCallback } from 'react';
import { PageHeader } from '@/components/ui';
import { ClockIcon, UserIcon, DocumentTextIcon, CalendarDaysIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

interface Session {
  id: string;
  user_id: string;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number | null;
  page_views: number;
  users?: { full_name: string; email: string; avatar_url?: string | null } | null;
}

interface PostTimeEntry {
  id: string;
  post_id: string;
  user_id: string;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number | null;
  activity_type: string;
  users?: { full_name: string; email: string; avatar_url?: string | null } | null;
  content_posts?: { topic: string; content_type: string } | null;
}

interface TimeStats {
  totalSessions: number;
  totalDuration: number;
  averageSessionDuration: number;
  totalPostTimeEntries: number;
  totalPostDuration: number;
  activeUsers: number;
}

export default function TimeTrackingPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [postTimeEntries, setPostTimeEntries] = useState<PostTimeEntry[]>([]);
  const [stats, setStats] = useState<TimeStats>({
    totalSessions: 0,
    totalDuration: 0,
    averageSessionDuration: 0,
    totalPostTimeEntries: 0,
    totalPostDuration: 0,
    activeUsers: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState('7days');
  const [viewType, setViewType] = useState<'sessions' | 'posts'>('sessions');

  const fetchTimeTracking = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({ range: dateRange });
      const res = await fetch(`/api/team/time-tracking?${params}`);
      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions || []);
        setPostTimeEntries(data.postTimeEntries || []);
        setStats(data.stats || {
          totalSessions: 0,
          totalDuration: 0,
          averageSessionDuration: 0,
          totalPostTimeEntries: 0,
          totalPostDuration: 0,
          activeUsers: 0,
        });
      }
    } catch (err) {
      console.error('Failed to fetch time tracking:', err);
    } finally {
      setIsLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchTimeTracking();
  }, [fetchTimeTracking]);

  const formatDuration = (seconds: number | null): string => {
    if (!seconds) return '0m';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-ZA', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const activityTypeLabels: Record<string, string> = {
    editing: 'Editing',
    reviewing: 'Reviewing',
    uploading_media: 'Uploading Media',
    scheduling: 'Scheduling',
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <PageHeader
          icon={ClockIcon}
          title="Time Tracking"
          subtitle="Monitor team productivity and time spent on content creation."
        />
      </div>

      {/* Controls */}
      <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 border border-stone/10 rounded-lg text-charcoal bg-cream-warm text-sm focus:outline-none focus:ring-2 focus:ring-teal/20"
          >
            <option value="today">Today</option>
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
            <option value="90days">Last 90 Days</option>
          </select>
        </div>

        <div className="flex items-center gap-2 bg-cream-warm rounded-lg p-1 border border-stone/10">
          <button
            onClick={() => setViewType('sessions')}
            className={cn(
              'px-4 py-1.5 rounded-md text-sm font-medium transition-colors',
              viewType === 'sessions'
                ? 'bg-teal text-white'
                : 'text-stone hover:text-charcoal'
            )}
          >
            Sessions
          </button>
          <button
            onClick={() => setViewType('posts')}
            className={cn(
              'px-4 py-1.5 rounded-md text-sm font-medium transition-colors',
              viewType === 'posts'
                ? 'bg-teal text-white'
                : 'text-stone hover:text-charcoal'
            )}
          >
            Post Activity
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <div className="bg-cream-warm rounded-xl border border-teal/[0.08] shadow-[0_2px_12px_rgba(15,31,29,0.03)] p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-teal/10 flex items-center justify-center">
              <ClockIcon className="w-5 h-5 text-teal" />
            </div>
            <div>
              <p className="text-xs text-stone">Total Time</p>
              <p className="text-xl font-bold text-charcoal">{formatDuration(stats.totalDuration)}</p>
            </div>
          </div>
        </div>

        <div className="bg-cream-warm rounded-xl border border-teal/[0.08] shadow-[0_2px_12px_rgba(15,31,29,0.03)] p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <CalendarDaysIcon className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-stone">Sessions</p>
              <p className="text-xl font-bold text-charcoal">{stats.totalSessions}</p>
            </div>
          </div>
        </div>

        <div className="bg-cream-warm rounded-xl border border-teal/[0.08] shadow-[0_2px_12px_rgba(15,31,29,0.03)] p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
              <ClockIcon className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-stone">Avg Session</p>
              <p className="text-xl font-bold text-charcoal">{formatDuration(stats.averageSessionDuration)}</p>
            </div>
          </div>
        </div>

        <div className="bg-cream-warm rounded-xl border border-teal/[0.08] shadow-[0_2px_12px_rgba(15,31,29,0.03)] p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
              <UserIcon className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-stone">Active Users</p>
              <p className="text-xl font-bold text-charcoal">{stats.activeUsers}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="bg-cream-warm rounded-xl border border-teal/[0.08] p-8 text-center">
          <div className="inline-block w-8 h-8 border-2 border-teal border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-stone mt-3">Loading time tracking data...</p>
        </div>
      )}

      {/* Sessions View */}
      {!isLoading && viewType === 'sessions' && (
        <div className="bg-cream-warm rounded-xl border border-teal/[0.08] shadow-[0_2px_12px_rgba(15,31,29,0.03)] overflow-hidden">
          <div className="p-5 border-b border-stone/10">
            <h3 className="font-serif text-lg font-bold text-charcoal">User Sessions</h3>
          </div>

          {sessions.length === 0 ? (
            <div className="p-8 text-center text-sm text-stone">
              No sessions recorded for this time period.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-stone/5 text-xs text-stone uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3 text-left">User</th>
                    <th className="px-5 py-3 text-left">Started</th>
                    <th className="px-5 py-3 text-left">Ended</th>
                    <th className="px-5 py-3 text-left">Duration</th>
                    <th className="px-5 py-3 text-left">Page Views</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone/10">
                  {sessions.map((session) => (
                    <tr key={session.id} className="hover:bg-stone/5">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          {session.users?.avatar_url ? (
                            <img
                              src={session.users.avatar_url}
                              alt={session.users.full_name}
                              className="w-8 h-8 rounded-full"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-teal/10 flex items-center justify-center">
                              <UserIcon className="w-4 h-4 text-teal" />
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-medium text-charcoal">
                              {session.users?.full_name || 'Unknown'}
                            </p>
                            <p className="text-xs text-stone">{session.users?.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm text-stone">{formatDate(session.started_at)}</td>
                      <td className="px-5 py-4 text-sm text-stone">
                        {session.ended_at ? formatDate(session.ended_at) : (
                          <span className="text-green-600 font-medium">Active</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-sm font-medium text-charcoal">
                        {formatDuration(session.duration_seconds)}
                      </td>
                      <td className="px-5 py-4 text-sm text-stone">{session.page_views}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Post Activity View */}
      {!isLoading && viewType === 'posts' && (
        <div className="bg-cream-warm rounded-xl border border-teal/[0.08] shadow-[0_2px_12px_rgba(15,31,29,0.03)] overflow-hidden">
          <div className="p-5 border-b border-stone/10">
            <h3 className="font-serif text-lg font-bold text-charcoal">Post Time Entries</h3>
          </div>

          {postTimeEntries.length === 0 ? (
            <div className="p-8 text-center text-sm text-stone">
              No post activity recorded for this time period.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-stone/5 text-xs text-stone uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3 text-left">User</th>
                    <th className="px-5 py-3 text-left">Post</th>
                    <th className="px-5 py-3 text-left">Activity</th>
                    <th className="px-5 py-3 text-left">Started</th>
                    <th className="px-5 py-3 text-left">Duration</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone/10">
                  {postTimeEntries.map((entry) => (
                    <tr key={entry.id} className="hover:bg-stone/5">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          {entry.users?.avatar_url ? (
                            <img
                              src={entry.users.avatar_url}
                              alt={entry.users.full_name}
                              className="w-8 h-8 rounded-full"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-teal/10 flex items-center justify-center">
                              <UserIcon className="w-4 h-4 text-teal" />
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-medium text-charcoal">
                              {entry.users?.full_name || 'Unknown'}
                            </p>
                            <p className="text-xs text-stone">{entry.users?.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <DocumentTextIcon className="w-4 h-4 text-stone" />
                          <div>
                            <p className="text-sm text-charcoal">
                              {entry.content_posts?.topic || 'Untitled Post'}
                            </p>
                            <p className="text-xs text-stone capitalize">
                              {entry.content_posts?.content_type?.replace(/_/g, ' ')}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                          {activityTypeLabels[entry.activity_type] || entry.activity_type}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm text-stone">{formatDate(entry.started_at)}</td>
                      <td className="px-5 py-4 text-sm font-medium text-charcoal">
                        {formatDuration(entry.duration_seconds)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
