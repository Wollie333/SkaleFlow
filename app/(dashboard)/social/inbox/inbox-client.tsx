'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/ui/page-header';
import { InboxIcon, FunnelIcon } from '@heroicons/react/24/outline';
import { InteractionList } from '@/components/social/interaction-list';
import { ConversationThread } from '@/components/social/conversation-thread';

interface InboxClientProps {
  interactions: any[];
  unreadCount: number;
  teamMembers: any[];
  savedReplies: any[];
  initialFilters: {
    type: string;
    platform: string;
    sentiment: string;
    status?: string;
  };
}

const FILTER_TYPES = [
  { value: 'all', label: 'All Messages' },
  { value: 'comment', label: 'Comments' },
  { value: 'dm', label: 'Direct Messages' },
  { value: 'mention', label: 'Mentions' },
];

const FILTER_PLATFORMS = [
  { value: 'all', label: 'All Platforms' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'twitter', label: 'Twitter' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'youtube', label: 'YouTube' },
];

const FILTER_SENTIMENT = [
  { value: 'all', label: 'All Sentiment' },
  { value: 'positive', label: '😊 Positive' },
  { value: 'neutral', label: '😐 Neutral' },
  { value: 'negative', label: '😞 Negative' },
  { value: 'question', label: '❓ Question' },
];

const FILTER_STATUS = [
  { value: 'all', label: 'All Status' },
  { value: 'unread', label: 'Unread' },
  { value: 'read', label: 'Read' },
];

export function InboxClient({
  interactions,
  unreadCount,
  teamMembers,
  savedReplies,
  initialFilters,
}: InboxClientProps) {
  const router = useRouter();
  const [selectedInteraction, setSelectedInteraction] = useState<any | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams();
    const filters = { ...initialFilters, [key]: value };

    Object.entries(filters).forEach(([k, v]) => {
      if (v !== 'all') {
        params.set(k, v);
      }
    });

    router.push(`/social/inbox?${params.toString()}`);
  };

  const handleInteractionClick = (interaction: any) => {
    setSelectedInteraction(interaction);
  };

  const handleMarkAsRead = async (interactionId: string) => {
    try {
      await fetch('/api/social/inbox', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interactionId, isRead: true }),
      });
      router.refresh();
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const handleReply = async (interactionId: string, message: string) => {
    try {
      const response = await fetch('/api/social/inbox/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interactionId, message }),
      });

      if (response.ok) {
        router.refresh();
        // Optionally close the thread or show success message
      }
    } catch (error) {
      console.error('Error replying:', error);
    }
  };

  return (
    <div className="min-h-screen bg-cream pb-8">
      <PageHeader
        title="Social Inbox"
        subtitle={`Manage all your social media interactions${unreadCount > 0 ? ` • ${unreadCount} unread` : ''}`}
        icon={InboxIcon}
        breadcrumbs={[
          { label: 'Social Media', href: '/social/inbox' },
          { label: 'Inbox', href: '/social/inbox' },
        ]}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        {/* Filters */}
        <div className="bg-white rounded-xl border border-stone/10 mb-6">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-stone/5 transition-colors"
          >
            <div className="flex items-center gap-3">
              <FunnelIcon className="w-5 h-5 text-teal" />
              <span className="font-medium text-charcoal">Filters</span>
            </div>
            <span className="text-sm text-stone">{showFilters ? 'Hide' : 'Show'}</span>
          </button>

          {showFilters && (
            <div className="px-6 pb-6 border-t border-stone/10 pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Type Filter */}
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-2">Type</label>
                  <select
                    value={initialFilters.type}
                    onChange={(e) => handleFilterChange('type', e.target.value)}
                    className="w-full px-3 py-2 border border-stone/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal"
                  >
                    {FILTER_TYPES.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Platform Filter */}
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-2">Platform</label>
                  <select
                    value={initialFilters.platform}
                    onChange={(e) => handleFilterChange('platform', e.target.value)}
                    className="w-full px-3 py-2 border border-stone/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal"
                  >
                    {FILTER_PLATFORMS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Sentiment Filter */}
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-2">Sentiment</label>
                  <select
                    value={initialFilters.sentiment}
                    onChange={(e) => handleFilterChange('sentiment', e.target.value)}
                    className="w-full px-3 py-2 border border-stone/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal"
                  >
                    {FILTER_SENTIMENT.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Status Filter */}
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-2">Status</label>
                  <select
                    value={initialFilters.status || 'all'}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    className="w-full px-3 py-2 border border-stone/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal"
                  >
                    {FILTER_STATUS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Interaction List */}
          <div className="lg:col-span-2">
            <InteractionList
              interactions={interactions}
              selectedInteraction={selectedInteraction}
              onInteractionClick={handleInteractionClick}
              onMarkAsRead={handleMarkAsRead}
            />
          </div>

          {/* Detail Panel */}
          <div className="lg:col-span-1">
            {selectedInteraction ? (
              <ConversationThread
                interaction={selectedInteraction}
                onReply={handleReply}
                savedReplies={savedReplies}
                teamMembers={teamMembers}
              />
            ) : (
              <div className="bg-white rounded-xl border border-stone/10 p-8 text-center">
                <InboxIcon className="w-12 h-12 text-stone/40 mx-auto mb-4" />
                <p className="text-stone text-sm">Select a message to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
