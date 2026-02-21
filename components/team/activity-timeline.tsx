'use client';

import { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import {
  EnvelopeIcon,
  UserPlusIcon,
  UserMinusIcon,
  ShieldCheckIcon,
  AdjustmentsHorizontalIcon,
  CurrencyDollarIcon,
  XCircleIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';

interface ActivityEntry {
  id: string;
  actor_id: string;
  action: string;
  target_user_id: string | null;
  target_email: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  actor?: { full_name: string | null; email: string };
  target?: { full_name: string | null; email: string } | null;
}

interface ActivityTimelineProps {
  className?: string;
}

const ACTION_CONFIG: Record<string, {
  icon: React.ElementType;
  iconBg: string;
  label: (entry: ActivityEntry) => string;
}> = {
  member_invited: {
    icon: EnvelopeIcon,
    iconBg: 'bg-teal/10 text-teal',
    label: (e) => `invited ${e.metadata?.email || e.target_email || 'someone'} to the team`,
  },
  member_joined: {
    icon: UserPlusIcon,
    iconBg: 'bg-green-100 text-green-600',
    label: () => 'joined the team',
  },
  member_removed: {
    icon: UserMinusIcon,
    iconBg: 'bg-red-100 text-red-600',
    label: (e) => `removed ${e.target?.full_name || e.target?.email || 'a member'} from the team`,
  },
  role_changed: {
    icon: ShieldCheckIcon,
    iconBg: 'bg-purple-100 text-purple-600',
    label: (e) => `changed ${e.target?.full_name || 'a member'}'s role from ${e.metadata?.previousRole || '?'} to ${e.metadata?.newRole || '?'}`,
  },
  permission_updated: {
    icon: AdjustmentsHorizontalIcon,
    iconBg: 'bg-amber-100 text-amber-600',
    label: (e) => `updated permissions for ${e.target?.full_name || 'a member'} (${e.metadata?.feature || ''})`,
  },
  credits_allocated: {
    icon: CurrencyDollarIcon,
    iconBg: 'bg-green-100 text-green-600',
    label: (e) => `allocated ${e.metadata?.amount || '?'} credits to ${e.target?.full_name || 'a member'}`,
  },
  credits_reclaimed: {
    icon: CurrencyDollarIcon,
    iconBg: 'bg-amber-100 text-amber-600',
    label: (e) => `reclaimed ${e.metadata?.amount || '?'} credits from ${e.target?.full_name || 'a member'}`,
  },
  invite_cancelled: {
    icon: XCircleIcon,
    iconBg: 'bg-red-100 text-red-600',
    label: () => 'cancelled a pending invitation',
  },
  invite_resent: {
    icon: ArrowPathIcon,
    iconBg: 'bg-teal/10 text-teal',
    label: (e) => `resent invitation to ${e.metadata?.email || 'someone'}`,
  },
};

function getRelativeTime(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' });
}

export function ActivityTimeline({ className }: ActivityTimelineProps) {
  const [entries, setEntries] = useState<ActivityEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [actionFilter, setActionFilter] = useState('all');

  const fetchActivity = useCallback(async (pageNum: number, append: boolean) => {
    try {
      const params = new URLSearchParams({ page: String(pageNum), limit: '20' });
      if (actionFilter !== 'all') params.set('action', actionFilter);
      const res = await fetch(`/api/team/activity?${params}`);
      if (res.ok) {
        const data = await res.json();
        const newEntries = data.entries || [];
        setEntries(prev => append ? [...prev, ...newEntries] : newEntries);
        setHasMore(newEntries.length === 20);
      }
    } catch {
      // silent
    } finally {
      setIsLoading(false);
    }
  }, [actionFilter]);

  useEffect(() => {
    setIsLoading(true);
    setPage(1);
    fetchActivity(1, false);
  }, [fetchActivity]);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchActivity(nextPage, true);
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Filter */}
      <div className="flex items-center gap-3">
        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="px-3 py-1.5 border border-stone/10 rounded-lg text-charcoal bg-cream-warm text-xs focus:outline-none focus:ring-2 focus:ring-teal/20"
        >
          <option value="all">All Actions</option>
          <option value="member_invited">Invitations</option>
          <option value="role_changed">Role Changes</option>
          <option value="permission_updated">Permission Changes</option>
          <option value="credits_allocated">Credit Allocations</option>
          <option value="member_removed">Removals</option>
        </select>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-start gap-3 animate-pulse">
              <div className="w-8 h-8 rounded-full bg-stone/10" />
              <div className="flex-1 space-y-1">
                <div className="h-4 bg-stone/10 rounded w-3/4" />
                <div className="h-3 bg-stone/8 rounded w-20" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Timeline */}
      {!isLoading && entries.length > 0 && (
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-4 top-0 bottom-0 w-px bg-stone/10" />

          <div className="space-y-4">
            {entries.map(entry => {
              const config = ACTION_CONFIG[entry.action];
              const Icon = config?.icon || AdjustmentsHorizontalIcon;
              const iconBg = config?.iconBg || 'bg-stone/10 text-stone';
              const description = config?.label(entry) || entry.action.replace(/_/g, ' ');
              const actorName = entry.actor?.full_name || entry.actor?.email || 'Unknown';

              return (
                <div key={entry.id} className="relative flex items-start gap-3 pl-0">
                  <div className={cn('relative z-10 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0', iconBg)}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0 pt-0.5">
                    <p className="text-sm text-charcoal">
                      <span className="font-semibold">{actorName}</span>{' '}
                      {description}
                    </p>
                    <p className="text-xs text-stone mt-0.5">{getRelativeTime(entry.created_at)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && entries.length === 0 && (
        <div className="text-center py-8 text-sm text-stone">
          No activity recorded yet.
        </div>
      )}

      {/* Load more */}
      {hasMore && entries.length > 0 && (
        <button
          type="button"
          onClick={handleLoadMore}
          className="w-full text-center text-xs text-teal hover:text-teal-light py-2"
        >
          Load more
        </button>
      )}
    </div>
  );
}
