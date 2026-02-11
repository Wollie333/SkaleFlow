'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { MentionCard } from '@/components/social/mention-card';
import { SentimentChart } from '@/components/social/sentiment-chart';
import { KeywordManager } from '@/components/social/keyword-manager';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  PlusIcon,
  ChartBarIcon,
  FireIcon,
  BellIcon,
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface ListeningDashboardClientProps {
  keywords: any[];
  mentions: any[];
  sentimentCounts: { positive: number; neutral: number; negative: number };
  trends: any[];
  competitors: any[];
  organizationId: string;
}

const SENTIMENT_FILTERS = ['all', 'positive', 'neutral', 'negative', 'question'];
const PLATFORM_FILTERS = [
  'all',
  'twitter',
  'linkedin',
  'facebook',
  'instagram',
  'reddit',
  'news',
];

export function ListeningDashboardClient({
  keywords,
  mentions: initialMentions,
  sentimentCounts,
  trends,
  competitors,
  organizationId,
}: ListeningDashboardClientProps) {
  const [mentions, setMentions] = useState(initialMentions);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSentiment, setSelectedSentiment] = useState('all');
  const [selectedPlatform, setSelectedPlatform] = useState('all');
  const [showReadOnly, setShowReadOnly] = useState(false);
  const [showKeywordManager, setShowKeywordManager] = useState(false);

  // Filter mentions
  const filteredMentions = mentions.filter((mention) => {
    const matchesSearch =
      searchQuery === '' ||
      mention.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mention.author_name?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesSentiment =
      selectedSentiment === 'all' || mention.sentiment === selectedSentiment;

    const matchesPlatform =
      selectedPlatform === 'all' || mention.platform === selectedPlatform;

    const matchesRead = showReadOnly || !mention.is_read;

    return matchesSearch && matchesSentiment && matchesPlatform && matchesRead;
  });

  const handleMarkAsRead = async (id: string) => {
    try {
      const response = await fetch('/api/social/listening/mentions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mentionId: id, isRead: true }),
      });

      if (!response.ok) throw new Error('Failed to mark as read');

      setMentions(mentions.map((m) => (m.id === id ? { ...m, is_read: true } : m)));
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const handleToggleFlag = async (id: string, currentFlag: boolean) => {
    try {
      const response = await fetch('/api/social/listening/mentions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mentionId: id, isFlagged: !currentFlag }),
      });

      if (!response.ok) throw new Error('Failed to toggle flag');

      setMentions(
        mentions.map((m) => (m.id === id ? { ...m, is_flagged: !currentFlag } : m))
      );
    } catch (error) {
      console.error('Error toggling flag:', error);
    }
  };

  const totalMentions = mentions.length;
  const unreadMentions = mentions.filter((m) => !m.is_read).length;
  const flaggedMentions = mentions.filter((m) => m.is_flagged).length;

  return (
    <div className="p-6 md:p-8 space-y-6">
      <PageHeader
        title="Social Listening"
        description="Track brand mentions, sentiment, and trends across social media"
      />

      {/* Top Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-stone/10 p-4">
          <p className="text-sm text-stone mb-1">Total Mentions (7d)</p>
          <p className="text-2xl font-bold text-charcoal">{totalMentions}</p>
        </div>
        <div className="bg-white rounded-xl border border-stone/10 p-4">
          <p className="text-sm text-stone mb-1">Unread</p>
          <p className="text-2xl font-bold text-teal">{unreadMentions}</p>
        </div>
        <div className="bg-white rounded-xl border border-stone/10 p-4">
          <p className="text-sm text-stone mb-1">Flagged</p>
          <p className="text-2xl font-bold text-orange-500">{flaggedMentions}</p>
        </div>
        <div className="bg-white rounded-xl border border-stone/10 p-4">
          <p className="text-sm text-stone mb-1">Tracking Keywords</p>
          <p className="text-2xl font-bold text-purple-600">{keywords.length}</p>
        </div>
      </div>

      {/* Sentiment Overview & Trending Topics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sentiment Chart */}
        <SentimentChart sentimentCounts={sentimentCounts} totalMentions={totalMentions} />

        {/* Trending Topics */}
        <div className="bg-white rounded-xl border border-stone/10 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-charcoal flex items-center gap-2">
              <FireIcon className="w-5 h-5 text-orange-500" />
              Trending Topics (24h)
            </h3>
            <Link
              href="/social/listening/trends"
              className="text-xs text-teal hover:text-teal-dark font-medium"
            >
              View All →
            </Link>
          </div>

          {trends.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-stone">No trending topics yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {trends.slice(0, 5).map((trend, index) => (
                <div
                  key={trend.id}
                  className="flex items-center justify-between p-3 bg-stone/5 rounded-lg hover:bg-stone/10 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 flex items-center justify-center bg-orange-100 text-orange-700 rounded-full text-xs font-bold">
                      {index + 1}
                    </span>
                    <div>
                      <p className="font-medium text-charcoal">{trend.trend_value}</p>
                      <p className="text-xs text-stone">{trend.mention_count} mentions</p>
                    </div>
                  </div>
                  {trend.growth_rate && (
                    <span className="text-xs font-semibold text-green-600">
                      +{trend.growth_rate}%
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white rounded-xl border border-stone/10 p-4">
        <div className="flex items-center gap-3 flex-1 w-full sm:w-auto">
          {/* Search */}
          <div className="relative flex-1 sm:flex-initial sm:w-80">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone" />
            <input
              type="text"
              placeholder="Search mentions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-stone/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal text-sm"
            />
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2">
            {/* Sentiment */}
            <select
              value={selectedSentiment}
              onChange={(e) => setSelectedSentiment(e.target.value)}
              className="px-3 py-2 border border-stone/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal text-sm"
            >
              {SENTIMENT_FILTERS.map((sentiment) => (
                <option key={sentiment} value={sentiment}>
                  {sentiment === 'all' ? 'All Sentiment' : sentiment.charAt(0).toUpperCase() + sentiment.slice(1)}
                </option>
              ))}
            </select>

            {/* Platform */}
            <select
              value={selectedPlatform}
              onChange={(e) => setSelectedPlatform(e.target.value)}
              className="px-3 py-2 border border-stone/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal text-sm capitalize"
            >
              {PLATFORM_FILTERS.map((platform) => (
                <option key={platform} value={platform}>
                  {platform === 'all' ? 'All Platforms' : platform}
                </option>
              ))}
            </select>

            {/* Show Read */}
            <button
              onClick={() => setShowReadOnly(!showReadOnly)}
              className={cn(
                'px-3 py-2 text-sm font-medium rounded-lg border transition-colors',
                showReadOnly
                  ? 'bg-teal text-white border-teal'
                  : 'bg-white text-stone border-stone/20 hover:border-teal'
              )}
            >
              {showReadOnly ? 'All' : 'Unread'}
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Link
            href="/social/listening/reports"
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-charcoal hover:text-teal border border-stone/20 hover:border-teal rounded-lg transition-colors"
          >
            <ChartBarIcon className="w-4 h-4" />
            Reports
          </Link>
          <button
            onClick={() => setShowKeywordManager(true)}
            className="flex items-center gap-2 px-3 py-2 bg-teal text-white rounded-lg hover:bg-teal-dark transition-colors text-sm font-medium"
          >
            <PlusIcon className="w-4 h-4" />
            Manage Keywords
          </button>
        </div>
      </div>

      {/* Mentions Feed */}
      <div className="bg-white rounded-xl border border-stone/10">
        <div className="px-6 py-4 border-b border-stone/10">
          <h3 className="font-semibold text-charcoal">
            Recent Mentions ({filteredMentions.length})
          </h3>
        </div>

        <div className="divide-y divide-stone/10">
          {filteredMentions.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-stone/10 rounded-full flex items-center justify-center">
                <FunnelIcon className="w-8 h-8 text-stone" />
              </div>
              <h3 className="text-lg font-semibold text-charcoal mb-2">No mentions found</h3>
              <p className="text-sm text-stone">
                {keywords.length === 0
                  ? 'Add keywords to start tracking brand mentions'
                  : 'Try adjusting your filters or add more keywords'}
              </p>
            </div>
          ) : (
            filteredMentions.map((mention) => (
              <MentionCard
                key={mention.id}
                mention={mention}
                onMarkAsRead={() => handleMarkAsRead(mention.id)}
                onToggleFlag={() => handleToggleFlag(mention.id, mention.is_flagged)}
              />
            ))
          )}
        </div>
      </div>

      {/* Keyword Manager Modal */}
      {showKeywordManager && (
        <KeywordManager
          keywords={keywords}
          organizationId={organizationId}
          onClose={() => setShowKeywordManager(false)}
        />
      )}
    </div>
  );
}
