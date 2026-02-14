'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/ui/page-header';
import {
  InboxIcon,
  MagnifyingGlassIcon,
  ChatBubbleLeftIcon,
  EnvelopeIcon,
  AtSymbolIcon,
} from '@heroicons/react/24/outline';

interface InboxClientProps {
  organizationId: string;
  initialFilters: {
    type: string;
    platform: string;
    sentiment: string;
    status: string;
  };
}

const FILTER_TYPES = [
  { value: 'all', label: 'All Messages', icon: InboxIcon },
  { value: 'comment', label: 'Comments', icon: ChatBubbleLeftIcon },
  { value: 'dm', label: 'Direct Messages', icon: EnvelopeIcon },
  { value: 'mention', label: 'Mentions', icon: AtSymbolIcon },
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
  { value: 'positive', label: 'Positive' },
  { value: 'neutral', label: 'Neutral' },
  { value: 'negative', label: 'Negative' },
  { value: 'question', label: 'Question' },
];

const FILTER_STATUS = [
  { value: 'all', label: 'All' },
  { value: 'unread', label: 'Unread Only' },
  { value: 'read', label: 'Read Only' },
];

export function InboxClient({ organizationId, initialFilters }: InboxClientProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams();
    const filters = { ...initialFilters, [key]: value };

    Object.entries(filters).forEach(([k, v]) => {
      if (v !== 'all') {
        params.set(k, v);
      }
    });

    const queryString = params.toString();
    router.push(`/social/inbox${queryString ? '?' + queryString : ''}`);
  };

  return (
    <div className="p-6 md:p-8 space-y-6">
      <PageHeader
        title="Social Inbox"
        subtitle="Manage all your social media interactions in one place"
      />

      {/* Filter Tabs */}
      <div className="bg-white rounded-xl border border-stone/10 p-2">
        <div className="flex items-center gap-2 overflow-x-auto">
          {FILTER_TYPES.map((type) => (
            <button
              key={type.value}
              onClick={() => handleFilterChange('type', type.value)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                initialFilters.type === type.value
                  ? 'bg-teal text-white'
                  : 'text-stone hover:bg-stone/10'
              }`}
            >
              <type.icon className="w-4 h-4" />
              {type.label}
            </button>
          ))}
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl border border-stone/10 p-4">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone" />
            <input
              type="text"
              placeholder="Search messages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-stone/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal text-sm"
            />
          </div>

          {/* Platform Filter */}
          <select
            value={initialFilters.platform}
            onChange={(e) => handleFilterChange('platform', e.target.value)}
            className="px-3 py-2 border border-stone/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal text-sm"
          >
            {FILTER_PLATFORMS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          {/* Sentiment Filter */}
          <select
            value={initialFilters.sentiment}
            onChange={(e) => handleFilterChange('sentiment', e.target.value)}
            className="px-3 py-2 border border-stone/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal text-sm"
          >
            {FILTER_SENTIMENT.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={initialFilters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="px-3 py-2 border border-stone/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal text-sm"
          >
            {FILTER_STATUS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Empty State */}
      <div className="bg-white rounded-xl border border-stone/10 p-12 text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-teal/10 rounded-full flex items-center justify-center">
          <InboxIcon className="w-8 h-8 text-teal" />
        </div>
        <h3 className="text-lg font-semibold text-charcoal mb-2">No messages yet</h3>
        <p className="text-sm text-stone mb-4">
          Connect your social media accounts to start receiving interactions here
        </p>
        <p className="text-xs text-stone/60">
          Comments, direct messages, and mentions will appear automatically
        </p>
      </div>
    </div>
  );
}
