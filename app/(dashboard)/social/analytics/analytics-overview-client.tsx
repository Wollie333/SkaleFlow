'use client';

import { useState, useEffect, useMemo } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { Button, Card } from '@/components/ui';
import { cn } from '@/lib/utils';
import {
  ChartBarIcon,
  EyeIcon,
  HeartIcon,
  UserGroupIcon,
  ClipboardDocumentCheckIcon,
  ArrowPathIcon,
  CalendarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ChatBubbleLeftIcon,
  ShareIcon,
  GlobeAltIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { format, subDays, startOfDay, endOfDay, formatDistanceToNow } from 'date-fns';
import { PLATFORM_CONFIG } from '@/lib/social/types';
import type { SocialPlatform } from '@/types/database';

interface Connection {
  id: string;
  platform: string;
  platform_username?: string | null;
  platform_page_name?: string | null;
  is_active: boolean;
}

interface AnalyticsOverviewClientProps {
  organizationId: string;
  connections: Connection[];
}

interface PlatformPost {
  postId: string;
  createdAt: string;
  message: string;
  permalink: string;
  imageUrl?: string;
  likes: number;
  comments: number;
  shares: number;
  impressions: number;
  reach: number;
  engagement: number;
  engagementRate: number;
  platform: string;
  accountName: string;
}

type DateRangePreset = '7days' | '30days' | '90days';
type TabFilter = 'all' | SocialPlatform;

function formatNumber(num: number): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toLocaleString();
}

function GrowthBadge({ value }: { value: number }) {
  if (value === 0) return null;
  const isPositive = value >= 0;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs font-semibold',
        isPositive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
      )}
    >
      {isPositive ? (
        <ArrowTrendingUpIcon className="w-3 h-3" />
      ) : (
        <ArrowTrendingDownIcon className="w-3 h-3" />
      )}
      {Math.abs(value).toFixed(1)}%
    </span>
  );
}

export function AnalyticsOverviewClient({
  organizationId,
  connections,
}: AnalyticsOverviewClientProps) {
  const [posts, setPosts] = useState<PlatformPost[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRangePreset, setDateRangePreset] = useState<DateRangePreset>('30days');
  const [activeTab, setActiveTab] = useState<TabFilter>('all');

  const fetchPlatformPosts = async () => {
    setIsFetching(true);
    setError(null);

    try {
      const response = await fetch('/api/social/analytics/fetch-platform-posts', {
        method: 'POST',
      });

      const data = await response.json();

      if (response.ok) {
        setPosts(data.posts || []);
        if (data.errors && data.errors.length > 0) {
          const errorMessage = data.errors
            .map((e: { platform: string; error: string }) => `${e.platform}: ${e.error}`)
            .join('\n');
          setError(`Some platforms failed to fetch:\n${errorMessage}`);
        }
      } else {
        setError(data.error || 'Failed to fetch posts');
      }
    } catch {
      setError('Failed to fetch platform posts. Please try again.');
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    if (connections.length > 0) {
      fetchPlatformPosts();
    } else {
      setIsFetching(false);
    }
  }, [connections.length]);

  // Date range calculation
  const { startDate, endDate, daysDiff } = useMemo(() => {
    const now = new Date();
    const days = dateRangePreset === '7days' ? 7 : dateRangePreset === '30days' ? 30 : 90;
    const start = startOfDay(subDays(now, days));
    const end = endOfDay(now);
    return { startDate: start, endDate: end, daysDiff: days };
  }, [dateRangePreset]);

  // Filter posts by date range and platform tab
  const currentPeriodPosts = useMemo(() => {
    return posts.filter((post) => {
      const postDate = new Date(post.createdAt);
      const inRange = postDate >= startDate && postDate <= endDate;
      const matchesPlatform = activeTab === 'all' || post.platform === activeTab;
      return inRange && matchesPlatform;
    });
  }, [posts, startDate, endDate, activeTab]);

  // Previous period for comparison
  const previousPeriodPosts = useMemo(() => {
    const prevStart = startOfDay(subDays(startDate, daysDiff));
    const prevEnd = endOfDay(subDays(startDate, 1));
    return posts.filter((post) => {
      const postDate = new Date(post.createdAt);
      const inRange = postDate >= prevStart && postDate <= prevEnd;
      const matchesPlatform = activeTab === 'all' || post.platform === activeTab;
      return inRange && matchesPlatform;
    });
  }, [posts, startDate, daysDiff, activeTab]);

  // Distinct platforms from actual data
  const platforms = useMemo(
    () => Array.from(new Set(posts.map((p) => p.platform as SocialPlatform))),
    [posts]
  );

  // Compute metrics
  const computeMetrics = (data: PlatformPost[]) => ({
    totalPosts: data.length,
    totalImpressions: data.reduce((s, p) => s + p.impressions, 0),
    totalReach: data.reduce((s, p) => s + p.reach, 0),
    totalEngagement: data.reduce((s, p) => s + p.engagement, 0),
    totalLikes: data.reduce((s, p) => s + p.likes, 0),
    totalComments: data.reduce((s, p) => s + p.comments, 0),
    totalShares: data.reduce((s, p) => s + p.shares, 0),
    avgEngagementRate:
      data.length > 0
        ? data.reduce((s, p) => s + p.engagementRate, 0) / data.length
        : 0,
  });

  const currentMetrics = useMemo(() => computeMetrics(currentPeriodPosts), [currentPeriodPosts]);
  const previousMetrics = useMemo(() => computeMetrics(previousPeriodPosts), [previousPeriodPosts]);

  const calcGrowth = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  // Top posts sorted by engagement rate
  const topPosts = useMemo(
    () => [...currentPeriodPosts].sort((a, b) => b.engagementRate - a.engagementRate).slice(0, 10),
    [currentPeriodPosts]
  );

  // Platform breakdown
  const platformBreakdown = useMemo(() => {
    const map: Record<string, { posts: number; impressions: number; engagement: number; engagementRate: number; likes: number; comments: number; shares: number; reach: number }> = {};
    for (const post of currentPeriodPosts) {
      if (!map[post.platform]) {
        map[post.platform] = { posts: 0, impressions: 0, engagement: 0, engagementRate: 0, likes: 0, comments: 0, shares: 0, reach: 0 };
      }
      map[post.platform].posts++;
      map[post.platform].impressions += post.impressions;
      map[post.platform].engagement += post.engagement;
      map[post.platform].engagementRate += post.engagementRate;
      map[post.platform].likes += post.likes;
      map[post.platform].comments += post.comments;
      map[post.platform].shares += post.shares;
      map[post.platform].reach += post.reach;
    }
    for (const key of Object.keys(map)) {
      if (map[key].posts > 0) {
        map[key].engagementRate /= map[key].posts;
      }
    }
    return map;
  }, [currentPeriodPosts]);

  // --- No connections ---
  if (connections.length === 0) {
    return (
      <div className="p-6 md:p-8 space-y-6">
        <PageHeader
          icon={ChartBarIcon}
          title="Social Analytics"
          subtitle="Performance insights from your connected social accounts"
        />
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <GlobeAltIcon className="w-12 h-12 text-stone/30 mb-4" />
          <h3 className="text-heading-md text-charcoal mb-2">No social accounts connected</h3>
          <p className="text-stone max-w-sm mb-4">
            Connect your social media accounts in Settings to start tracking analytics.
          </p>
          <Link href="/settings">
            <Button variant="outline">Go to Settings</Button>
          </Link>
        </div>
      </div>
    );
  }

  const dateRangeLabel =
    dateRangePreset === '7days' ? 'Last 7 days' : dateRangePreset === '30days' ? 'Last 30 days' : 'Last 90 days';

  // Metric cards config
  const metricCards = [
    {
      label: 'Posts',
      value: currentMetrics.totalPosts,
      growth: calcGrowth(currentMetrics.totalPosts, previousMetrics.totalPosts),
      icon: ClipboardDocumentCheckIcon,
      color: 'text-charcoal',
      bg: 'bg-stone/5',
    },
    {
      label: 'Total Engagement',
      value: formatNumber(currentMetrics.totalEngagement),
      growth: calcGrowth(currentMetrics.totalEngagement, previousMetrics.totalEngagement),
      icon: HeartIcon,
      color: 'text-teal',
      bg: 'bg-teal/5',
    },
    {
      label: 'Impressions',
      value: formatNumber(currentMetrics.totalImpressions),
      growth: calcGrowth(currentMetrics.totalImpressions, previousMetrics.totalImpressions),
      icon: EyeIcon,
      color: 'text-indigo-500',
      bg: 'bg-indigo-50',
    },
    {
      label: 'Avg Engagement Rate',
      value: `${currentMetrics.avgEngagementRate.toFixed(2)}%`,
      growth: calcGrowth(currentMetrics.avgEngagementRate, previousMetrics.avgEngagementRate),
      icon: ChartBarIcon,
      color: 'text-violet-600',
      bg: 'bg-violet-50',
    },
    {
      label: 'Reach',
      value: formatNumber(currentMetrics.totalReach),
      growth: calcGrowth(currentMetrics.totalReach, previousMetrics.totalReach),
      icon: UserGroupIcon,
      color: 'text-violet-500',
      bg: 'bg-violet-50',
    },
    {
      label: 'Likes',
      value: formatNumber(currentMetrics.totalLikes),
      growth: calcGrowth(currentMetrics.totalLikes, previousMetrics.totalLikes),
      icon: HeartIcon,
      color: 'text-pink-500',
      bg: 'bg-pink-50',
    },
    {
      label: 'Comments',
      value: formatNumber(currentMetrics.totalComments),
      growth: calcGrowth(currentMetrics.totalComments, previousMetrics.totalComments),
      icon: ChatBubbleLeftIcon,
      color: 'text-gold',
      bg: 'bg-gold/5',
    },
    {
      label: 'Shares',
      value: formatNumber(currentMetrics.totalShares),
      growth: calcGrowth(currentMetrics.totalShares, previousMetrics.totalShares),
      icon: ShareIcon,
      color: 'text-orange-500',
      bg: 'bg-orange-50',
    },
  ];

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          icon={ChartBarIcon}
          title="Social Analytics"
          subtitle={`Performance insights from your connected accounts (${dateRangeLabel})`}
        />
        <Button
          onClick={fetchPlatformPosts}
          disabled={isFetching}
          variant="secondary"
          className="whitespace-nowrap"
        >
          <ArrowPathIcon className={`w-4 h-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
          {isFetching ? 'Loading...' : 'Refresh'}
        </Button>
      </div>

      {/* Date range + Platform tabs row */}
      <div className="flex flex-col gap-3">
        {/* Date range selector */}
        <div className="flex items-center gap-1 bg-cream-warm rounded-lg border border-stone/10 p-1 w-fit">
          {(['7days', '30days', '90days'] as DateRangePreset[]).map((preset) => (
            <button
              key={preset}
              onClick={() => setDateRangePreset(preset)}
              className={cn(
                'px-3 py-1.5 rounded text-sm font-medium transition-colors',
                dateRangePreset === preset
                  ? 'bg-teal text-white'
                  : 'text-stone hover:bg-cream-warm'
              )}
            >
              {preset === '7days' ? '7 days' : preset === '30days' ? '30 days' : '90 days'}
            </button>
          ))}
        </div>

        {/* Platform tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveTab('all')}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors border-b-2',
              activeTab === 'all'
                ? 'bg-teal/10 text-teal border-teal'
                : 'bg-cream-warm text-stone hover:text-charcoal border-transparent'
            )}
          >
            All Platforms
          </button>
          {platforms.map((platform) => {
            const config = PLATFORM_CONFIG[platform];
            if (!config) return null;
            const isActive = activeTab === platform;
            return (
              <button
                key={platform}
                onClick={() => setActiveTab(platform)}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors border-b-2',
                  isActive
                    ? 'bg-cream-warm text-charcoal'
                    : 'bg-cream-warm text-stone hover:text-charcoal border-transparent'
                )}
                style={isActive ? { borderColor: config.color } : undefined}
              >
                {config.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <p className="text-sm font-semibold text-amber-800 mb-1">Analytics Issue</p>
          <p className="text-sm text-amber-700 whitespace-pre-line">{error}</p>
        </div>
      )}

      {/* Loading state */}
      {isFetching ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="h-28 bg-stone/5 rounded-xl animate-pulse" />
            ))}
          </div>
          <div className="h-64 bg-stone/5 rounded-xl animate-pulse" />
          <div className="h-48 bg-stone/5 rounded-xl animate-pulse" />
        </div>
      ) : (
        <>
          {/* Metric Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {metricCards.map((card) => {
              const Icon = card.icon;
              return (
                <Card key={card.label} className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className={cn('p-1.5 rounded-lg', card.bg)}>
                      <Icon className={cn('w-4 h-4', card.color)} />
                    </div>
                    <span className="text-xs text-stone font-medium">{card.label}</span>
                  </div>
                  <div className="flex items-end justify-between">
                    <p className="text-2xl font-bold text-charcoal">{card.value}</p>
                    <GrowthBadge value={card.growth} />
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Platform Breakdown (only on 'all' tab) */}
          {activeTab === 'all' && Object.keys(platformBreakdown).length > 0 && (
            <Card className="p-6">
              <h3 className="font-semibold text-charcoal flex items-center gap-2 mb-4">
                <ChartBarIcon className="w-5 h-5 text-teal" />
                Platform Performance
              </h3>
              <div className="space-y-3">
                {Object.entries(platformBreakdown).map(([platform, metrics]) => {
                  const config = PLATFORM_CONFIG[platform as SocialPlatform];
                  return (
                    <div
                      key={platform}
                      className="flex items-center justify-between p-4 bg-cream/30 rounded-lg hover:bg-cream/50 transition-colors cursor-pointer"
                      onClick={() => setActiveTab(platform as SocialPlatform)}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: `${config?.color || '#666'}20` }}
                        >
                          <span
                            className="text-xs font-bold uppercase"
                            style={{ color: config?.color || '#666' }}
                          >
                            {platform.slice(0, 2)}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-charcoal">{config?.name || platform}</p>
                          <p className="text-xs text-stone">
                            {metrics.posts} post{metrics.posts !== 1 ? 's' : ''} &middot;{' '}
                            {metrics.engagementRate.toFixed(2)}% avg engagement
                          </p>
                        </div>
                      </div>
                      <div className="text-right space-y-0.5">
                        <p className="text-sm font-semibold text-charcoal">{formatNumber(metrics.impressions)} impressions</p>
                        <div className="flex items-center gap-3 text-xs text-stone justify-end">
                          <span>{formatNumber(metrics.likes)} likes</span>
                          <span>{formatNumber(metrics.comments)} comments</span>
                          {metrics.shares > 0 && <span>{formatNumber(metrics.shares)} shares</span>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {/* Top Posts */}
          <Card className="p-6">
            <h3 className="font-semibold text-charcoal mb-4">
              Top Performing Posts
              {activeTab !== 'all' && (
                <span className="text-sm font-normal text-stone ml-2">
                  ({PLATFORM_CONFIG[activeTab]?.name || activeTab})
                </span>
              )}
            </h3>
            {topPosts.length === 0 ? (
              <div className="py-12 text-center">
                <ClipboardDocumentCheckIcon className="w-10 h-10 text-stone/20 mx-auto mb-3" />
                <p className="text-sm text-stone">
                  {currentPeriodPosts.length === 0
                    ? 'No posts found in the selected date range.'
                    : 'No posts with analytics yet.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-stone/10">
                      <th className="text-left font-medium text-stone py-3 pr-4">Post</th>
                      <th className="text-left font-medium text-stone py-3 px-3">Platform</th>
                      <th className="text-right font-medium text-stone py-3 px-3">Likes</th>
                      <th className="text-right font-medium text-stone py-3 px-3">Comments</th>
                      <th className="text-right font-medium text-stone py-3 px-3">Shares</th>
                      <th className="text-right font-medium text-stone py-3 px-3">Impressions</th>
                      <th className="text-right font-medium text-stone py-3 px-3">Reach</th>
                      <th className="text-right font-medium text-stone py-3 pl-3">Eng. Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topPosts.map((post) => {
                      const config = PLATFORM_CONFIG[post.platform as SocialPlatform];
                      return (
                        <tr key={post.postId} className="border-b border-stone/5 hover:bg-cream/20 transition-colors">
                          <td className="py-3 pr-4 max-w-xs">
                            <div className="flex items-start gap-2">
                              {post.imageUrl && (
                                <img
                                  src={post.imageUrl}
                                  alt=""
                                  className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                                />
                              )}
                              <div className="min-w-0">
                                <p className="text-sm text-charcoal line-clamp-2 leading-snug">
                                  {post.message || 'No caption'}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-xs text-stone">
                                    {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                                  </span>
                                  {post.permalink && (
                                    <a
                                      href={post.permalink}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-xs text-teal hover:text-teal-dark font-medium"
                                    >
                                      View
                                    </a>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            <span
                              className="inline-block px-2 py-0.5 rounded text-xs font-medium text-white"
                              style={{ backgroundColor: config?.color || '#666' }}
                            >
                              {config?.name || post.platform}
                            </span>
                          </td>
                          <td className="text-right py-3 px-3 font-medium text-charcoal">{formatNumber(post.likes)}</td>
                          <td className="text-right py-3 px-3 font-medium text-charcoal">{formatNumber(post.comments)}</td>
                          <td className="text-right py-3 px-3 font-medium text-charcoal">{formatNumber(post.shares)}</td>
                          <td className="text-right py-3 px-3 font-medium text-charcoal">{formatNumber(post.impressions)}</td>
                          <td className="text-right py-3 px-3 font-medium text-charcoal">{formatNumber(post.reach)}</td>
                          <td className="text-right py-3 pl-3">
                            <span className="font-semibold text-teal">{post.engagementRate.toFixed(2)}%</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          {/* Connected Accounts */}
          <Card className="p-6">
            <h3 className="font-semibold text-charcoal mb-4">Connected Accounts</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {connections.map((conn) => {
                const config = PLATFORM_CONFIG[conn.platform as SocialPlatform];
                return (
                  <div
                    key={conn.id}
                    className="flex items-center gap-3 p-3 border border-stone/10 rounded-lg"
                  >
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${config?.color || '#666'}20` }}
                    >
                      <span
                        className="text-xs font-bold uppercase"
                        style={{ color: config?.color || '#666' }}
                      >
                        {conn.platform.slice(0, 2)}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-charcoal text-sm">{config?.name || conn.platform}</p>
                      <p className="text-xs text-stone truncate">
                        {conn.platform_page_name || conn.platform_username || 'Connected'}
                      </p>
                    </div>
                    <div className="ml-auto">
                      <span className="w-2 h-2 rounded-full bg-green-400 inline-block" />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* No data for this tab */}
          {currentPeriodPosts.length === 0 && !isFetching && (
            <Card className="p-12 text-center">
              <p className="text-stone">
                No posts found for{' '}
                {activeTab === 'all'
                  ? `the last ${dateRangePreset === '7days' ? '7' : dateRangePreset === '30days' ? '30' : '90'} days`
                  : `${PLATFORM_CONFIG[activeTab]?.name || activeTab} in this date range`}
                .
              </p>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
