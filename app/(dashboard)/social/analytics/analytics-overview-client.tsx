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
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

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

export function AnalyticsOverviewClient({
  organizationId,
  connections,
}: AnalyticsOverviewClientProps) {
  const [posts, setPosts] = useState<PlatformPost[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  // Calculate metrics from posts
  const last30Days = posts.filter((post) => {
    const postDate = new Date(post.createdAt);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return postDate >= thirtyDaysAgo;
  });

  const previous30Days = posts.filter((post) => {
    const postDate = new Date(post.createdAt);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
    return postDate < thirtyDaysAgo && postDate >= sixtyDaysAgo;
  });

  const currentMetrics = {
    totalPosts: last30Days.length,
    totalImpressions: last30Days.reduce((sum, p) => sum + p.impressions, 0),
    totalReach: last30Days.reduce((sum, p) => sum + p.reach, 0),
    totalEngagement: last30Days.reduce((sum, p) => sum + p.engagement, 0),
    avgEngagementRate: last30Days.length > 0
      ? last30Days.reduce((sum, p) => sum + p.engagementRate, 0) / last30Days.length
      : 0,
  };

  const previousMetrics = {
    totalPosts: previous30Days.length,
    totalImpressions: previous30Days.reduce((sum, p) => sum + p.impressions, 0),
    totalReach: previous30Days.reduce((sum, p) => sum + p.reach, 0),
    avgEngagementRate: previous30Days.length > 0
      ? previous30Days.reduce((sum, p) => sum + p.engagementRate, 0) / previous30Days.length
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

  const topPosts = [...last30Days]
    .sort((a, b) => b.engagementRate - a.engagementRate)
    .slice(0, 5);

  // Platform breakdown
  const platformMetrics = last30Days.reduce((acc: any, post) => {
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

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          title="Analytics Overview"
          description="Performance insights from your connected social accounts (last 30 days)"
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
