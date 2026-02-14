'use client';

import { useState, useCallback } from 'react';
import { OverviewCards } from './overview-cards';
import { PerformanceChart } from './performance-chart';
import { EngagementDonut } from './engagement-donut';
import { TopPostsTable, type TopPost } from './top-posts-table';
import { PlatformBreakdown } from './platform-breakdown';
import { PostDetailModal, type PlatformPost } from '@/components/social/post-detail-modal';
import { PLATFORM_CONFIG } from '@/lib/social/types';
import type { AnalyticsResponse } from './types';

interface OverviewTabContentProps {
  data: AnalyticsResponse;
  isLoading: boolean;
}

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

export function OverviewTabContent({ data, isLoading }: OverviewTabContentProps) {
  const [selectedPost, setSelectedPost] = useState<PlatformPost | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const handlePostClick = useCallback((post: TopPost) => {
    setSelectedPost(topPostToPlatformPost(post));
    setModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setModalOpen(false);
    setSelectedPost(null);
  }, []);

  return (
    <div className="space-y-6">
      <OverviewCards
        data={data.overview}
        isLoading={isLoading}
      />

      {/* Chart + Donut row */}
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-[7] min-w-0">
          <PerformanceChart
            data={data.timeSeries}
            isLoading={isLoading}
          />
        </div>
        <div className="flex-[3] min-w-0">
          <EngagementDonut
            likes={data.overview.totalLikes}
            comments={data.overview.totalComments}
            shares={data.overview.totalShares}
            saves={data.overview.totalSaves}
            isLoading={isLoading}
          />
        </div>
      </div>

      <TopPostsTable
        posts={data.topPosts}
        isLoading={isLoading}
        onPostClick={handlePostClick}
      />

      <PlatformBreakdown
        data={data.platformSummary}
        isLoading={isLoading}
      />

      <PostDetailModal
        post={selectedPost}
        isOpen={modalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
}
