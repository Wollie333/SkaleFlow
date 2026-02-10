'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { BellIcon, UserCircleIcon, CheckIcon, InboxIcon, BoltIcon } from '@heroicons/react/24/outline';
import {
  DocumentTextIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  SparklesIcon,
  CurrencyDollarIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/solid';
import { useCreditBalance } from '@/hooks/useCreditBalance';
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
};

const notificationColors: Record<NotificationType, string> = {
  content_submitted: 'text-teal',
  content_approved: 'text-green-500',
  content_rejected: 'text-red-500',
  revision_requested: 'text-amber-500',
  generation_completed: 'text-teal',
  change_request_submitted: 'text-blue-500',
  change_request_approved: 'text-green-500',
  change_request_rejected: 'text-red-500',
  change_request_revision: 'text-amber-500',
  credits_allocated: 'text-teal',
  credits_low: 'text-amber-500',
};

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

interface HeaderProps {
  user?: {
    email: string;
    full_name?: string;
  };
  initialUnreadCount?: number;
  organizationId?: string;
  draftCount?: number;
}

export function Header({ user, initialUnreadCount = 0, organizationId, draftCount = 0 }: HeaderProps) {
  const router = useRouter();
  const supabase = createClient();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { balance: creditBalance } = useCreditBalance(organizationId || null);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications?limit=10');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch {
      // Silently fail
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

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
    setIsOpen(false);
    if (notification.link) {
      router.push(notification.link);
    }
  };

  const handleMarkAllRead = async () => {
    await fetch('/api/notifications', { method: 'PATCH' });
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-dark/95 backdrop-blur-md border-b border-teal/12">
      <div className="h-full px-6 flex items-center justify-between">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="font-serif font-bold text-xl text-cream tracking-wide">
            SkaleFlow
          </span>
          <span className="text-xs text-stone font-normal">by Mana</span>
        </Link>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {/* Credit Balance */}
          {creditBalance && (
            <Link
              href="/billing"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                creditBalance.isSuperAdmin
                  ? 'bg-teal/20 text-teal-300 hover:bg-teal/30'
                  : !creditBalance.hasCredits
                    ? 'bg-red-500/20 text-red-300 hover:bg-red-500/30'
                    : creditBalance.totalRemaining < 2000
                      ? 'bg-amber-500/15 text-amber-300 hover:bg-amber-500/25'
                      : 'bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25'
              }`}
              title={creditBalance.isSuperAdmin
                ? `API Spend: $${(creditBalance.apiCostUSDAllTime || 0).toFixed(2)} all time | $${(creditBalance.apiCostUSD30d || 0).toFixed(2)} (30d) | Credits bypass active`
                : `Monthly: ${creditBalance.monthlyRemaining.toLocaleString()} / ${creditBalance.monthlyTotal.toLocaleString()} | Top-up: ${creditBalance.topupRemaining.toLocaleString()}`
              }
            >
              <BoltIcon className="w-3.5 h-3.5" />
              {creditBalance.isSuperAdmin ? (
                <span>${(creditBalance.apiCostUSDAllTime || 0).toFixed(2)} spent</span>
              ) : (
                <span>{creditBalance.totalRemaining.toLocaleString()}</span>
              )}
            </Link>
          )}

          {/* Drafts */}
          <Link
            href="/content/drafts"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-dark-light/80 text-stone hover:text-cream hover:bg-teal/15 transition-colors"
          >
            <DocumentTextIcon className="w-3.5 h-3.5" />
            <span>Drafts</span>
            {draftCount > 0 && (
              <span className="min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-gold text-dark text-[10px] font-bold px-1">
                {draftCount > 99 ? '99+' : draftCount}
              </span>
            )}
          </Link>

          {/* Notifications */}
          <div ref={dropdownRef} className="relative">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="relative p-2 rounded-lg text-stone hover:text-cream hover:bg-teal/10 transition-colors"
            >
              <BellIcon className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-5 h-5 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>

            {isOpen && (
              <div className="absolute right-0 top-full mt-2 w-96 bg-white border border-stone/15 rounded-xl shadow-2xl overflow-hidden z-[60]">
                {/* Header */}
                <div className="px-4 py-3 border-b border-stone/10 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-charcoal">Notifications</h3>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-xs text-teal hover:text-teal/80 font-medium flex items-center gap-1"
                    >
                      <CheckIcon className="w-3.5 h-3.5" />
                      Mark all read
                    </button>
                  )}
                </div>

                {/* List */}
                <div className="max-h-96 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="py-12 text-center">
                      <BellIcon className="w-8 h-8 mx-auto text-stone/30 mb-2" />
                      <p className="text-sm text-stone">No notifications yet</p>
                    </div>
                  ) : (
                    notifications.map(notification => {
                      const IconComponent = notificationIcons[notification.type] || DocumentTextIcon;
                      const iconColor = notificationColors[notification.type] || 'text-stone';

                      return (
                        <button
                          key={notification.id}
                          onClick={() => handleNotificationClick(notification)}
                          className={`w-full text-left px-4 py-3 hover:bg-cream-warm/50 transition-colors flex gap-3 ${
                            !notification.is_read ? 'bg-teal/[0.03]' : ''
                          }`}
                        >
                          <div className={`mt-0.5 shrink-0 ${iconColor}`}>
                            <IconComponent className="w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm ${!notification.is_read ? 'font-semibold text-charcoal' : 'text-charcoal/80'}`}>
                              {notification.title}
                            </p>
                            {notification.body && (
                              <p className="text-xs text-stone mt-0.5 line-clamp-2">{notification.body}</p>
                            )}
                            <p className="text-xs text-stone/60 mt-1">{formatTimeAgo(notification.created_at)}</p>
                          </div>
                          {!notification.is_read && (
                            <div className="mt-2 shrink-0">
                              <div className="w-2 h-2 rounded-full bg-teal" />
                            </div>
                          )}
                        </button>
                      );
                    })
                  )}
                </div>

                {/* Footer */}
                <div className="px-4 py-2.5 border-t border-stone/10">
                  <Link
                    href="/reviews"
                    onClick={() => setIsOpen(false)}
                    className="text-sm text-teal hover:text-teal/80 font-medium flex items-center justify-center gap-1.5"
                  >
                    <InboxIcon className="w-4 h-4" />
                    View all notifications
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* User menu */}
          <div className="relative group">
            <button className="flex items-center gap-3 p-2 rounded-lg hover:bg-teal/10 transition-colors">
              <UserCircleIcon className="w-8 h-8 text-stone" />
              <div className="text-left hidden sm:block">
                <p className="text-sm font-medium text-cream">
                  {user?.full_name || user?.email?.split('@')[0]}
                </p>
                <p className="text-xs text-stone">{user?.email}</p>
              </div>
            </button>

            {/* Dropdown */}
            <div className="absolute right-0 top-full mt-2 w-48 py-2 bg-dark-light border border-teal/12 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
              <Link
                href="/settings"
                className="block px-4 py-2 text-sm text-stone hover:text-cream hover:bg-teal/10 transition-colors"
              >
                Settings
              </Link>
              <button
                onClick={handleSignOut}
                className="w-full text-left px-4 py-2 text-sm text-stone hover:text-cream hover:bg-teal/10 transition-colors"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
