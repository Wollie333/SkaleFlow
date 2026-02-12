'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui';
import { AnalyticsMetricCard } from '@/components/social/analytics-metric-card';
import {
  ChartBarIcon,
  EyeIcon,
  HeartIcon,
  UserGroupIcon,
  ClipboardDocumentCheckIcon,
  ArrowPathIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { formatDistanceToNow, format, subDays, startOfDay, endOfDay } from 'date-fns';

interface Connection {
  id: string;
  platform: string;
  platform_username?: string;
  platform_page_name?: string;
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

type DateRangePreset = '7days' | '30days' | '90days' | 'custom';

export function AnalyticsOverviewClient({
  organizationId,
  connections,
}: AnalyticsOverviewClientProps) {
  const [posts, setPosts] = useState<PlatformPost[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRangePreset, setDateRangePreset] = useState<DateRangePreset>('30days');
  const [customStartDate, setCustomStartDate] = useState<string>(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [customEndDate, setCustomEndDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [showDatePicker, setShowDatePicker] = useState(false);

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
      } else {
        setError(data.error || 'Failed to fetch posts');
      }
    } catch (err) {
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

  // Get date range based on preset or custom selection
  const getDateRange = () => {
    const now = new Date();
    let startDate: Date;
    let endDate = endOfDay(now);

    if (dateRangePreset === 'custom') {
      startDate = startOfDay(new Date(customStartDate));
      endDate = endOfDay(new Date(customEndDate));
    } else {
      const days = dateRangePreset === '7days' ? 7 : dateRangePreset === '30days' ? 30 : 90;
      startDate = startOfDay(subDays(now, days));
    }

    return { startDate, endDate };
  };

  const { startDate, endDate } = getDateRange();
  const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

  // Calculate metrics from posts within selected date range
  const currentPeriodPosts = posts.filter((post) => {
    const postDate = new Date(post.createdAt);
    return postDate >= startDate && postDate <= endDate;
  });

  // Calculate previous period for comparison (same duration before start date)
  const previousStartDate = startOfDay(subDays(startDate, daysDiff));
  const previousEndDate = endOfDay(subDays(startDate, 1));

  const previousPeriodPosts = posts.filter((post) => {
    const postDate = new Date(post.createdAt);
    return postDate >= previousStartDate && postDate <= previousEndDate;
  });

  const currentMetrics = {
    totalPosts: currentPeriodPosts.length,
    totalImpressions: currentPeriodPosts.reduce((sum, p) => sum + p.impressions, 0),
    totalReach: currentPeriodPosts.reduce((sum, p) => sum + p.reach, 0),
    totalEngagement: currentPeriodPosts.reduce((sum, p) => sum + p.engagement, 0),
    avgEngagementRate: currentPeriodPosts.length > 0
      ? currentPeriodPosts.reduce((sum, p) => sum + p.engagementRate, 0) / currentPeriodPosts.length
      : 0,
  };

  const previousMetrics = {
    totalPosts: previousPeriodPosts.length,
    totalImpressions: previousPeriodPosts.reduce((sum, p) => sum + p.impressions, 0),
    totalReach: previousPeriodPosts.reduce((sum, p) => sum + p.reach, 0),
    avgEngagementRate: previousPeriodPosts.length > 0
      ? previousPeriodPosts.reduce((sum, p) => sum + p.engagementRate, 0) / previousPeriodPosts.length
      : 0,
  };

  const calculateGrowth = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  const growth = {
    posts: calculateGrowth(currentMetrics.totalPosts, previousMetrics.totalPosts),
    impressions: calculateGrowth(currentMetrics.totalImpressions, previousMetrics.totalImpressions),
    reach: calculateGrowth(currentMetrics.totalReach, previousMetrics.totalReach),
    engagement: calculateGrowth(currentMetrics.avgEngagementRate, previousMetrics.avgEngagementRate),
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const topPosts = [...currentPeriodPosts]
    .sort((a, b) => b.engagementRate - a.engagementRate)
    .slice(0, 5);

  // Platform breakdown
  const platformMetrics = currentPeriodPosts.reduce((acc: any, post) => {
    if (!acc[post.platform]) {
      acc[post.platform] = {
        posts: 0,
        impressions: 0,
        engagement: 0,
        engagementRate: 0,
      };
    }
    acc[post.platform].posts++;
    acc[post.platform].impressions += post.impressions;
    acc[post.platform].engagement += post.engagement;
    acc[post.platform].engagementRate += post.engagementRate;
    return acc;
  }, {});

  // Average engagement rate per platform
  Object.keys(platformMetrics).forEach((platform) => {
    if (platformMetrics[platform].posts > 0) {
      platformMetrics[platform].engagementRate /= platformMetrics[platform].posts;
    }
  });

  if (connections.length === 0) {
    return (
      <div className="p-6 md:p-8 space-y-6">
        <PageHeader
          title="Analytics Overview"
          description="Comprehensive performance insights from your connected social accounts"
        />
        <div className="bg-white rounded-xl border border-stone/10 p-12 text-center">
          <p className="text-stone mb-4">No social media accounts connected yet.</p>
          <Link href="/social/connections">
            <Button>Connect Your Accounts</Button>
          </Link>
        </div>
      </div>
    );
  }

  const getDateRangeLabel = () => {
    if (dateRangePreset === 'custom') {
      return `${format(startDate, 'MMM d')} - ${format(endDate, 'MMM d, yyyy')}`;
    }
    const days = dateRangePreset === '7days' ? 7 : dateRangePreset === '30days' ? 30 : 90;
    return `Last ${days} days`;
  };

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <PageHeader
            title="Analytics Overview"
            description={`Performance insights from your connected social accounts (${getDateRangeLabel()})`}
          />
          <Button
            onClick={fetchPlatformPosts}
            disabled={isFetching}
            variant="secondary"
            className="whitespace-nowrap"
          >
            <ArrowPathIcon className={`w-4 h-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
            {isFetching ? 'Loading...' : 'Refresh Data'}
          </Button>
        </div>

        {/* Date Range Selector */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 bg-white rounded-lg border border-stone/10 p-1">
            <button
              onClick={() => setDateRangePreset('7days')}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                dateRangePreset === '7days'
                  ? 'bg-teal text-white'
                  : 'text-stone hover:bg-cream-warm'
              }`}
            >
              Last 7 days
            </button>
            <button
              onClick={() => setDateRangePreset('30days')}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                dateRangePreset === '30days'
                  ? 'bg-teal text-white'
                  : 'text-stone hover:bg-cream-warm'
              }`}
            >
              Last 30 days
            </button>
            <button
              onClick={() => setDateRangePreset('90days')}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                dateRangePreset === '90days'
                  ? 'bg-teal text-white'
                  : 'text-stone hover:bg-cream-warm'
              }`}
            >
              Last 90 days
            </button>
            <button
              onClick={() => {
                setDateRangePreset('custom');
                setShowDatePicker(!showDatePicker);
              }}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors flex items-center gap-1 ${
                dateRangePreset === 'custom'
                  ? 'bg-teal text-white'
                  : 'text-stone hover:bg-cream-warm'
              }`}
            >
              <CalendarIcon className="w-4 h-4" />
              Custom
            </button>
          </div>

          {/* Custom Date Picker */}
          {dateRangePreset === 'custom' && showDatePicker && (
            <div className="flex items-center gap-2 bg-white rounded-lg border border-stone/10 p-3">
              <div className="flex items-center gap-2">
                <label className="text-sm text-stone font-medium">From:</label>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  max={customEndDate}
                  className="px-2 py-1 border border-stone/20 rounded text-sm"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm text-stone font-medium">To:</label>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  min={customStartDate}
                  max={format(new Date(), 'yyyy-MM-dd')}
                  className="px-2 py-1 border border-stone/20 rounded text-sm"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <AnalyticsMetricCard
          title="Total Posts"
          value={currentMetrics.totalPosts}
          growth={growth.posts}
          icon={ClipboardDocumentCheckIcon}
          color="teal"
        />
        <AnalyticsMetricCard
          title="Total Impressions"
          value={formatNumber(currentMetrics.totalImpressions)}
          growth={growth.impressions}
          icon={EyeIcon}
          color="blue"
        />
        <AnalyticsMetricCard
          title="Total Reach"
          value={formatNumber(currentMetrics.totalReach)}
          growth={growth.reach}
          icon={UserGroupIcon}
          color="purple"
        />
        <AnalyticsMetricCard
          title="Avg Engagement Rate"
          value={`${currentMetrics.avgEngagementRate.toFixed(2)}%`}
          growth={growth.engagement}
          icon={HeartIcon}
          color="pink"
        />
      </div>

      {/* Platform Performance */}
      <div className="bg-white rounded-xl border border-stone/10 p-6">
        <h3 className="font-semibold text-charcoal flex items-center gap-2 mb-4">
          <ChartBarIcon className="w-5 h-5 text-teal" />
          Platform Performance
        </h3>
        <div className="space-y-3">
          {Object.keys(platformMetrics).length === 0 ? (
            <p className="text-sm text-stone text-center py-8">No posts in the last 30 days</p>
          ) : (
            Object.entries(platformMetrics).map(([platform, metrics]: [string, any]) => (
              <div key={platform} className="flex items-center justify-between p-3 bg-cream/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-teal/10 flex items-center justify-center">
                    <span className="text-xs font-bold text-teal uppercase">{platform.slice(0, 2)}</span>
                  </div>
                  <div>
                    <p className="font-medium text-charcoal capitalize">{platform}</p>
                    <p className="text-xs text-stone">{metrics.posts} posts</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-charcoal">{formatNumber(metrics.impressions)}</p>
                  <p className="text-xs text-stone">{metrics.engagementRate.toFixed(2)}% engagement</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Top Performing Posts */}
      <div className="bg-white rounded-xl border border-stone/10 p-6">
        <h3 className="font-semibold text-charcoal mb-4">Top Performing Posts</h3>
        {topPosts.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-sm text-stone">No posts with analytics yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {topPosts.map((post) => (
              <div key={post.postId} className="p-4 border border-stone/10 rounded-lg hover:bg-cream/30 transition-colors">
                <div className="flex items-start gap-3">
                  {post.imageUrl && (
                    <img src={post.imageUrl} alt="" className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-charcoal line-clamp-2 mb-2">{post.message || 'No caption'}</p>
                    <div className="flex items-center gap-4 text-xs text-stone">
                      <span className="capitalize">{post.platform}</span>
                      <span>•</span>
                      <span>{formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}</span>
                      <span>•</span>
                      <span className="font-semibold text-teal">{post.engagementRate.toFixed(2)}% engagement</span>
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-xs">
                      <span>❤️ {formatNumber(post.likes)}</span>
                      <span>💬 {formatNumber(post.comments)}</span>
                      <span>👁️ {formatNumber(post.impressions)}</span>
                    </div>
                  </div>
                  {post.permalink && (
                    <a
                      href={post.permalink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-teal hover:text-teal-dark font-medium whitespace-nowrap"
                    >
                      View Post →
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Connected Accounts */}
      <div className="bg-white rounded-xl border border-stone/10 p-6">
        <h3 className="font-semibold text-charcoal mb-4">Connected Accounts</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {connections.map((conn) => (
            <div key={conn.id} className="p-3 border border-stone/10 rounded-lg">
              <p className="font-medium text-charcoal capitalize">{conn.platform}</p>
              <p className="text-xs text-stone">{conn.platform_page_name || conn.platform_username || 'Unknown'}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
