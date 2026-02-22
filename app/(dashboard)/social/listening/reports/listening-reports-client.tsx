'use client';

import { useState, useMemo } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { cn } from '@/lib/utils';
import {
  ChartBarIcon,
  ChatBubbleLeftRightIcon,
  HashtagIcon,
  FaceSmileIcon,
  FaceFrownIcon,
  ArrowTrendingUpIcon,
  GlobeAltIcon,
  ClockIcon,
  DocumentArrowDownIcon,
} from '@heroicons/react/24/outline';

interface Keyword {
  id: string;
  keyword: string;
  keyword_type: string;
  is_active: boolean;
  created_at: string;
}

interface Mention {
  id: string;
  keyword_id: string;
  platform: string;
  sentiment: string | null;
  reach: number | null;
  engagement: number | null;
  published_at: string | null;
  discovered_at: string;
  is_read: boolean;
  is_flagged: boolean;
}

interface Trend {
  id: string;
  topic: string;
  mention_count: number;
  sentiment_score: number | null;
  time_period: string;
  platforms: string[] | null;
}

interface ListeningReportsClientProps {
  keywords: Keyword[];
  mentions: Mention[];
  trends: Trend[];
  organizationId: string;
}

type TimePeriod = '7d' | '30d';

export function ListeningReportsClient({ keywords, mentions, trends }: ListeningReportsClientProps) {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('7d');

  // Filter mentions by time period
  const filteredMentions = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - (timePeriod === '7d' ? 7 : 30));
    return mentions.filter((m) => new Date(m.discovered_at) >= cutoff);
  }, [mentions, timePeriod]);

  // Sentiment breakdown
  const sentimentBreakdown = useMemo(() => {
    const counts = { positive: 0, neutral: 0, negative: 0 };
    filteredMentions.forEach((m) => {
      if (m.sentiment === 'positive') counts.positive++;
      else if (m.sentiment === 'negative') counts.negative++;
      else counts.neutral++;
    });
    return counts;
  }, [filteredMentions]);

  const totalMentions = filteredMentions.length;
  const sentimentScore = totalMentions > 0
    ? Math.round(((sentimentBreakdown.positive - sentimentBreakdown.negative) / totalMentions) * 100)
    : 0;

  // Platform breakdown
  const platformBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredMentions.forEach((m) => {
      counts[m.platform] = (counts[m.platform] || 0) + 1;
    });
    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .map(([platform, count]) => ({ platform, count, pct: totalMentions > 0 ? Math.round((count / totalMentions) * 100) : 0 }));
  }, [filteredMentions, totalMentions]);

  // Total reach & engagement
  const totalReach = filteredMentions.reduce((s, m) => s + (m.reach || 0), 0);
  const totalEngagement = filteredMentions.reduce((s, m) => s + (m.engagement || 0), 0);

  // Flagged mentions
  const flaggedCount = filteredMentions.filter((m) => m.is_flagged).length;

  // Daily volume (last 7 or 30 days)
  const dailyVolume = useMemo(() => {
    const days = timePeriod === '7d' ? 7 : 30;
    const buckets: Record<string, number> = {};
    for (let i = 0; i < days; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      buckets[d.toISOString().split('T')[0]] = 0;
    }
    filteredMentions.forEach((m) => {
      const day = new Date(m.discovered_at).toISOString().split('T')[0];
      if (buckets[day] !== undefined) buckets[day]++;
    });
    return Object.entries(buckets)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({ date, count }));
  }, [filteredMentions, timePeriod]);

  const maxDaily = Math.max(...dailyVolume.map((d) => d.count), 1);

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          title="Listening Report"
          subtitle="Summary of brand mentions and sentiment across platforms"
        />
        <div className="flex items-center gap-2">
          {(['7d', '30d'] as const).map((period) => (
            <button
              key={period}
              onClick={() => setTimePeriod(period)}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                timePeriod === period
                  ? 'bg-teal text-white'
                  : 'bg-cream-warm border border-stone/10 text-stone hover:text-charcoal'
              )}
            >
              {period === '7d' ? 'Last 7 Days' : 'Last 30 Days'}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-cream-warm rounded-xl border border-stone/10 p-5">
          <div className="flex items-center gap-2 mb-2">
            <ChatBubbleLeftRightIcon className="w-5 h-5 text-teal" />
            <span className="text-xs text-stone">Total Mentions</span>
          </div>
          <p className="text-2xl font-bold text-charcoal">{totalMentions.toLocaleString()}</p>
        </div>
        <div className="bg-cream-warm rounded-xl border border-stone/10 p-5">
          <div className="flex items-center gap-2 mb-2">
            <FaceSmileIcon className="w-5 h-5 text-green-600" />
            <span className="text-xs text-stone">Sentiment Score</span>
          </div>
          <p className={cn('text-2xl font-bold', sentimentScore >= 0 ? 'text-green-600' : 'text-red-600')}>
            {sentimentScore > 0 ? '+' : ''}{sentimentScore}%
          </p>
        </div>
        <div className="bg-cream-warm rounded-xl border border-stone/10 p-5">
          <div className="flex items-center gap-2 mb-2">
            <GlobeAltIcon className="w-5 h-5 text-teal" />
            <span className="text-xs text-stone">Total Reach</span>
          </div>
          <p className="text-2xl font-bold text-charcoal">
            {totalReach >= 1000 ? `${(totalReach / 1000).toFixed(1)}K` : totalReach.toLocaleString()}
          </p>
        </div>
        <div className="bg-cream-warm rounded-xl border border-stone/10 p-5">
          <div className="flex items-center gap-2 mb-2">
            <HashtagIcon className="w-5 h-5 text-gold" />
            <span className="text-xs text-stone">Keywords Tracked</span>
          </div>
          <p className="text-2xl font-bold text-charcoal">{keywords.filter((k) => k.is_active).length}</p>
        </div>
      </div>

      {/* Sentiment Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-cream-warm rounded-xl border border-stone/10 p-6">
          <h3 className="font-semibold text-charcoal mb-4">Sentiment Breakdown</h3>
          {totalMentions === 0 ? (
            <p className="text-sm text-stone text-center py-8">No mentions in this period</p>
          ) : (
            <div className="space-y-4">
              {/* Bar chart */}
              <div className="flex items-end gap-3 h-32">
                {[
                  { label: 'Positive', count: sentimentBreakdown.positive, color: 'bg-green-600' },
                  { label: 'Neutral', count: sentimentBreakdown.neutral, color: 'bg-stone/40' },
                  { label: 'Negative', count: sentimentBreakdown.negative, color: 'bg-red-600' },
                ].map((item) => (
                  <div key={item.label} className="flex-1 flex flex-col items-center gap-2">
                    <span className="text-xs font-semibold text-charcoal">{item.count}</span>
                    <div className="w-full rounded-t-lg relative" style={{ height: `${Math.max((item.count / totalMentions) * 100, 4)}%` }}>
                      <div className={cn('absolute inset-0 rounded-t-lg', item.color)} />
                    </div>
                    <span className="text-xs text-stone">{item.label}</span>
                  </div>
                ))}
              </div>
              {/* Percentages */}
              <div className="grid grid-cols-3 gap-3 pt-3 border-t border-stone/10">
                <div className="text-center">
                  <p className="text-lg font-bold text-green-600">
                    {totalMentions > 0 ? Math.round((sentimentBreakdown.positive / totalMentions) * 100) : 0}%
                  </p>
                  <p className="text-xs text-stone">Positive</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-stone">
                    {totalMentions > 0 ? Math.round((sentimentBreakdown.neutral / totalMentions) * 100) : 0}%
                  </p>
                  <p className="text-xs text-stone">Neutral</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-red-600">
                    {totalMentions > 0 ? Math.round((sentimentBreakdown.negative / totalMentions) * 100) : 0}%
                  </p>
                  <p className="text-xs text-stone">Negative</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Platform Breakdown */}
        <div className="bg-cream-warm rounded-xl border border-stone/10 p-6">
          <h3 className="font-semibold text-charcoal mb-4">Platform Breakdown</h3>
          {platformBreakdown.length === 0 ? (
            <p className="text-sm text-stone text-center py-8">No platform data available</p>
          ) : (
            <div className="space-y-3">
              {platformBreakdown.map(({ platform, count, pct }) => (
                <div key={platform}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-charcoal capitalize">{platform}</span>
                    <span className="text-sm text-stone">{count} ({pct}%)</span>
                  </div>
                  <div className="w-full bg-stone/10 rounded-full h-2">
                    <div className="bg-teal h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Daily Volume Chart */}
      <div className="bg-cream-warm rounded-xl border border-stone/10 p-6">
        <h3 className="font-semibold text-charcoal mb-4 flex items-center gap-2">
          <ClockIcon className="w-5 h-5 text-teal" />
          Daily Mention Volume
        </h3>
        {totalMentions === 0 ? (
          <p className="text-sm text-stone text-center py-8">No data to display</p>
        ) : (
          <div className="flex items-end gap-1 h-32">
            {dailyVolume.map(({ date, count }) => (
              <div key={date} className="flex-1 flex flex-col items-center gap-1" title={`${date}: ${count} mentions`}>
                <div
                  className="w-full bg-teal/70 rounded-t-sm min-h-[2px] transition-all hover:bg-teal"
                  style={{ height: `${Math.max((count / maxDaily) * 100, 2)}%` }}
                />
              </div>
            ))}
          </div>
        )}
        {dailyVolume.length > 0 && (
          <div className="flex justify-between mt-2">
            <span className="text-[10px] text-stone">{dailyVolume[0]?.date}</span>
            <span className="text-[10px] text-stone">{dailyVolume[dailyVolume.length - 1]?.date}</span>
          </div>
        )}
      </div>

      {/* Trending Topics */}
      {trends.length > 0 && (
        <div className="bg-cream-warm rounded-xl border border-stone/10 p-6">
          <h3 className="font-semibold text-charcoal mb-4 flex items-center gap-2">
            <ArrowTrendingUpIcon className="w-5 h-5 text-gold" />
            Trending Topics
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {trends.slice(0, 9).map((trend) => (
              <div key={trend.id} className="flex items-center justify-between p-3 bg-cream/50 rounded-lg border border-stone/5">
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-charcoal truncate block">{trend.topic}</span>
                  <span className="text-xs text-stone">{trend.mention_count} mentions</span>
                </div>
                {trend.sentiment_score !== null && (
                  <span className={cn(
                    'text-xs font-semibold px-2 py-0.5 rounded-full',
                    trend.sentiment_score > 0 ? 'bg-green-600/10 text-green-600' : trend.sentiment_score < 0 ? 'bg-red-600/10 text-red-600' : 'bg-stone/10 text-stone'
                  )}>
                    {trend.sentiment_score > 0 ? '+' : ''}{trend.sentiment_score?.toFixed(1)}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Keywords Being Tracked */}
      <div className="bg-cream-warm rounded-xl border border-stone/10 p-6">
        <h3 className="font-semibold text-charcoal mb-4">Keywords Being Tracked</h3>
        {keywords.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-stone mb-3">No keywords configured yet</p>
            <a
              href="/social/listening"
              className="inline-flex items-center gap-2 px-4 py-2 bg-teal text-white rounded-lg text-sm font-medium hover:bg-teal/90 transition-colors"
            >
              Configure Keywords
            </a>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {keywords.map((kw) => (
              <span
                key={kw.id}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-sm font-medium border',
                  kw.is_active
                    ? 'bg-teal/10 text-teal border-teal/20'
                    : 'bg-stone/5 text-stone/50 border-stone/10 line-through'
                )}
              >
                {kw.keyword}
                <span className="text-xs ml-1 opacity-60 capitalize">({kw.keyword_type})</span>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Summary Stats Footer */}
      <div className="bg-gradient-to-br from-teal/5 to-gold/5 rounded-xl border border-teal/20 p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-charcoal">{totalMentions}</p>
            <p className="text-xs text-stone">Total Mentions</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-charcoal">{totalEngagement.toLocaleString()}</p>
            <p className="text-xs text-stone">Total Engagement</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-charcoal">{flaggedCount}</p>
            <p className="text-xs text-stone">Flagged Items</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-charcoal">{platformBreakdown.length}</p>
            <p className="text-xs text-stone">Active Platforms</p>
          </div>
        </div>
      </div>
    </div>
  );
}
