'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { ConversationThread } from '@/components/social/conversation-thread';
import {
  MagnifyingGlassIcon,
  InboxIcon,
  ChatBubbleLeftIcon,
  EnvelopeIcon,
  AtSymbolIcon,
  FunnelIcon,
  CheckCircleIcon,
  XMarkIcon,
  ArrowPathIcon,
  UserIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolid } from '@heroicons/react/24/solid';

// ── Platform icon SVGs ──────────────────────────────────────────────
function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z" />
    </svg>
  );
}

function TwitterIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
    </svg>
  );
}

function YouTubeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

// ── Types ───────────────────────────────────────────────────────────

interface SocialInteraction {
  id: string;
  organization_id: string;
  connection_id: string;
  platform: string;
  interaction_type: string;
  platform_interaction_id: string;
  parent_interaction_id: string | null;
  message: string | null;
  author_platform_id: string | null;
  author_name: string | null;
  author_username: string | null;
  author_avatar_url: string | null;
  sentiment: 'positive' | 'neutral' | 'negative' | 'question' | null;
  has_media?: boolean;
  media_urls?: string[];
  published_post_id?: string | null;
  is_read: boolean;
  is_replied: boolean;
  assigned_to: string | null;
  replied_at: string | null;
  replied_by: string | null;
  interaction_timestamp: string;
  created_at: string;
  updated_at: string;
}

interface SocialConnection {
  id: string;
  platform: string;
  platform_username: string | null;
  platform_page_name: string | null;
  is_active: boolean;
}

interface InboxClientProps {
  organizationId: string;
}

// ── Platform config ─────────────────────────────────────────────────

const PLATFORMS = [
  { key: 'all', label: 'All', icon: InboxIcon, color: 'text-charcoal', bgActive: 'bg-charcoal', bgHover: 'hover:bg-charcoal/5' },
  { key: 'facebook', label: 'Facebook', icon: FacebookIcon, color: 'text-[#1877F2]', bgActive: 'bg-[#1877F2]', bgHover: 'hover:bg-[#1877F2]/5' },
  { key: 'linkedin', label: 'LinkedIn', icon: LinkedInIcon, color: 'text-[#0A66C2]', bgActive: 'bg-[#0A66C2]', bgHover: 'hover:bg-[#0A66C2]/5' },
  { key: 'instagram', label: 'Instagram', icon: InstagramIcon, color: 'text-[#E4405F]', bgActive: 'bg-[#E4405F]', bgHover: 'hover:bg-[#E4405F]/5' },
  { key: 'twitter', label: 'X', icon: TwitterIcon, color: 'text-charcoal', bgActive: 'bg-charcoal', bgHover: 'hover:bg-charcoal/5' },
  { key: 'tiktok', label: 'TikTok', icon: TikTokIcon, color: 'text-charcoal', bgActive: 'bg-charcoal', bgHover: 'hover:bg-charcoal/5' },
  { key: 'youtube', label: 'YouTube', icon: YouTubeIcon, color: 'text-[#FF0000]', bgActive: 'bg-[#FF0000]', bgHover: 'hover:bg-[#FF0000]/5' },
];

const TYPE_FILTERS = [
  { value: 'all', label: 'All', icon: InboxIcon },
  { value: 'dm', label: 'DMs', icon: EnvelopeIcon },
  { value: 'comment', label: 'Comments', icon: ChatBubbleLeftIcon },
  { value: 'mention', label: 'Mentions', icon: AtSymbolIcon },
];

const PLATFORM_COLORS: Record<string, string> = {
  linkedin: '#0A66C2',
  facebook: '#1877F2',
  instagram: '#E4405F',
  twitter: '#14171A',
  tiktok: '#000000',
  youtube: '#FF0000',
};

function getPlatformIcon(platform: string) {
  switch (platform) {
    case 'facebook': return FacebookIcon;
    case 'linkedin': return LinkedInIcon;
    case 'instagram': return InstagramIcon;
    case 'twitter': return TwitterIcon;
    case 'tiktok': return TikTokIcon;
    case 'youtube': return YouTubeIcon;
    default: return InboxIcon;
  }
}

// ── Main Component ──────────────────────────────────────────────────

export function InboxClient({ organizationId }: InboxClientProps) {
  // State
  const [interactions, setInteractions] = useState<SocialInteraction[]>([]);
  const [connections, setConnections] = useState<SocialConnection[]>([]);
  const [selectedInteraction, setSelectedInteraction] = useState<SocialInteraction | null>(null);
  const [thread, setThread] = useState<SocialInteraction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [totalUnread, setTotalUnread] = useState(0);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});

  // Filters
  const [activePlatform, setActivePlatform] = useState('all');
  const [activeType, setActiveType] = useState('all');
  const [activeStatus, setActiveStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout>>(null);

  // ── Fetch Data ──────────────────────────────────────────────────
  const fetchInbox = useCallback(async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setLoading(true);
    else setRefreshing(true);

    try {
      const params = new URLSearchParams();
      if (activePlatform !== 'all') params.set('platform', activePlatform);
      if (activeType !== 'all') params.set('type', activeType);
      if (activeStatus !== 'all') params.set('status', activeStatus);
      if (searchQuery) params.set('search', searchQuery);
      if (selectedInteraction) params.set('selected', selectedInteraction.id);

      const res = await fetch(`/api/social/inbox?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch inbox');
      const data = await res.json();

      setInteractions(data.interactions || []);
      setThread(data.thread || []);
      setTotalCount(data.total || 0);
      setTotalUnread(data.totalUnread || 0);
      setUnreadCounts(data.unreadCounts || {});
      setConnections(data.connections || []);

      // If selected interaction is no longer in list, keep it
      // But update it if it exists in the new data
      if (selectedInteraction) {
        const updated = (data.interactions || []).find(
          (i: SocialInteraction) => i.id === selectedInteraction.id
        );
        if (updated) setSelectedInteraction(updated);
      }
    } catch (err) {
      console.error('Error fetching inbox:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activePlatform, activeType, activeStatus, searchQuery, selectedInteraction]);

  useEffect(() => {
    fetchInbox();
  }, [activePlatform, activeType, activeStatus]); // eslint-disable-line react-hooks/exhaustive-deps

  // Debounced search
  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      fetchInbox();
    }, 400);
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [searchQuery]); // eslint-disable-line react-hooks/exhaustive-deps

  // Poll every 30s
  useEffect(() => {
    const interval = setInterval(() => fetchInbox({ silent: true }), 30000);
    return () => clearInterval(interval);
  }, [fetchInbox]);

  // ── Actions ─────────────────────────────────────────────────────
  const handleMarkAsRead = async (interactionId: string) => {
    try {
      await fetch('/api/social/inbox', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interactionId, isRead: true }),
      });
      // Update local state
      setInteractions((prev) =>
        prev.map((i) => (i.id === interactionId ? { ...i, is_read: true } : i))
      );
      if (selectedInteraction?.id === interactionId) {
        setSelectedInteraction((prev) => prev ? { ...prev, is_read: true } : null);
      }
      setTotalUnread((prev) => Math.max(0, prev - 1));
      setUnreadCounts((prev) => {
        const interaction = interactions.find((i) => i.id === interactionId);
        if (!interaction) return prev;
        return {
          ...prev,
          [interaction.platform]: Math.max(0, (prev[interaction.platform] || 0) - 1),
        };
      });
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  const handleSelectInteraction = async (interaction: SocialInteraction) => {
    setSelectedInteraction(interaction);

    // Auto-mark as read
    if (!interaction.is_read) {
      handleMarkAsRead(interaction.id);
    }

    // Fetch thread replies
    try {
      const params = new URLSearchParams({ selected: interaction.id });
      if (activePlatform !== 'all') params.set('platform', activePlatform);
      const res = await fetch(`/api/social/inbox?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setThread(data.thread || []);
      }
    } catch (err) {
      console.error('Error fetching thread:', err);
    }
  };

  const handleReply = async (interactionId: string, message: string) => {
    try {
      const res = await fetch('/api/social/inbox/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interactionId, message }),
      });
      if (!res.ok) throw new Error('Failed to send reply');
      const data = await res.json();

      // Add reply to thread
      if (data.data) {
        setThread((prev) => [...prev, data.data]);
      }

      // Mark as replied in list
      setInteractions((prev) =>
        prev.map((i) =>
          i.id === interactionId ? { ...i, is_replied: true } : i
        )
      );
      if (selectedInteraction?.id === interactionId) {
        setSelectedInteraction((prev) => prev ? { ...prev, is_replied: true } : null);
      }
    } catch (err) {
      console.error('Error sending reply:', err);
    }
  };

  // ── Connected platforms (only show connected ones + "all") ──────
  const connectedPlatformKeys = Array.from(new Set(connections.map((c) => c.platform)));
  const visiblePlatforms = PLATFORMS.filter(
    (p) => p.key === 'all' || connectedPlatformKeys.includes(p.key)
  );

  // ── Render ────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* ── Top Bar ─────────────────────────────────────────────── */}
      <div className="flex-shrink-0 bg-cream-warm border-b border-stone/10">
        {/* Header row */}
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal/10 flex items-center justify-center">
              <InboxIcon className="w-5 h-5 text-teal" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-charcoal">Social Inbox</h1>
              <p className="text-xs text-stone">
                {totalCount} conversation{totalCount !== 1 ? 's' : ''}
                {totalUnread > 0 && (
                  <span className="ml-2 text-teal font-medium">
                    {totalUnread} unread
                  </span>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchInbox({ silent: true })}
              disabled={refreshing}
              className="p-2 rounded-lg text-stone hover:bg-stone/5 transition-colors disabled:opacity-50"
              title="Refresh"
            >
              <ArrowPathIcon className={cn('w-5 h-5', refreshing && 'animate-spin')} />
            </button>
          </div>
        </div>

        {/* Platform icon toggles */}
        <div className="px-6 pb-3 flex items-center gap-1 overflow-x-auto">
          {visiblePlatforms.map((p) => {
            const isActive = activePlatform === p.key;
            const count = p.key === 'all' ? totalUnread : (unreadCounts[p.key] || 0);
            return (
              <button
                key={p.key}
                onClick={() => setActivePlatform(p.key)}
                className={cn(
                  'relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap',
                  isActive
                    ? `${p.bgActive} text-white shadow-sm`
                    : `text-stone ${p.bgHover} hover:text-charcoal`
                )}
              >
                <p.icon className={cn('w-4 h-4', isActive ? 'text-white' : p.color)} />
                <span className="hidden sm:inline">{p.label}</span>
                {count > 0 && (
                  <span
                    className={cn(
                      'min-w-[18px] h-[18px] flex items-center justify-center rounded-full text-[10px] font-bold px-1',
                      isActive
                        ? 'bg-cream-warm/25 text-white'
                        : 'bg-red-500 text-white'
                    )}
                  >
                    {count > 99 ? '99+' : count}
                  </span>
                )}
              </button>
            );
          })}

          {/* Show indicator if no platforms connected */}
          {connectedPlatformKeys.length === 0 && (
            <div className="flex items-center gap-2 px-4 py-2 text-sm text-stone/60">
              <span>No social accounts connected.</span>
              <a href="/settings" className="text-teal hover:underline font-medium">
                Connect accounts
              </a>
            </div>
          )}
        </div>
      </div>

      {/* ── Main Content (Split Panel) ──────────────────────────── */}
      <div className="flex flex-1 min-h-0">
        {/* ── Left Panel: Message List ──────────────────────────── */}
        <div className="w-full md:w-[420px] lg:w-[460px] flex-shrink-0 border-r border-stone/10 flex flex-col bg-cream-warm">
          {/* Search + Type Filters */}
          <div className="p-3 border-b border-stone/10 space-y-2">
            {/* Search bar */}
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone/50" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-9 py-2.5 bg-cream/50 border border-stone/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal text-sm placeholder:text-stone/40"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone/40 hover:text-stone"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Type filter chips + status toggle */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1">
                {TYPE_FILTERS.map((f) => (
                  <button
                    key={f.value}
                    onClick={() => setActiveType(f.value)}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                      activeType === f.value
                        ? 'bg-teal/10 text-teal'
                        : 'text-stone hover:bg-stone/5'
                    )}
                  >
                    <f.icon className="w-3.5 h-3.5" />
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Status dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={cn(
                    'flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors',
                    activeStatus !== 'all'
                      ? 'bg-teal/10 text-teal'
                      : 'text-stone hover:bg-stone/5'
                  )}
                >
                  <FunnelIcon className="w-3.5 h-3.5" />
                  <ChevronDownIcon className="w-3 h-3" />
                </button>
                {showFilters && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowFilters(false)} />
                    <div className="absolute right-0 top-full mt-1 bg-cream-warm rounded-lg shadow-lg border border-stone/10 z-20 py-1 min-w-[140px]">
                      {[
                        { value: 'all', label: 'All messages' },
                        { value: 'unread', label: 'Unread only' },
                        { value: 'read', label: 'Read only' },
                      ].map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => {
                            setActiveStatus(opt.value);
                            setShowFilters(false);
                          }}
                          className={cn(
                            'w-full text-left px-3 py-2 text-sm transition-colors',
                            activeStatus === opt.value
                              ? 'bg-teal/5 text-teal font-medium'
                              : 'text-charcoal hover:bg-stone/5'
                          )}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Interaction list */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-8 flex flex-col items-center justify-center gap-3">
                <div className="w-8 h-8 border-2 border-teal/20 border-t-teal rounded-full animate-spin" />
                <p className="text-sm text-stone">Loading messages...</p>
              </div>
            ) : interactions.length === 0 ? (
              <EmptyState
                hasConnections={connectedPlatformKeys.length > 0}
                hasFilters={activePlatform !== 'all' || activeType !== 'all' || activeStatus !== 'all' || !!searchQuery}
              />
            ) : (
              <div className="divide-y divide-stone/5">
                {interactions.map((interaction) => (
                  <MessageRow
                    key={interaction.id}
                    interaction={interaction}
                    isSelected={selectedInteraction?.id === interaction.id}
                    onClick={() => handleSelectInteraction(interaction)}
                    onMarkAsRead={() => handleMarkAsRead(interaction.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Right Panel: Conversation Detail ──────────────────── */}
        <div className="hidden md:flex flex-1 flex-col bg-cream/30">
          {selectedInteraction ? (
            <ConversationDetail
              interaction={selectedInteraction}
              thread={thread}
              onReply={handleReply}
              onMarkAsRead={handleMarkAsRead}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-4 bg-stone/5 rounded-2xl flex items-center justify-center">
                  <ChatBubbleLeftIcon className="w-10 h-10 text-stone/30" />
                </div>
                <h3 className="text-base font-medium text-stone/60 mb-1">
                  Select a conversation
                </h3>
                <p className="text-sm text-stone/40">
                  Choose a message from the list to view details and reply
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Message Row Component ─────────────────────────────────────────────

function MessageRow({
  interaction,
  isSelected,
  onClick,
  onMarkAsRead,
}: {
  interaction: SocialInteraction;
  isSelected: boolean;
  onClick: () => void;
  onMarkAsRead: () => void;
}) {
  const PlatformIcon = getPlatformIcon(interaction.platform);
  const platformColor = PLATFORM_COLORS[interaction.platform] || '#6B7280';

  const typeLabel = interaction.interaction_type === 'dm' ? 'DM' :
    interaction.interaction_type.charAt(0).toUpperCase() + interaction.interaction_type.slice(1);

  return (
    <div
      onClick={onClick}
      className={cn(
        'px-4 py-3.5 cursor-pointer transition-all group',
        isSelected
          ? 'bg-teal/5 border-l-2 border-l-teal'
          : 'border-l-2 border-l-transparent hover:bg-stone/3',
        !interaction.is_read && !isSelected && 'bg-blue-50/40'
      )}
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          {interaction.author_avatar_url ? (
            <img
              src={interaction.author_avatar_url}
              alt={interaction.author_name || ''}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-stone/10 flex items-center justify-center">
              <UserIcon className="w-5 h-5 text-stone/60" />
            </div>
          )}
          {/* Platform indicator dot */}
          <div
            className="absolute -bottom-0.5 -right-0.5 w-4.5 h-4.5 rounded-full bg-cream-warm p-0.5 flex items-center justify-center"
          >
            <PlatformIcon
              className="w-3 h-3"
              style={{ color: platformColor } as any}
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span
                className={cn(
                  'text-sm truncate',
                  !interaction.is_read ? 'font-semibold text-charcoal' : 'font-medium text-charcoal/80'
                )}
              >
                {interaction.author_name || interaction.author_username || 'Unknown'}
              </span>
              {!interaction.is_read && (
                <span className="w-2 h-2 rounded-full bg-teal flex-shrink-0" />
              )}
            </div>
            <span className="text-[11px] text-stone/60 whitespace-nowrap flex-shrink-0">
              {formatDistanceToNow(new Date(interaction.interaction_timestamp), { addSuffix: true })}
            </span>
          </div>

          {/* Username + type */}
          <div className="flex items-center gap-2 mt-0.5">
            {interaction.author_username && (
              <span className="text-xs text-stone/50 truncate">
                @{interaction.author_username}
              </span>
            )}
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-stone/8 text-stone/60 font-medium">
              {typeLabel}
            </span>
          </div>

          {/* Message preview */}
          <p
            className={cn(
              'text-sm mt-1 line-clamp-2 leading-relaxed',
              !interaction.is_read ? 'text-charcoal' : 'text-stone/70'
            )}
          >
            {interaction.message || 'No message content'}
          </p>

          {/* Status row */}
          <div className="flex items-center gap-2 mt-1.5">
            {interaction.is_replied && (
              <span className="flex items-center gap-1 text-[10px] text-green-600 font-medium">
                <CheckCircleSolid className="w-3 h-3" />
                Replied
              </span>
            )}
            {interaction.sentiment && (
              <SentimentDot sentiment={interaction.sentiment} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Conversation Detail Panel ─────────────────────────────────────────

function ConversationDetail({
  interaction,
  thread,
  onReply,
  onMarkAsRead,
}: {
  interaction: SocialInteraction;
  thread: SocialInteraction[];
  onReply: (id: string, msg: string) => Promise<void>;
  onMarkAsRead: (id: string) => void;
}) {
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const PlatformIcon = getPlatformIcon(interaction.platform);
  const platformColor = PLATFORM_COLORS[interaction.platform] || '#6B7280';
  const platformLabel = PLATFORMS.find((p) => p.key === interaction.platform)?.label || interaction.platform;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [thread.length]);

  const handleSend = async () => {
    if (!replyText.trim() || sending) return;
    setSending(true);
    try {
      await onReply(interaction.id, replyText.trim());
      setReplyText('');
    } catch (err) {
      console.error('Error sending:', err);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* ── Detail Header ──────────────────────────────────────── */}
      <div className="flex-shrink-0 bg-cream-warm border-b border-stone/10 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Avatar */}
            {interaction.author_avatar_url ? (
              <img
                src={interaction.author_avatar_url}
                alt={interaction.author_name || ''}
                className="w-11 h-11 rounded-full object-cover"
              />
            ) : (
              <div className="w-11 h-11 rounded-full bg-stone/10 flex items-center justify-center">
                <UserIcon className="w-6 h-6 text-stone/60" />
              </div>
            )}
            <div>
              <h2 className="font-semibold text-charcoal text-sm">
                {interaction.author_name || interaction.author_username || 'Unknown User'}
              </h2>
              <div className="flex items-center gap-2 mt-0.5">
                {interaction.author_username && (
                  <span className="text-xs text-stone/50">@{interaction.author_username}</span>
                )}
                <span className="flex items-center gap-1 text-xs text-stone/60">
                  <PlatformIcon className="w-3 h-3" style={{ color: platformColor } as any} />
                  {platformLabel}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {interaction.sentiment && (
              <SentimentBadge sentiment={interaction.sentiment} />
            )}
            <span
              className={cn(
                'text-xs px-2.5 py-1 rounded-full font-medium capitalize',
                interaction.interaction_type === 'dm'
                  ? 'bg-purple-50 text-purple-700'
                  : interaction.interaction_type === 'mention'
                  ? 'bg-amber-50 text-amber-700'
                  : 'bg-stone/8 text-stone/70'
              )}
            >
              {interaction.interaction_type === 'dm' ? 'Direct Message' : interaction.interaction_type}
            </span>
          </div>
        </div>
      </div>

      {/* ── Messages / Thread ──────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {/* Original message */}
        <MessageBubble
          message={interaction.message || ''}
          authorName={interaction.author_name || interaction.author_username || 'Unknown'}
          authorAvatar={interaction.author_avatar_url}
          timestamp={interaction.interaction_timestamp}
          isOwn={false}
          hasMedia={interaction.has_media}
          mediaUrls={interaction.media_urls}
        />

        {/* Thread replies */}
        {thread.map((reply) => (
          <MessageBubble
            key={reply.id}
            message={reply.message || ''}
            authorName={reply.author_name || 'You'}
            authorAvatar={reply.author_avatar_url}
            timestamp={reply.interaction_timestamp}
            isOwn={reply.author_name === 'You'}
          />
        ))}

        <div ref={messagesEndRef} />
      </div>

      {/* ── Reply Composer ─────────────────────────────────────── */}
      <div className="flex-shrink-0 bg-cream-warm border-t border-stone/10 p-4">
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Reply to ${interaction.author_name || 'this message'}...`}
              rows={2}
              className="w-full px-4 py-3 bg-cream/50 border border-stone/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal resize-none text-sm placeholder:text-stone/40"
            />
            <p className="text-[10px] text-stone/40 mt-1 ml-1">
              Press Ctrl+Enter to send
            </p>
          </div>
          <button
            onClick={handleSend}
            disabled={!replyText.trim() || sending}
            className={cn(
              'px-5 py-3 rounded-xl text-sm font-medium transition-all mb-5',
              replyText.trim() && !sending
                ? 'bg-teal text-white hover:bg-teal/90 shadow-sm'
                : 'bg-stone/10 text-stone/30 cursor-not-allowed'
            )}
          >
            {sending ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              'Send'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Message Bubble ────────────────────────────────────────────────────

function MessageBubble({
  message,
  authorName,
  authorAvatar,
  timestamp,
  isOwn,
  hasMedia,
  mediaUrls,
}: {
  message: string;
  authorName: string;
  authorAvatar?: string | null;
  timestamp: string;
  isOwn: boolean;
  hasMedia?: boolean;
  mediaUrls?: string[];
}) {
  return (
    <div className={cn('flex gap-3', isOwn && 'flex-row-reverse')}>
      {/* Avatar */}
      <div className="flex-shrink-0">
        {authorAvatar ? (
          <img
            src={authorAvatar}
            alt={authorName}
            className="w-8 h-8 rounded-full object-cover"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-stone/10 flex items-center justify-center">
            <UserIcon className="w-4 h-4 text-stone/60" />
          </div>
        )}
      </div>

      {/* Bubble */}
      <div className={cn('max-w-[70%] space-y-1', isOwn && 'items-end')}>
        <div className={cn('flex items-center gap-2', isOwn && 'flex-row-reverse')}>
          <span className="text-xs font-medium text-charcoal/70">{authorName}</span>
          <span className="text-[10px] text-stone/40">
            {formatDistanceToNow(new Date(timestamp), { addSuffix: true })}
          </span>
        </div>
        <div
          className={cn(
            'px-4 py-3 rounded-2xl text-sm leading-relaxed',
            isOwn
              ? 'bg-teal text-white rounded-br-md'
              : 'bg-cream-warm border border-stone/10 text-charcoal rounded-bl-md shadow-sm'
          )}
        >
          {message}
        </div>

        {/* Media */}
        {hasMedia && mediaUrls && mediaUrls.length > 0 && (
          <div className="grid grid-cols-2 gap-2 mt-2">
            {mediaUrls.slice(0, 4).map((url, i) => (
              <img
                key={i}
                src={url}
                alt={`Media ${i + 1}`}
                className="rounded-lg w-full h-28 object-cover"
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Sentiment Indicators ──────────────────────────────────────────────

function SentimentDot({ sentiment }: { sentiment: string }) {
  const colors: Record<string, string> = {
    positive: 'bg-green-400',
    neutral: 'bg-stone/40',
    negative: 'bg-red-400',
    question: 'bg-blue-400',
  };
  return (
    <span
      className={cn('w-2 h-2 rounded-full', colors[sentiment] || 'bg-stone/20')}
      title={sentiment}
    />
  );
}

function SentimentBadge({ sentiment }: { sentiment: string }) {
  const config: Record<string, { label: string; className: string }> = {
    positive: { label: 'Positive', className: 'bg-green-50 text-green-700 border-green-100' },
    neutral: { label: 'Neutral', className: 'bg-stone/8 text-stone/70 border-stone/10' },
    negative: { label: 'Negative', className: 'bg-red-50 text-red-700 border-red-100' },
    question: { label: 'Question', className: 'bg-blue-50 text-blue-700 border-blue-100' },
  };
  const c = config[sentiment];
  if (!c) return null;
  return (
    <span className={cn('text-xs px-2.5 py-1 rounded-full font-medium border', c.className)}>
      {c.label}
    </span>
  );
}

// ── Empty State ───────────────────────────────────────────────────────

function EmptyState({
  hasConnections,
  hasFilters,
}: {
  hasConnections: boolean;
  hasFilters: boolean;
}) {
  if (hasFilters) {
    return (
      <div className="p-12 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 bg-stone/5 rounded-2xl flex items-center justify-center mb-4">
          <FunnelIcon className="w-8 h-8 text-stone/30" />
        </div>
        <h3 className="text-sm font-medium text-charcoal/70 mb-1">No matching messages</h3>
        <p className="text-xs text-stone/50 max-w-[260px]">
          Try adjusting your filters or search to find what you&apos;re looking for
        </p>
      </div>
    );
  }

  if (!hasConnections) {
    return (
      <div className="p-12 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 bg-teal/5 rounded-2xl flex items-center justify-center mb-4">
          <InboxIcon className="w-8 h-8 text-teal/40" />
        </div>
        <h3 className="text-sm font-medium text-charcoal/70 mb-1">Connect your accounts</h3>
        <p className="text-xs text-stone/50 max-w-[260px] mb-4">
          Link your social media accounts to start managing all your messages in one place
        </p>
        <a
          href="/settings"
          className="px-4 py-2 bg-teal text-white text-sm font-medium rounded-lg hover:bg-teal/90 transition-colors"
        >
          Connect Accounts
        </a>
      </div>
    );
  }

  return (
    <div className="p-12 flex flex-col items-center justify-center text-center">
      <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center mb-4">
        <CheckCircleIcon className="w-8 h-8 text-green-400" />
      </div>
      <h3 className="text-sm font-medium text-charcoal/70 mb-1">All caught up!</h3>
      <p className="text-xs text-stone/50 max-w-[260px]">
        No messages yet. New comments, DMs, and mentions will appear here as they come in.
      </p>
    </div>
  );
}
