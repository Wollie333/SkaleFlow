'use client';

import { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import {
  ReviewItemCard,
  type ChangeRequestItem,
} from './review-item-card';
import {
  InboxIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';

type TabKey = 'all_pending' | 'brand' | 'content' | 'resolved';

interface Tab {
  key: TabKey;
  label: string;
}

const TABS: Tab[] = [
  { key: 'all_pending', label: 'All Pending' },
  { key: 'brand', label: 'Brand Changes' },
  { key: 'content', label: 'Content Reviews' },
  { key: 'resolved', label: 'Resolved' },
];

function filterItems(
  items: ChangeRequestItem[],
  tab: TabKey
): ChangeRequestItem[] {
  switch (tab) {
    case 'all_pending':
      return items.filter(
        (i) => i.status === 'pending' || i.status === 'revision_requested'
      );
    case 'brand':
      return items.filter(
        (i) =>
          i.feature === 'brand_engine' &&
          (i.status === 'pending' || i.status === 'revision_requested')
      );
    case 'content':
      return items.filter(
        (i) =>
          i.feature === 'content_engine' &&
          (i.status === 'pending' || i.status === 'revision_requested')
      );
    case 'resolved':
      return items.filter(
        (i) => i.status === 'approved' || i.status === 'rejected'
      );
    default:
      return items;
  }
}

function getEmptyMessage(tab: TabKey): string {
  switch (tab) {
    case 'all_pending':
      return 'No pending change requests. All caught up!';
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
    <div className="bg-white rounded-xl border border-teal/[0.08] shadow-[0_2px_12px_rgba(15,31,29,0.03)] px-5 py-4 animate-pulse">
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
  const [items, setItems] = useState<ChangeRequestItem[]>([]);
  const [activeTab, setActiveTab] = useState<TabKey>('all_pending');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    } catch (err) {
      console.error('Failed to fetch reviews:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to load reviews'
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleReview = useCallback(
    async (id: string, action: string, comment?: string) => {
      const res = await fetch(`/api/change-requests/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, comment }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Review action failed');
      }

      // Refresh list after successful review
      await fetchItems();
      setExpandedId(null);
    },
    [fetchItems]
  );

  const handleToggleExpand = useCallback(
    (id: string) => {
      setExpandedId((prev) => (prev === id ? null : id));
    },
    []
  );

  const filteredItems = filterItems(items, activeTab);
  const pendingCount = items.filter(
    (i) => i.status === 'pending' || i.status === 'revision_requested'
  ).length;

  return (
    <div className="space-y-6">
      {/* Summary bar */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-stone">
          <span className="font-semibold text-charcoal">{pendingCount}</span>{' '}
          pending review{pendingCount !== 1 ? 's' : ''}
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
      <div className="border-b border-stone/10">
        <nav className="flex gap-6 -mb-px">
          {TABS.map((tab) => {
            const count = filterItems(items, tab.key).length;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  'pb-3 text-sm font-medium transition-colors whitespace-nowrap',
                  activeTab === tab.key
                    ? 'border-b-2 border-teal text-teal'
                    : 'text-stone hover:text-charcoal'
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
        </nav>
      </div>

      {/* Error state */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-700">{error}</p>
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
