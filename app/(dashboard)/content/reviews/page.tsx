'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button, PageHeader } from '@/components/ui';
import {
  CheckIcon,
  InboxIcon,
  ClipboardDocumentCheckIcon,
  FunnelIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';
import { SparklesIcon as SparklesOutline } from '@heroicons/react/24/outline';
import { createClient } from '@/lib/supabase/client';
import {
  DocumentTextIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  SparklesIcon,
  CurrencyDollarIcon,
  ExclamationTriangleIcon,
  PhoneIcon,
  ClockIcon,
} from '@heroicons/react/24/solid';
import type { NotificationType } from '@/types/database';

function formatTimeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

const notificationIcons: Record<NotificationType, React.ComponentType<{ className?: string }>> = {
  content_submitted: DocumentTextIcon,
  content_approved: CheckCircleIcon,
  content_rejected: XCircleIcon,
  revision_requested: ArrowPathIcon,
  generation_completed: SparklesIcon,
  change_request_submitted: DocumentTextIcon,
  change_request_approved: CheckCircleIcon,
  change_request_rejected: XCircleIcon,
  change_request_revision: ArrowPathIcon,
  credits_allocated: CurrencyDollarIcon,
  credits_low: ExclamationTriangleIcon,
  call_booked: PhoneIcon,
  call_reminder: ClockIcon,
  call_completed: CheckCircleIcon,
  call_summary_ready: DocumentTextIcon,
  brand_audit_completed: CheckCircleIcon,
  publish_failed: ExclamationTriangleIcon,
};

const notificationColors: Record<NotificationType, { icon: string; bg: string }> = {
  content_submitted: { icon: 'text-teal', bg: 'bg-teal/10' },
  content_approved: { icon: 'text-green-600', bg: 'bg-green-50' },
  content_rejected: { icon: 'text-red-500', bg: 'bg-red-50' },
  revision_requested: { icon: 'text-amber-500', bg: 'bg-amber-50' },
  generation_completed: { icon: 'text-teal', bg: 'bg-teal/10' },
  change_request_submitted: { icon: 'text-blue-500', bg: 'bg-blue-50' },
  change_request_approved: { icon: 'text-green-600', bg: 'bg-green-50' },
  change_request_rejected: { icon: 'text-red-500', bg: 'bg-red-50' },
  change_request_revision: { icon: 'text-amber-500', bg: 'bg-amber-50' },
  credits_allocated: { icon: 'text-teal', bg: 'bg-teal/10' },
  credits_low: { icon: 'text-amber-500', bg: 'bg-amber-50' },
  call_booked: { icon: 'text-blue-500', bg: 'bg-blue-50' },
  call_reminder: { icon: 'text-amber-500', bg: 'bg-amber-50' },
  call_completed: { icon: 'text-green-600', bg: 'bg-green-50' },
  call_summary_ready: { icon: 'text-teal', bg: 'bg-teal/10' },
  brand_audit_completed: { icon: 'text-teal', bg: 'bg-teal/10' },
  publish_failed: { icon: 'text-red-500', bg: 'bg-red-50' },
};

type FilterTab = 'all' | 'unread' | 'approvals' | 'my_content';

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

export default function ContentReviewsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab') as FilterTab | null;
  const supabase = createClient();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeTab, setActiveTab] = useState<FilterTab>(tabParam || 'all');
  const [isLoading, setIsLoading] = useState(true);
  const [contentEngineEnabled, setContentEngineEnabled] = useState(true);

  // Check content engine access
  useEffect(() => {
    async function checkAccess() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: membership } = await supabase
        .from('org_members')
        .select('organization_id, organizations(content_engine_enabled)')
        .eq('user_id', user.id)
        .single();
      const orgData = membership?.organizations as { content_engine_enabled: boolean } | null;
      setContentEngineEnabled(orgData?.content_engine_enabled || false);
    }
    checkAccess();
  }, [supabase]);

  // Sync activeTab with URL parameter
  useEffect(() => {
    if (tabParam && ['all', 'unread', 'approvals', 'my_content'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const LIMIT = 20;

  const handleTabChange = (tab: FilterTab) => {
    setActiveTab(tab);
    const params = new URLSearchParams(searchParams.toString());
    if (tab === 'all') {
      params.delete('tab');
    } else {
      params.set('tab', tab);
    }
    const queryString = params.toString();
    router.push(queryString ? `/content/reviews?${queryString}` : '/content/reviews', { scroll: false });
  };

  const fetchNotifications = useCallback(async (reset = false) => {
    try {
      const currentOffset = reset ? 0 : offset;
      const unreadOnly = activeTab === 'unread' ? '&unread_only=true' : '';
      const res = await fetch(`/api/notifications?limit=${LIMIT}&offset=${currentOffset}${unreadOnly}`);
      if (res.ok) {
        const data = await res.json();
        const newNotifications = data.notifications || [];
        if (reset) {
          setNotifications(newNotifications);
          setOffset(LIMIT);
        } else {
          setNotifications(prev => [...prev, ...newNotifications]);
          setOffset(prev => prev + LIMIT);
        }
        setUnreadCount(data.unreadCount || 0);
        setHasMore(newNotifications.length === LIMIT);
      }
    } catch {
      // Silently fail
    }
    setIsLoading(false);
  }, [activeTab, offset]);

  useEffect(() => {
    setIsLoading(true);
    setOffset(0);
    fetchNotifications(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const filteredNotifications = notifications.filter(n => {
    switch (activeTab) {
      case 'unread':
        return !n.is_read;
      case 'approvals':
        return n.type === 'content_submitted';
      case 'my_content':
        return ['content_approved', 'content_rejected', 'revision_requested'].includes(n.type);
      default:
        return true;
    }
  });

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.is_read) {
      await fetch(`/api/notifications/${notification.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_read: true }),
      });
      setNotifications(prev => prev.map(n =>
        n.id === notification.id ? { ...n, is_read: true } : n
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
    if (notification.link) {
      router.push(notification.link);
    }
  };

  const handleMarkOneRead = async (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation();
    await fetch(`/api/notifications/${notificationId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_read: true }),
    });
    setNotifications(prev => prev.map(n =>
      n.id === notificationId ? { ...n, is_read: true } : n
    ));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const handleMarkAllRead = async () => {
    await fetch('/api/notifications', { method: 'PATCH' });
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);
  };

  const tabs: { key: FilterTab; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'unread', label: 'Unread' },
    { key: 'approvals', label: 'Approvals' },
    { key: 'my_content', label: 'My Content' },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-teal" />
      </div>
    );
  }

  if (!contentEngineEnabled) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <SparklesOutline className="w-16 h-16 text-stone/30 mb-4" />
        <h2 className="text-heading-lg text-charcoal mb-2">Content Engine Locked</h2>
        <p className="text-stone max-w-md">
          Complete all phases in the Brand Engine to unlock Content Reviews.
        </p>
        <Button className="mt-6" onClick={() => window.location.href = '/brand'}>
          Continue Brand Engine
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <PageHeader
          icon={ClipboardDocumentCheckIcon}
          title="Content Reviews"
          breadcrumbs={[
            { label: 'Content' },
            { label: 'Reviews' },
          ]}
          action={
            <div className="flex items-center gap-3">
              {unreadCount > 0 && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal/15 text-teal">
                  {unreadCount} unread
                </span>
              )}
              {unreadCount > 0 && (
                <Button variant="ghost" onClick={handleMarkAllRead} className="text-sm">
                  <CheckIcon className="w-4 h-4 mr-1.5" />
                  Mark all read
                </Button>
              )}
            </div>
          }
        />
      </div>

      {/* Stats summary pills */}
      {notifications.length > 0 && (
        <div className="flex gap-2 mb-4 flex-wrap">
          {unreadCount > 0 && (
            <span className="bg-teal/10 text-teal px-3 py-1 rounded-full text-xs font-medium">
              {unreadCount} Unread
            </span>
          )}
          {(() => {
            const pendingCount = notifications.filter(n => n.type === 'content_submitted').length;
            return pendingCount > 0 ? (
              <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-medium">
                {pendingCount} Pending
              </span>
            ) : null;
          })()}
          {(() => {
            const contentCount = notifications.filter(n => ['content_approved', 'content_rejected', 'revision_requested'].includes(n.type)).length;
            return contentCount > 0 ? (
              <span className="bg-blue-500/10 text-blue-400 px-3 py-1 rounded-full text-xs font-medium">
                {contentCount} Updates
              </span>
            ) : null;
          })()}
        </div>
      )}

      {/* Filter tabs */}
      <div className="mb-4 flex gap-4 border-b border-stone/10 overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => handleTabChange(tab.key)}
            className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex-shrink-0 ${
              activeTab === tab.key
                ? 'border-teal text-teal'
                : 'border-transparent text-stone hover:text-charcoal'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Notification list */}
      {filteredNotifications.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 mx-auto rounded-full bg-teal/10 flex items-center justify-center mb-4">
            {activeTab === 'all' ? (
              <CheckCircleIcon className="w-8 h-8 text-teal" />
            ) : (
              <FunnelIcon className="w-8 h-8 text-teal/50" />
            )}
          </div>
          <h3 className="text-lg font-medium text-charcoal mb-1">
            {activeTab === 'all' ? 'All caught up!' : 'Nothing here yet'}
          </h3>
          <p className="text-sm text-stone">
            {activeTab === 'all'
              ? 'No content reviews to show. Great work!'
              : "Try switching to the 'All' tab to see everything."}
          </p>
        </div>
      ) : (
        <div className="bg-cream-warm rounded-xl border border-stone/10 overflow-hidden divide-y divide-stone/5">
          {filteredNotifications.map(notification => {
            const IconComponent = notificationIcons[notification.type] || DocumentTextIcon;
            const colors = notificationColors[notification.type] || { icon: 'text-stone', bg: 'bg-stone/10' };

            return (
              <button
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`w-full text-left px-5 py-4 hover:bg-cream/50 transition-colors flex gap-4 ${
                  !notification.is_read ? 'bg-teal/[0.02]' : ''
                }`}
              >
                <div className={`mt-0.5 shrink-0 w-9 h-9 rounded-full ${colors.bg} flex items-center justify-center`}>
                  <IconComponent className={`w-5 h-5 ${colors.icon}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm ${!notification.is_read ? 'font-semibold text-charcoal' : 'text-charcoal/80'}`}>
                      {notification.title}
                    </p>
                    <span className="text-xs text-stone/60 shrink-0 mt-0.5">
                      {formatTimeAgo(notification.created_at)}
                    </span>
                  </div>
                  {notification.body && (
                    <p className="text-sm text-stone mt-0.5 line-clamp-2">{notification.body}</p>
                  )}
                </div>
                {!notification.is_read && (
                  <div className="mt-1 shrink-0 flex items-center gap-2">
                    <button
                      onClick={(e) => handleMarkOneRead(e, notification.id)}
                      className="p-1 rounded-md hover:bg-stone/10 transition-colors"
                      title="Mark as read"
                    >
                      <EyeIcon className="w-4 h-4 text-stone/60 hover:text-teal" />
                    </button>
                    <div className="w-2.5 h-2.5 rounded-full bg-teal" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Load more */}
      {hasMore && filteredNotifications.length > 0 && (
        <div className="text-center mt-6">
          <Button
            variant="ghost"
            onClick={() => fetchNotifications(false)}
            className="text-sm text-stone"
          >
            Load more
          </Button>
        </div>
      )}
    </div>
  );
}
