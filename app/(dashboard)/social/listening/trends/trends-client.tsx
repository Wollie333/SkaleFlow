'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import {
  FireIcon,
  HashtagIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  GlobeAltIcon,
  TagIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface Trend {
  id: string;
  trend_type: string;
  trend_value: string;
  mention_count: number;
  growth_rate: number | null;
  peak_timestamp: string | null;
  related_keywords: string[] | null;
  top_influencers: unknown;
  platform_distribution: unknown;
  time_period: string;
  analyzed_at: string;
}

interface TrendsClientProps {
  trends24h: Trend[];
  trends7d: Trend[];
  trends30d: Trend[];
  organizationId: string;
}

const TIME_PERIODS = [
  { key: '24h', label: '24 Hours' },
  { key: '7d', label: '7 Days' },
  { key: '30d', label: '30 Days' },
] as const;

const TREND_TYPES = [
  { key: 'all', label: 'All Types' },
  { key: 'hashtag', label: 'Hashtags' },
  { key: 'topic', label: 'Topics' },
  { key: 'keyword', label: 'Keywords' },
] as const;

const PLATFORM_COLORS: Record<string, string> = {
  twitter: 'bg-sky-500',
  linkedin: 'bg-blue-600',
  facebook: 'bg-indigo-500',
  instagram: 'bg-pink-500',
  reddit: 'bg-orange-500',
  news: 'bg-cream0',
  blog: 'bg-purple-500',
};

const TREND_TYPE_ICONS: Record<string, typeof HashtagIcon> = {
  hashtag: HashtagIcon,
  topic: FireIcon,
  keyword: TagIcon,
};

function formatGrowthRate(rate: number | null): { text: string; color: string; icon: typeof ArrowTrendingUpIcon } {
  if (rate === null || rate === 0) return { text: '0%', color: 'text-stone', icon: ArrowTrendingUpIcon };
  if (rate > 0) return { text: `+${rate}%`, color: 'text-green-600', icon: ArrowTrendingUpIcon };
  return { text: `${rate}%`, color: 'text-red-500', icon: ArrowTrendingDownIcon };
}

function PlatformBar({ distribution }: { distribution: unknown }) {
  if (!distribution || typeof distribution !== 'object') return null;
  const entries = Object.entries(distribution as Record<string, number>).filter(([, v]) => typeof v === 'number' && v > 0);
  if (entries.length === 0) return null;
  const total = entries.reduce((sum, [, v]) => sum + v, 0);

  return (
    <div className="space-y-1.5">
      <div className="flex h-2 rounded-full overflow-hidden bg-stone/10">
        {entries.map(([platform, count]) => (
          <div
            key={platform}
            className={cn('h-full', PLATFORM_COLORS[platform] || 'bg-stone')}
            style={{ width: `${(count / total) * 100}%` }}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1">
        {entries.map(([platform, count]) => (
          <span key={platform} className="flex items-center gap-1 text-[10px] text-stone">
            <span className={cn('w-2 h-2 rounded-full', PLATFORM_COLORS[platform] || 'bg-stone')} />
            <span className="capitalize">{platform}</span>
            <span className="font-medium text-charcoal">{count}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

export function TrendsClient({ trends24h, trends7d, trends30d, organizationId }: TrendsClientProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<string>('24h');
  const [selectedType, setSelectedType] = useState<string>('all');

  const trendsMap: Record<string, Trend[]> = {
    '24h': trends24h,
    '7d': trends7d,
    '30d': trends30d,
  };

  const allTrends = trendsMap[selectedPeriod] || [];
  const filteredTrends = selectedType === 'all'
    ? allTrends
    : allTrends.filter(t => t.trend_type === selectedType);

  const totalMentions = allTrends.reduce((sum, t) => sum + (t.mention_count || 0), 0);
  const avgGrowth = allTrends.length > 0
    ? allTrends.reduce((sum, t) => sum + (t.growth_rate || 0), 0) / allTrends.length
    : 0;
  const topTrend = allTrends.length > 0 ? allTrends[0] : null;

  const typeCounts = {
    hashtag: allTrends.filter(t => t.trend_type === 'hashtag').length,
    topic: allTrends.filter(t => t.trend_type === 'topic').length,
    keyword: allTrends.filter(t => t.trend_type === 'keyword').length,
  };

  return (
    <div className="p-6 md:p-8 space-y-6">
      <PageHeader
        title="Trending Topics"
        subtitle="Discover trending topics, hashtags, and keywords relevant to your brand"
      />

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-cream-warm rounded-xl border border-stone/10 p-4">
          <p className="text-sm text-stone mb-1">Total Trends</p>
          <p className="text-2xl font-bold text-charcoal">{allTrends.length}</p>
        </div>
        <div className="bg-cream-warm rounded-xl border border-stone/10 p-4">
          <p className="text-sm text-stone mb-1">Total Mentions</p>
          <p className="text-2xl font-bold text-teal">{totalMentions.toLocaleString()}</p>
        </div>
        <div className="bg-cream-warm rounded-xl border border-stone/10 p-4">
          <p className="text-sm text-stone mb-1">Avg Growth Rate</p>
          <p className={cn('text-2xl font-bold', avgGrowth > 0 ? 'text-green-600' : avgGrowth < 0 ? 'text-red-500' : 'text-stone')}>
            {avgGrowth > 0 ? '+' : ''}{avgGrowth.toFixed(1)}%
          </p>
        </div>
        <div className="bg-cream-warm rounded-xl border border-stone/10 p-4">
          <p className="text-sm text-stone mb-1">Top Trend</p>
          <p className="text-lg font-bold text-charcoal truncate" title={topTrend?.trend_value || '—'}>
            {topTrend?.trend_value || '—'}
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-cream-warm rounded-xl border border-stone/10 p-4">
        {/* Time Period Tabs */}
        <div className="flex items-center gap-1 bg-stone/5 rounded-lg p-1">
          {TIME_PERIODS.map(period => (
            <button
              key={period.key}
              onClick={() => setSelectedPeriod(period.key)}
              className={cn(
                'px-4 py-2 text-sm font-medium rounded-md transition-colors',
                selectedPeriod === period.key
                  ? 'bg-teal text-white shadow-sm'
                  : 'text-stone hover:text-charcoal'
              )}
            >
              {period.label}
            </button>
          ))}
        </div>

        {/* Type Filter + Type Counts */}
        <div className="flex items-center gap-3">
          <div className="hidden lg:flex items-center gap-2 text-xs text-stone">
            <span className="flex items-center gap-1">
              <HashtagIcon className="w-3.5 h-3.5" /> {typeCounts.hashtag}
            </span>
            <span className="flex items-center gap-1">
              <FireIcon className="w-3.5 h-3.5" /> {typeCounts.topic}
            </span>
            <span className="flex items-center gap-1">
              <TagIcon className="w-3.5 h-3.5" /> {typeCounts.keyword}
            </span>
          </div>
          <select
            value={selectedType}
            onChange={e => setSelectedType(e.target.value)}
            className="px-3 py-2 border border-stone/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal text-sm"
          >
            {TREND_TYPES.map(type => (
              <option key={type.key} value={type.key}>{type.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Trends List */}
      {filteredTrends.length === 0 ? (
        <div className="bg-cream-warm rounded-xl border border-stone/10 p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-stone/10 rounded-full flex items-center justify-center">
            <FireIcon className="w-8 h-8 text-stone" />
          </div>
          <h3 className="text-lg font-semibold text-charcoal mb-2">No trends found</h3>
          <p className="text-sm text-stone mb-4">
            {allTrends.length === 0
              ? 'No trending topics have been detected yet for this time period. Add keywords and wait for data to be analyzed.'
              : 'No trends match the selected filter. Try a different type.'}
          </p>
          <Link
            href="/social/listening"
            className="inline-flex items-center gap-2 px-4 py-2 bg-teal text-white rounded-lg hover:bg-teal-dark transition-colors text-sm font-medium"
          >
            Back to Listening Dashboard
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTrends.map((trend, index) => {
            const growth = formatGrowthRate(trend.growth_rate);
            const GrowthIcon = growth.icon;
            const TypeIcon = TREND_TYPE_ICONS[trend.trend_type] || TagIcon;

            return (
              <div
                key={trend.id}
                className="bg-cream-warm rounded-xl border border-stone/10 p-5 hover:border-teal/20 transition-colors"
              >
                <div className="flex items-start gap-4">
                  {/* Rank */}
                  <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-orange-100 text-orange-700 rounded-full text-sm font-bold">
                    {index + 1}
                  </div>

                  {/* Main Content */}
                  <div className="flex-1 min-w-0 space-y-3">
                    {/* Header Row */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-2 min-w-0">
                        <TypeIcon className="w-4 h-4 text-stone flex-shrink-0" />
                        <h3 className="text-base font-semibold text-charcoal truncate">
                          {trend.trend_value}
                        </h3>
                        <span className="flex-shrink-0 px-2 py-0.5 bg-stone/10 text-stone text-[10px] font-medium rounded-full capitalize">
                          {trend.trend_type}
                        </span>
                      </div>

                      <div className="flex items-center gap-4 flex-shrink-0">
                        {/* Mention Count */}
                        <div className="text-right">
                          <p className="text-lg font-bold text-charcoal">{(trend.mention_count ?? 0).toLocaleString()}</p>
                          <p className="text-[10px] text-stone">mentions</p>
                        </div>

                        {/* Growth Rate */}
                        <div className={cn('flex items-center gap-1', growth.color)}>
                          <GrowthIcon className="w-4 h-4" />
                          <span className="text-sm font-semibold">{growth.text}</span>
                        </div>
                      </div>
                    </div>

                    {/* Platform Distribution */}
                    {trend.platform_distribution ? (
                      <PlatformBar distribution={trend.platform_distribution} />
                    ) : null}

                    {/* Related Keywords + Influencers */}
                    <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                      {/* Related Keywords */}
                      {trend.related_keywords && trend.related_keywords.length > 0 && (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <TagIcon className="w-3.5 h-3.5 text-stone flex-shrink-0" />
                          {trend.related_keywords.slice(0, 6).map((kw, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 bg-teal/10 text-teal text-[10px] font-medium rounded-full"
                            >
                              {kw}
                            </span>
                          ))}
                          {trend.related_keywords.length > 6 && (
                            <span className="text-[10px] text-stone">+{trend.related_keywords.length - 6} more</span>
                          )}
                        </div>
                      )}

                      {/* Top Influencers */}
                      {Array.isArray(trend.top_influencers) && trend.top_influencers.length > 0 && (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <UserGroupIcon className="w-3.5 h-3.5 text-stone flex-shrink-0" />
                          {(trend.top_influencers as { name: string; followers?: number }[]).slice(0, 3).map((inf, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 bg-purple-50 text-purple-600 text-[10px] font-medium rounded-full"
                            >
                              {inf.name}
                              {inf.followers ? ` (${(inf.followers / 1000).toFixed(0)}K)` : ''}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Peak Time */}
                    {trend.peak_timestamp && (
                      <p className="text-[10px] text-stone">
                        Peak: {new Date(trend.peak_timestamp).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
