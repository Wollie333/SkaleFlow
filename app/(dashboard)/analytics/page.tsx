'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { PageHeader } from '@/components/ui';
import { ChartBarIcon, SparklesIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui';
import { cn } from '@/lib/utils';
import { OverviewTabContent } from '@/components/analytics/overview-tab-content';
import { PlatformTabContent } from '@/components/analytics/platform-tab-content';
import { DateRangePicker, getDateFromRange, type DateRange } from '@/components/analytics/date-range-picker';
import { ExportButton } from '@/components/analytics/export-button';
import type { AnalyticsResponse } from '@/components/analytics/types';
import type { AudienceInsight } from '@/components/analytics/audience-insights-panel';
import type { SocialPlatform } from '@/types/database';
import { PLATFORM_CONFIG } from '@/lib/social/types';

type AnalyticsTab = 'overview' | SocialPlatform;

interface CampaignOption {
  id: string;
  name: string;
}

const EMPTY_OVERVIEW: AnalyticsResponse['overview'] = {
  totalPosts: 0,
  totalEngagement: 0,
  totalImpressions: 0,
  avgEngagementRate: 0,
  totalReach: 0,
  totalClicks: 0,
  totalSaves: 0,
  totalVideoViews: 0,
  totalLikes: 0,
  totalComments: 0,
  totalShares: 0,
};

const EMPTY_DATA: AnalyticsResponse = {
  overview: EMPTY_OVERVIEW,
  timeSeries: [],
  topPosts: [],
  platformSummary: [],
  connectedPlatforms: [],
  followerGrowth: [],
  engagementHeatmap: [],
};

export default function AnalyticsPage() {
  const supabase = createClient();
  const [dateRange, setDateRange] = useState<DateRange>('30d');
  const [campaignFilter, setCampaignFilter] = useState('all');
  const [campaigns, setCampaigns] = useState<CampaignOption[]>([]);
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [contentEngineEnabled, setContentEngineEnabled] = useState(true);
  const [activeTab, setActiveTab] = useState<AnalyticsTab>('overview');
  const [audienceInsights, setAudienceInsights] = useState<AudienceInsight[]>([]);
  const [audienceLoading, setAudienceLoading] = useState(false);

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
      if (campaignFilter !== 'all') params.set('calendarId', campaignFilter);

      const res = await fetch(`/api/content/analytics?${params}`);
      const json = await res.json();
      setData(json);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    }
    setIsLoading(false);
  }, [dateRange, campaignFilter]);

  const dateFrom = getDateFromRange(dateRange);
  const dateTo = new Date().toISOString().split('T')[0];

  // Fetch audience insights (separate endpoint, fetched once on mount)
  const loadAudienceInsights = useCallback(async () => {
    setAudienceLoading(true);
    try {
      const res = await fetch('/api/social/analytics/audience-insights');
      const json = await res.json();
      if (res.ok && json.insights) {
        setAudienceInsights(json.insights);
      }
    } catch (error) {
      console.error('Failed to load audience insights:', error);
    }
    setAudienceLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    loadAudienceInsights();
  }, [loadAudienceInsights]);

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

  const analyticsData = data || EMPTY_DATA;
  const connectedPlatforms = analyticsData.connectedPlatforms || [];

  // Find audience insight for the active platform tab
  const activeAudienceInsight = activeTab !== 'overview'
    ? audienceInsights.find(i => i.platform === activeTab) || null
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        icon={ChartBarIcon}
        title="Analytics"
        subtitle="Track your content performance across platforms"
        action={
          <div className="flex items-center gap-2">
            <ExportButton dateFrom={dateFrom} dateTo={dateTo} />
            <DateRangePicker value={dateRange} onChange={setDateRange} />
          </div>
        }
      />

      {/* Filters row: Tabs + Campaign filter */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        {/* Tab bar */}
        <div className="flex gap-4 border-b border-stone/10 overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
          <button
            onClick={() => setActiveTab('overview')}
            className={cn(
              'pb-3 px-1 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex-shrink-0',
              activeTab === 'overview'
                ? 'border-teal text-teal'
                : 'border-transparent text-stone hover:text-charcoal'
            )}
          >
            Overview
          </button>
          {connectedPlatforms.map(platform => {
            const config = PLATFORM_CONFIG[platform];
            const isActive = activeTab === platform;
            return (
              <button
                key={platform}
                onClick={() => setActiveTab(platform)}
                className={cn(
                  'pb-3 px-1 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex-shrink-0',
                  isActive
                    ? 'border-teal text-teal'
                    : 'border-transparent text-stone hover:text-charcoal'
                )}
              >
                {config.name}
              </button>
            );
          })}
        </div>

        {/* Campaign Filter */}
        {campaigns.length > 0 && (
          <select
            value={campaignFilter}
            onChange={e => setCampaignFilter(e.target.value)}
            className="px-4 py-2 rounded-lg text-sm font-medium border border-stone/20 bg-cream-warm focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal"
          >
            <option value="all">All Campaigns</option>
            {campaigns.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        )}
      </div>

      {/* No connections empty state */}
      {!isLoading && connectedPlatforms.length === 0 && analyticsData.overview.totalPosts === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Cog6ToothIcon className="w-12 h-12 text-stone/30 mb-4" />
          <h3 className="text-heading-md text-charcoal mb-2">No social accounts connected</h3>
          <p className="text-stone max-w-sm mb-4">
            Connect your social media accounts in Settings to start tracking analytics.
          </p>
          <Button
            variant="outline"
            onClick={() => window.location.href = '/settings'}
          >
            Go to Settings
          </Button>
        </div>
      )}

      {/* Tab Content */}
      {activeTab === 'overview' ? (
        <OverviewTabContent data={analyticsData} isLoading={isLoading} />
      ) : (
        <PlatformTabContent
          platform={activeTab}
          data={analyticsData}
          isLoading={isLoading}
          audienceInsight={activeAudienceInsight}
          audienceLoading={audienceLoading}
        />
      )}
    </div>
  );
}
