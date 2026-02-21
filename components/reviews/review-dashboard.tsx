'use client';

import { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/useToast';
import {
  ReviewItemCard,
  type ChangeRequestItem,
} from './review-item-card';
import {
  InboxIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';

type TabKey = 'all_pending' | 'assigned_to_me' | 'brand' | 'content' | 'resolved';

interface Tab {
  key: TabKey;
  label: string;
}

const TABS: Tab[] = [
  { key: 'all_pending', label: 'All Pending' },
  { key: 'assigned_to_me', label: 'Assigned to Me' },
  { key: 'brand', label: 'Brand Changes' },
  { key: 'content', label: 'Content Reviews' },
  { key: 'resolved', label: 'Resolved' },
];

interface OrgAdmin {
  user_id: string;
  full_name: string | null;
  email: string;
}

const PRIORITY_ORDER: Record<string, number> = {
  urgent: 0,
  normal: 1,
  low: 2,
};

function sortByPriority(items: ChangeRequestItem[]): ChangeRequestItem[] {
  return [...items].sort((a, b) => {
    const pa = PRIORITY_ORDER[a.priority || 'normal'] ?? 1;
    const pb = PRIORITY_ORDER[b.priority || 'normal'] ?? 1;
    if (pa !== pb) return pa - pb;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
}

function filterItems(
  items: ChangeRequestItem[],
  tab: TabKey,
  currentUserId?: string
): ChangeRequestItem[] {
  let filtered: ChangeRequestItem[];

  switch (tab) {
    case 'all_pending':
      filtered = items.filter(
        (i) => i.status === 'pending' || i.status === 'revision_requested'
      );
      break;
    case 'assigned_to_me':
      filtered = items.filter(
        (i) =>
          (i.status === 'pending' || i.status === 'revision_requested') &&
          i.assigned_to === currentUserId
      );
      break;
    case 'brand':
      filtered = items.filter(
        (i) =>
          i.feature === 'brand_engine' &&
          (i.status === 'pending' || i.status === 'revision_requested')
      );
      break;
    case 'content':
      filtered = items.filter(
        (i) =>
          i.feature === 'content_engine' &&
          (i.status === 'pending' || i.status === 'revision_requested')
      );
      break;
    case 'resolved':
      filtered = items.filter(
        (i) => i.status === 'approved' || i.status === 'rejected'
      );
      break;
    default:
      filtered = items;
  }

  // Sort pending tabs by priority
  if (tab !== 'resolved') {
    return sortByPriority(filtered);
  }

  return filtered;
}

function getEmptyMessage(tab: TabKey): string {
  switch (tab) {
    case 'all_pending':
      return 'No pending change requests. All caught up!';
    case 'assigned_to_me':
      return 'No items assigned to you.';
    case 'brand':
      return 'No pending brand engine changes to review.';
    case 'content':
      return 'No pending content reviews at the moment.';
    case 'resolved':
      return 'No resolved change requests yet.';
    default:
      return 'No items to display.';
  }
}

function SkeletonCard() {
  return (
    <div className="bg-cream-warm rounded-xl border border-teal/[0.08] shadow-[0_2px_12px_rgba(15,31,29,0.03)] px-5 py-4 animate-pulse">
      <div className="flex items-center gap-4">
        <div className="w-9 h-9 rounded-full bg-stone/10" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-stone/10 rounded w-40" />
          <div className="h-3 bg-stone/8 rounded w-56" />
        </div>
        <div className="flex items-center gap-3">
          <div className="h-3 bg-stone/8 rounded w-12" />
          <div className="h-6 bg-stone/10 rounded-full w-16" />
        </div>
      </div>
    </div>
  );
}

export function ReviewDashboard() {
  const toast = useToast();
  const [items, setItems] = useState<ChangeRequestItem[]>([]);
  const [activeTab, setActiveTab] = useState<TabKey>('all_pending');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | undefined>();
  const [orgAdmins, setOrgAdmins] = useState<OrgAdmin[]>([]);

  const fetchItems = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch('/api/change-requests');
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to fetch change requests');
      }
      const data = await res.json();
      setItems(data.changeRequests || []);
      if (data.currentUserId) setCurrentUserId(data.currentUserId);
    } catch (err) {
      console.error('Failed to fetch reviews:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to load reviews'
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch org admins for assignment dropdown
  const fetchAdmins = useCallback(async () => {
    try {
      const res = await fetch('/api/team');
      if (res.ok) {
        const data = await res.json();
        const admins: OrgAdmin[] = (data.members || [])
          .filter((m: { role: string }) => m.role === 'owner' || m.role === 'admin')
          .map((m: { user_id: string; users: { full_name: string | null; email: string } | null }) => ({
            user_id: m.user_id,
            full_name: m.users?.full_name || null,
            email: m.users?.email || '',
          }));
        setOrgAdmins(admins);
      }
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    fetchItems();
    fetchAdmins();
  }, [fetchItems, fetchAdmins]);

  const handleReview = useCallback(
    async (id: string, action: string, comment?: string) => {
      const res = await fetch(`/api/change-requests/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, comment }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        toast.error(body.error || 'Review action failed');
        throw new Error(body.error || 'Review action failed');
      }

      const actionLabels: Record<string, string> = {
        approve: 'approved',
        reject: 'rejected',
        request_revision: 'revision requested',
      };
      toast.success(`Change request ${actionLabels[action] || action}`);

      await fetchItems();
      setExpandedId(null);
    },
    [fetchItems, toast]
  );

  const handleAssign = useCallback(async (id: string, userId: string | null) => {
    const res = await fetch(`/api/change-requests/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'assign', assignedTo: userId }),
    });

    if (res.ok) {
      toast.success(userId ? 'Assigned reviewer' : 'Unassigned reviewer');
      await fetchItems();
    } else {
      toast.error('Failed to assign');
    }
  }, [fetchItems, toast]);

  const handleSetPriority = useCallback(async (id: string, priority: string) => {
    const res = await fetch(`/api/change-requests/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'set_priority', priority }),
    });

    if (res.ok) {
      toast.success(`Priority set to ${priority}`);
      await fetchItems();
    } else {
      toast.error('Failed to set priority');
    }
  }, [fetchItems, toast]);

  const handleToggleExpand = useCallback(
    (id: string) => {
      setExpandedId((prev) => (prev === id ? null : id));
    },
    []
  );

  const filteredItems = filterItems(items, activeTab, currentUserId);
  const pendingCount = items.filter(
    (i) => i.status === 'pending' || i.status === 'revision_requested'
  ).length;
  const assignedToMeCount = items.filter(
    (i) =>
      (i.status === 'pending' || i.status === 'revision_requested') &&
      i.assigned_to === currentUserId
  ).length;

  return (
    <div className="space-y-6">
      {/* Summary bar */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-stone">
          <span className="font-semibold text-charcoal">{pendingCount}</span>{' '}
          pending review{pendingCount !== 1 ? 's' : ''}
          {assignedToMeCount > 0 && (
            <span className="ml-2 text-teal font-medium">({assignedToMeCount} assigned to you)</span>
          )}
        </p>
        <button
          type="button"
          onClick={() => {
            setIsLoading(true);
            fetchItems();
          }}
          className="inline-flex items-center gap-1.5 text-sm text-stone hover:text-teal transition-colors"
          disabled={isLoading}
        >
          <ArrowPathIcon
            className={cn('w-4 h-4', isLoading && 'animate-spin')}
          />
          Refresh
        </button>
      </div>

      {/* Tab navigation */}
      <div className="mb-4 flex gap-4 border-b border-stone/10 overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
        {TABS.map((tab) => {
          const count = filterItems(items, tab.key, currentUserId).length;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'pb-3 px-1 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex-shrink-0',
                activeTab === tab.key
                  ? 'border-teal text-teal'
                  : 'border-transparent text-stone hover:text-charcoal'
              )}
            >
              {tab.label}
              {count > 0 && (
                <span
                  className={cn(
                    'ml-2 text-xs font-semibold px-2 py-0.5 rounded-full',
                    activeTab === tab.key
                      ? 'bg-teal/10 text-teal'
                      : 'bg-stone/10 text-stone'
                  )}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Error state */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Loading skeleton */}
      {isLoading && !error && (
        <div className="space-y-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      )}

      {/* Item list */}
      {!isLoading && !error && filteredItems.length > 0 && (
        <div className="space-y-3">
          {filteredItems.map((item) => (
            <ReviewItemCard
              key={item.id}
              item={item}
              onReview={handleReview}
              isExpanded={expandedId === item.id}
              onToggleExpand={() => handleToggleExpand(item.id)}
              orgAdmins={orgAdmins}
              onAssign={handleAssign}
              onSetPriority={handleSetPriority}
            />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !error && filteredItems.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-14 h-14 rounded-full bg-stone/5 flex items-center justify-center mb-4">
            <InboxIcon className="w-7 h-7 text-stone/40" />
          </div>
          <p className="text-sm text-stone">{getEmptyMessage(activeTab)}</p>
        </div>
      )}
    </div>
  );
}
