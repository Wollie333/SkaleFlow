'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui';
import { AnalyticsMetricCard } from '@/components/social/analytics-metric-card';
import { AnalyticsChart } from '@/components/social/analytics-chart';
import {
  ChartBarIcon,
  EyeIcon,
  HeartIcon,
  UserGroupIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ClipboardDocumentCheckIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

interface AnalyticsOverviewClientProps {
  currentMetrics: any;
  previousMetrics: any;
  growth: any;
  topPosts: any[];
  platformMetrics: any;
  organizationId: string;
}

export function AnalyticsOverviewClient({
  currentMetrics,
  previousMetrics,
  growth,
  topPosts,
  platformMetrics,
  organizationId,
}: AnalyticsOverviewClientProps) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatGrowth = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  };

  const handleSyncAnalytics = async () => {
    setIsSyncing(true);
    setSyncMessage(null);

    try {
      const response = await fetch('/api/social/analytics/sync', {
        method: 'POST',
      });

      const data = await response.json();

      if (response.ok) {
        setSyncMessage(`Successfully synced ${data.synced} posts! ${data.failed > 0 ? `(${data.failed} failed)` : ''}`);
        // Reload the page to show updated data
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        setSyncMessage(`Sync failed: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      setSyncMessage('Failed to sync analytics. Please try again.');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          title="Analytics Overview"
          description="Comprehensive performance insights for the last 30 days"
        />
        <div className="flex flex-col gap-2">
          <Button
            onClick={handleSyncAnalytics}
            disabled={isSyncing}
            variant="secondary"
            className="whitespace-nowrap"
          >
            <ArrowPathIcon className={`w-4 h-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Syncing...' : 'Sync Analytics'}
          </Button>
          {syncMessage && (
            <p className={`text-xs ${syncMessage.includes('failed') || syncMessage.includes('Failed') ? 'text-red-500' : 'text-teal'}`}>
              {syncMessage}
            </p>
          )}
        </div>
      </div>

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

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Platform Performance */}
        <div className="bg-white rounded-xl border border-stone/10 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-charcoal flex items-center gap-2">
              <ChartBarIcon className="w-5 h-5 text-teal" />
              Platform Performance
            </h3>
            <Link
              href="/social/analytics/posts"
              className="text-xs text-teal hover:text-teal-dark font-medium"
            >
              View Details →
            </Link>
          </div>

          {Object.keys(platformMetrics).length === 0 ? (
            <div className="text-center py-12">
              <p className="text-sm text-stone">No platform data available</p>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(platformMetrics)
                .sort((a: any, b: any) => b[1].engagementRate - a[1].engagementRate)
                .map(([platform, metrics]: [string, any]) => (
                  <div key={platform} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-charcoal capitalize">{platform}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-stone">{metrics.posts} posts</span>
                        <span className="font-semibold text-teal">
                          {metrics.engagementRate.toFixed(2)}%
                        </span>
                      </div>
                    </div>
                    <div className="h-2 bg-stone/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-teal to-teal-dark"
                        style={{ width: `${Math.min(metrics.engagementRate * 10, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Engagement Breakdown */}
        <div className="bg-white rounded-xl border border-stone/10 p-6">
          <h3 className="font-semibold text-charcoal mb-6">Engagement Breakdown</h3>

          <div className="space-y-4">
            {Object.entries(platformMetrics)
              .sort((a: any, b: any) => b[1].engagement - a[1].engagement)
              .slice(0, 5)
              .map(([platform, metrics]: [string, any]) => (
                <div key={platform} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-charcoal capitalize">{platform}</span>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-xs text-stone">Total Engagement</p>
                      <p className="text-sm font-semibold text-charcoal">
                        {formatNumber(metrics.engagement)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-stone">Impressions</p>
                      <p className="text-sm font-semibold text-charcoal">
                        {formatNumber(metrics.impressions)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Top Performing Posts */}
      <div className="bg-white rounded-xl border border-stone/10">
        <div className="px-6 py-4 border-b border-stone/10">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-charcoal flex items-center gap-2">
              <ArrowTrendingUpIcon className="w-5 h-5 text-teal" />
              Top Performing Posts
            </h3>
            <Link
              href="/social/analytics/posts"
              className="text-xs text-teal hover:text-teal-dark font-medium"
            >
              View All Posts →
            </Link>
          </div>
        </div>

        <div className="divide-y divide-stone/10">
          {topPosts.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-sm text-stone">No posts with analytics yet</p>
            </div>
          ) : (
            topPosts.map((post) => {
              const analytics = Array.isArray(post.post_analytics)
                ? post.post_analytics[0]
                : post.post_analytics;

              const contentItem = Array.isArray(post.content_items)
                ? post.content_items[0]
                : post.content_items;

              return (
                <div key={post.id} className="p-6 hover:bg-cream/30 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-0.5 bg-teal/10 text-teal text-xs font-medium rounded-lg capitalize">
                          {post.platform}
                        </span>
                        <span className="text-xs text-stone">
                          {formatDistanceToNow(new Date(post.published_at), { addSuffix: true })}
                        </span>
                      </div>
                      {contentItem?.caption && (
                        <p className="text-sm text-charcoal line-clamp-2 mb-3">
                          {contentItem.caption}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-stone">
                        <span>{formatNumber(analytics?.impressions || 0)} impressions</span>
                        <span>•</span>
                        <span>
                          {((analytics?.likes || 0) + (analytics?.comments || 0) + (analytics?.shares || 0))} engagements
                        </span>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <p className="text-xs text-stone mb-1">Engagement Rate</p>
                      <p className="text-2xl font-bold text-teal">
                        {(analytics?.engagement_rate || 0).toFixed(2)}%
                      </p>
                      {post.post_url && (
                        <a
                          href={post.post_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-teal hover:text-teal-dark mt-2 inline-block"
                        >
                          View Post →
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          href="/social/analytics/posts"
          className="bg-gradient-to-br from-teal-50 to-blue-50 rounded-xl border border-teal/20 p-6 hover:shadow-lg transition-all group"
        >
          <div className="flex items-center justify-between mb-3">
            <ClipboardDocumentCheckIcon className="w-8 h-8 text-teal" />
            <ArrowTrendingUpIcon className="w-5 h-5 text-teal opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <h3 className="font-semibold text-charcoal mb-1">Post Performance</h3>
          <p className="text-sm text-stone">Detailed analytics for each post</p>
        </Link>

        <Link
          href="/social/analytics/audience"
          className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple/20 p-6 hover:shadow-lg transition-all group"
        >
          <div className="flex items-center justify-between mb-3">
            <UserGroupIcon className="w-8 h-8 text-purple-600" />
            <ArrowTrendingUpIcon className="w-5 h-5 text-purple-600 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <h3 className="font-semibold text-charcoal mb-1">Audience Insights</h3>
          <p className="text-sm text-stone">Understand your audience better</p>
        </Link>

        <Link
          href="/social/analytics/benchmarks"
          className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl border border-orange/20 p-6 hover:shadow-lg transition-all group"
        >
          <div className="flex items-center justify-between mb-3">
            <ChartBarIcon className="w-8 h-8 text-orange-600" />
            <ArrowTrendingUpIcon className="w-5 h-5 text-orange-600 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <h3 className="font-semibold text-charcoal mb-1">Benchmarks</h3>
          <p className="text-sm text-stone">Compare against industry standards</p>
        </Link>
      </div>
    </div>
  );
}
