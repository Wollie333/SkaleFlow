'use client';

import { useState, useEffect, useRef } from 'react';
import { BellIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const loadNotifications = async () => {
    try {
      const res = await fetch('/api/notifications?limit=20');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch {
      // silently fail
    }
  };

  useEffect(() => {
    loadNotifications();
    // Poll every 60 seconds
    const interval = setInterval(loadNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
      });
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch {
      // silently fail
    }
  };

  const typeLabel: Record<string, string> = {
    content_submitted: 'Content Submitted',
    content_approved: 'Content Approved',
    content_rejected: 'Content Rejected',
    revision_requested: 'Revision Requested',
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-cream transition-colors"
      >
        <BellIcon className="w-5 h-5 text-charcoal" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-cream-warm rounded-xl shadow-lg border border-stone/10 z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-stone/10">
            <h3 className="text-sm font-semibold text-charcoal">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs text-teal hover:text-teal/80"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-stone">
                No notifications yet
              </div>
            ) : (
              notifications.map(n => (
                <a
                  key={n.id}
                  href={n.link || '#'}
                  className={`block px-4 py-3 hover:bg-cream transition-colors border-b border-stone/5 ${
                    !n.is_read ? 'bg-teal/5' : ''
                  }`}
                  onClick={() => setIsOpen(false)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-stone mb-0.5">
                        {typeLabel[n.type] || n.type}
                      </p>
                      <p className={`text-sm ${!n.is_read ? 'font-medium text-charcoal' : 'text-stone'}`}>
                        {n.title}
                      </p>
                      {n.body && (
                        <p className="text-xs text-stone mt-0.5 truncate">{n.body}</p>
                      )}
                    </div>
                    <span className="text-[10px] text-stone whitespace-nowrap">
                      {format(new Date(n.created_at), 'MMM d')}
                    </span>
                  </div>
                </a>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
