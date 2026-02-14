'use client';

import { useMemo, useState, useCallback } from 'react';
import { PlatformOverviewCards } from './platform-overview-cards';
import { PerformanceChart } from './performance-chart';
import { EngagementDonut } from './engagement-donut';
import { TopPostsTable } from './top-posts-table';
import { AudienceInsightsPanel } from './audience-insights-panel';
import { PlatformHistorySection } from './platform-history-section';
import { PostDetailModal, type PlatformPost } from '@/components/social/post-detail-modal';
import { PLATFORM_SUPPORTED_METRICS } from '@/lib/analytics/platform-metrics';
import type { MetricKey } from '@/lib/analytics/platform-metrics';
import type { SocialPlatform } from '@/types/database';
import type { SortKey, TopPost } from './top-posts-table';
import type { AnalyticsResponse } from './types';
import type { AudienceInsight } from './audience-insights-panel';
import { PLATFORM_CONFIG } from '@/lib/social/types';

interface PlatformTabContentProps {
  platform: SocialPlatform;
  data: AnalyticsResponse;
  isLoading: boolean;
  audienceInsight?: AudienceInsight | null;
  audienceLoading?: boolean;
}

/** Map MetricKey → SortKey for top posts table column visibility */
const METRIC_TO_SORT_KEY: Partial<Record<MetricKey, SortKey>> = {
  likes: 'likes',
  comments: 'comments',
  shares: 'shares',
  saves: 'saves',
  impressions: 'impressions',
  reach: 'reach',
  clicks: 'clicks',
  videoViews: 'videoViews',
  engagementRate: 'engagementRate',
};

/** Convert a TopPost (published_posts DB) to PlatformPost for the modal */
function topPostToPlatformPost(post: TopPost): PlatformPost {
  const engagement = post.likes + post.comments + post.shares;
  return {
    postId: post.id,
    createdAt: post.publishedAt,
    message: post.topic || post.hook || 'Untitled post',
    permalink: post.postUrl || '',
    likes: post.likes,
    comments: post.comments,
    shares: post.shares,
    impressions: post.impressions,
    reach: post.reach,
    engagement,
    engagementRate: post.engagementRate,
    platform: post.platform,
    accountName: PLATFORM_CONFIG[post.platform]?.name || post.platform,
  };
}

export function PlatformTabContent({ platform, data, isLoading, audienceInsight, audienceLoading }: PlatformTabContentProps) {
  const supportedMetrics = PLATFORM_SUPPORTED_METRICS[platform];
  const [selectedPost, setSelectedPost] = useState<PlatformPost | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Filter top posts to this platform
  const platformPosts = useMemo(
    () => data.topPosts.filter(p => p.platform === platform),
    [data.topPosts, platform]
  );

  // Build platform summary data from the platformSummary array
  const platformSummary = useMemo(() => {
    const found = data.platformSummary.find(p => p.platform === platform);
    return found || {
      totalPosts: 0,
      totalLikes: 0,
      totalComments: 0,
      totalShares: 0,
      totalSaves: 0,
      totalImpressions: 0,
      totalReach: 0,
      totalClicks: 0,
      totalVideoViews: 0,
      avgEngagementRate: 0,
    };
  }, [data.platformSummary, platform]);

  // Visible columns for table
  const visibleColumns = useMemo(() => {
    const cols: SortKey[] = [];
    for (const metric of supportedMetrics) {
      const sortKey = METRIC_TO_SORT_KEY[metric];
      if (sortKey) cols.push(sortKey);
    }
    return cols;
  }, [supportedMetrics]);

  const platformName = PLATFORM_CONFIG[platform]?.name || platform;

  const handleTopPostClick = useCallback((post: TopPost) => {
    setSelectedPost(topPostToPlatformPost(post));
    setModalOpen(true);
  }, []);

  const handlePlatformPostClick = useCallback((post: PlatformPost) => {
    setSelectedPost(post);
    setModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setModalOpen(false);
    setSelectedPost(null);
  }, []);

  if (!isLoading && platformPosts.length === 0 && platformSummary.totalPosts === 0) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 bg-stone/10 rounded-full flex items-center justify-center mb-4">
            <span className="text-2xl">📊</span>
          </div>
          <h3 className="text-heading-md text-charcoal mb-2">No {platformName} data yet</h3>
          <p className="text-stone max-w-sm">
            Publish content to {platformName} and analytics will appear here once synced.
          </p>
        </div>

        {/* Platform history — can still fetch even without published posts */}
        <PlatformHistorySection
          platform={platform}
          onPostClick={handlePlatformPostClick}
        />

        {/* Still show audience insights even if no posts published yet */}
        {audienceInsight !== undefined && (
          <AudienceInsightsPanel
            insight={audienceInsight}
            isLoading={audienceLoading || false}
          />
        )}

        <PostDetailModal
          post={selectedPost}
          isOpen={modalOpen}
          onClose={handleCloseModal}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PlatformOverviewCards
        platform={platform}
        data={platformSummary}
        isLoading={isLoading}
      />

      {/* Chart + Donut row */}
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-[7] min-w-0">
          <PerformanceChart
            data={data.timeSeries}
            isLoading={isLoading}
            platformFilter={platform}
            availableMetrics={supportedMetrics}
          />
        </div>
        <div className="flex-[3] min-w-0">
          <EngagementDonut
            likes={platformSummary.totalLikes}
            comments={platformSummary.totalComments}
            shares={platformSummary.totalShares}
            saves={platformSummary.totalSaves}
            isLoading={isLoading}
          />
        </div>
      </div>

      <TopPostsTable
        posts={platformPosts}
        isLoading={isLoading}
        visibleColumns={visibleColumns}
        onPostClick={handleTopPostClick}
      />

      {/* Platform history posts (fetched from platform APIs) */}
      <PlatformHistorySection
        platform={platform}
        onPostClick={handlePlatformPostClick}
      />

      {/* Audience Insights */}
      {audienceInsight !== undefined && (
        <AudienceInsightsPanel
          insight={audienceInsight}
          isLoading={audienceLoading || false}
        />
      )}

      <PostDetailModal
        post={selectedPost}
        isOpen={modalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
}
