'use client';

import { OverviewCards } from './overview-cards';
import { PerformanceChart } from './performance-chart';
import { EngagementDonut } from './engagement-donut';
import { TopPostsTable } from './top-posts-table';
import { PlatformBreakdown } from './platform-breakdown';
import type { AnalyticsResponse } from './types';

interface OverviewTabContentProps {
  data: AnalyticsResponse;
  isLoading: boolean;
}

export function OverviewTabContent({ data, isLoading }: OverviewTabContentProps) {
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
      />

      <PlatformBreakdown
        data={data.platformSummary}
        isLoading={isLoading}
      />
    </div>
  );
}
