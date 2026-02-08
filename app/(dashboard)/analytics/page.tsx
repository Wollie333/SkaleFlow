'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { PageHeader } from '@/components/ui';
import { ChartBarIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui';
import { cn } from '@/lib/utils';
import { OverviewCards } from '@/components/analytics/overview-cards';
import { PerformanceChart } from '@/components/analytics/performance-chart';
import { TopPostsTable } from '@/components/analytics/top-posts-table';
import { PlatformBreakdown } from '@/components/analytics/platform-breakdown';
import { DateRangePicker, getDateFromRange, type DateRange } from '@/components/analytics/date-range-picker';
import type { SocialPlatform } from '@/types/database';
import { PLATFORM_CONFIG } from '@/lib/social/types';

interface AnalyticsResponse {
  overview: {
    totalPosts: number;
    totalEngagement: number;
    totalImpressions: number;
    avgEngagementRate: number;
  };
  timeSeries: Array<{ date: string; engagement: number; impressions: number }>;
  topPosts: Array<{
    id: string;
    contentItemId: string;
    platform: SocialPlatform;
    topic: string | null;
    hook: string | null;
    publishedAt: string;
    postUrl: string | null;
    likes: number;
    comments: number;
    shares: number;
    impressions: number;
    engagementRate: number;
  }>;
  platformSummary: Array<{
    platform: SocialPlatform;
    totalPosts: number;
    avgEngagementRate: number;
    totalLikes: number;
    totalComments: number;
    totalShares: number;
    totalImpressions: number;
  }>;
}

interface CampaignOption {
  id: string;
  name: string;
}

const platformFilters: { value: string; label: string }[] = [
  { value: 'all', label: 'All Platforms' },
  ...(['linkedin', 'facebook', 'instagram', 'twitter', 'tiktok'] as SocialPlatform[]).map(p => ({
    value: p,
    label: PLATFORM_CONFIG[p].name,
  })),
];

export default function AnalyticsPage() {
  const supabase = createClient();
  const [dateRange, setDateRange] = useState<DateRange>('30d');
  const [platformFilter, setPlatformFilter] = useState('all');
  const [campaignFilter, setCampaignFilter] = useState('all');
  const [campaigns, setCampaigns] = useState<CampaignOption[]>([]);
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [contentEngineEnabled, setContentEngineEnabled] = useState(true);

  // Load campaigns for the filter dropdown + check content engine access
  useEffect(() => {
    async function loadCampaigns() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: membership } = await supabase
        .from('org_members')
        .select('organization_id, organizations(content_engine_enabled)')
        .eq('user_id', user.id)
        .single();

      if (!membership) return;

      const orgData = membership.organizations as { content_engine_enabled: boolean } | null;
      setContentEngineEnabled(orgData?.content_engine_enabled || false);

      const { data: calendars } = await supabase
        .from('content_calendars')
        .select('id, name')
        .eq('organization_id', membership.organization_id)
        .order('created_at', { ascending: false });

      if (calendars) {
        setCampaigns(calendars);
      }
    }
    loadCampaigns();
  }, [supabase]);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const dateFrom = getDateFromRange(dateRange);
      const dateTo = new Date().toISOString().split('T')[0];
      const params = new URLSearchParams({ dateFrom, dateTo });
      if (platformFilter !== 'all') params.set('platform', platformFilter);
      if (campaignFilter !== 'all') params.set('calendarId', campaignFilter);

      const res = await fetch(`/api/content/analytics?${params}`);
      const json = await res.json();
      setData(json);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    }
    setIsLoading(false);
  }, [dateRange, platformFilter, campaignFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (!contentEngineEnabled) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <SparklesIcon className="w-16 h-16 text-stone/30 mb-4" />
        <h2 className="text-heading-lg text-charcoal mb-2">Content Engine Locked</h2>
        <p className="text-stone max-w-md">
          Complete all phases in the Brand Engine to unlock Analytics.
        </p>
        <Button className="mt-6" onClick={() => window.location.href = '/brand'}>
          Continue Brand Engine
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        icon={ChartBarIcon}
        title="Analytics"
        subtitle="Track your content performance across platforms"
        action={<DateRangePicker value={dateRange} onChange={setDateRange} />}
      />

      {/* Filters row */}
      <div className="flex items-center gap-4 flex-wrap">
        {/* Platform Filter */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {platformFilters.map(filter => (
            <button
              key={filter.value}
              onClick={() => setPlatformFilter(filter.value)}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors',
                platformFilter === filter.value
                  ? 'bg-teal text-white'
                  : 'bg-cream-warm text-stone hover:text-charcoal'
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* Campaign Filter */}
        {campaigns.length > 0 && (
          <select
            value={campaignFilter}
            onChange={e => setCampaignFilter(e.target.value)}
            className="px-4 py-2 rounded-lg text-sm font-medium border border-stone/20 bg-white focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal"
          >
            <option value="all">All Campaigns</option>
            {campaigns.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        )}
      </div>

      {/* Overview Cards */}
      <OverviewCards
        data={data?.overview || {
          totalPosts: 0,
          totalEngagement: 0,
          totalImpressions: 0,
          avgEngagementRate: 0,
        }}
        isLoading={isLoading}
      />

      {/* Performance Chart */}
      <PerformanceChart
        data={data?.timeSeries || []}
        isLoading={isLoading}
      />

      {/* Top Posts Table */}
      <TopPostsTable
        posts={data?.topPosts || []}
        isLoading={isLoading}
      />

      {/* Platform Breakdown */}
      <PlatformBreakdown
        data={data?.platformSummary || []}
        isLoading={isLoading}
      />
    </div>
  );
}
