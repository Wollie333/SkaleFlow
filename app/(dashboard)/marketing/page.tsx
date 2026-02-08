'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import { Card, Badge, PageHeader } from '@/components/ui';
import { PlatformIcon } from '@/components/marketing/shared/platform-icon';
import {
  MegaphoneIcon,
  CurrencyDollarIcon,
  EyeIcon,
  CursorArrowRaysIcon,
  ArrowTrendingUpIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import type { AdPlatform } from '@/lib/marketing/types';

type DateRange = '7d' | '30d' | 'all';

interface Campaign {
  id: string;
  name: string;
  platform: string;
  objective: string;
  status: string;
  budget_type: string;
  budget_cents: number;
  currency: string;
  start_date: string | null;
  end_date: string | null;
  ad_set_count: number;
  creative_count: number;
  account_name: string | null;
  created_at: string;
}

interface OverviewMetrics {
  activeCampaigns: number;
  totalSpendCents: number;
  totalImpressions: number;
  avgCtr: number;
}

const DATE_RANGE_OPTIONS: { value: DateRange; label: string }[] = [
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: 'all', label: 'All time' },
];

function formatZAR(cents: number): string {
  return `R${(cents / 100).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
}

function formatNumber(num: number): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toLocaleString();
}

const STATUS_STYLES: Record<string, { label: string; variant: 'primary' | 'success' | 'warning' | 'danger' | 'default' }> = {
  draft: { label: 'Draft', variant: 'default' },
  active: { label: 'Active', variant: 'success' },
  paused: { label: 'Paused', variant: 'warning' },
  completed: { label: 'Completed', variant: 'primary' },
  archived: { label: 'Archived', variant: 'default' },
  error: { label: 'Error', variant: 'danger' },
};

export default function MarketingDashboardPage() {
  const supabase = createClient();
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>('30d');
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [metrics, setMetrics] = useState<OverviewMetrics>({
    activeCampaigns: 0,
    totalSpendCents: 0,
    totalImpressions: 0,
    avgCtr: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get the user's org
  useEffect(() => {
    async function loadOrg() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: membership } = await supabase
        .from('org_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .single();

      if (membership) {
        setOrganizationId(membership.organization_id);
      }
    }
    loadOrg();
  }, [supabase]);

  const loadData = useCallback(async () => {
    if (!organizationId) return;
    setIsLoading(true);
    setError(null);

    try {
      // Fetch campaigns
      const campaignRes = await fetch(
        `/api/marketing/campaigns?organizationId=${organizationId}`
      );
      if (!campaignRes.ok) throw new Error('Failed to load campaigns');
      const campaignData: Campaign[] = await campaignRes.json();
      setCampaigns(campaignData);

      // Calculate overview metrics from campaigns and metrics data
      const activeCampaigns = campaignData.filter(c => c.status === 'active').length;

      // Try to get analytics data
      let totalSpendCents = 0;
      let totalImpressions = 0;
      let avgCtr = 0;

      try {
        const analyticsRes = await fetch(
          `/api/marketing/analytics?organizationId=${organizationId}&range=${dateRange}`
        );
        if (analyticsRes.ok) {
          const analyticsData = await analyticsRes.json();
          totalSpendCents = analyticsData.totalSpendCents || 0;
          totalImpressions = analyticsData.totalImpressions || 0;
          avgCtr = analyticsData.avgCtr || 0;
        }
      } catch {
        // Analytics API may not exist yet; use campaign-level fallback
        totalSpendCents = campaignData
          .filter(c => c.status === 'active')
          .reduce((sum, c) => sum + (c.budget_cents || 0), 0);
      }

      setMetrics({
        activeCampaigns,
        totalSpendCents,
        totalImpressions,
        avgCtr,
      });
    } catch (err) {
      console.error('Failed to load marketing data:', err);
      setError('Failed to load marketing data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [organizationId, dateRange]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Loading skeleton
  if (isLoading && campaigns.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 bg-stone/10 rounded-lg animate-pulse" />
          <div className="h-8 w-48 bg-stone/10 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-32 bg-stone/10 rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="h-80 bg-stone/10 rounded-xl animate-pulse" />
      </div>
    );
  }

  const topCampaigns = campaigns
    .filter(c => c.status === 'active' || c.status === 'paused')
    .sort((a, b) => b.budget_cents - a.budget_cents)
    .slice(0, 5);

  const overviewCards = [
    {
      label: 'Active Campaigns',
      value: metrics.activeCampaigns.toString(),
      icon: MegaphoneIcon,
      color: 'text-teal',
      bgColor: 'bg-teal/10',
    },
    {
      label: 'Total Spend',
      value: formatZAR(metrics.totalSpendCents),
      icon: CurrencyDollarIcon,
      color: 'text-gold',
      bgColor: 'bg-gold/10',
    },
    {
      label: 'Total Impressions',
      value: formatNumber(metrics.totalImpressions),
      icon: EyeIcon,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      label: 'Avg CTR',
      value: `${metrics.avgCtr.toFixed(2)}%`,
      icon: CursorArrowRaysIcon,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Ads Dashboard"
        icon={MegaphoneIcon}
        subtitle="Monitor and manage your paid advertising campaigns"
        action={
          <div className="flex items-center gap-3">
            {/* Date Range Filter */}
            <div className="flex items-center gap-1 bg-cream-warm rounded-lg p-1">
              {DATE_RANGE_OPTIONS.map(option => (
                <button
                  key={option.value}
                  onClick={() => setDateRange(option.value)}
                  className={cn(
                    'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                    dateRange === option.value
                      ? 'bg-white text-charcoal shadow-sm'
                      : 'text-stone hover:text-charcoal'
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <Link
              href="/marketing/campaigns/new"
              className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-semibold rounded-lg bg-teal text-cream hover:bg-teal-light transition-all duration-300"
            >
              <PlusIcon className="w-4 h-4" />
              New Campaign
            </Link>
          </div>
        }
      />

      {/* Error State */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <p className="text-sm text-red-600">{error}</p>
        </Card>
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {overviewCards.map((card) => (
          <Card key={card.label}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-stone font-medium">{card.label}</p>
                <p className="text-2xl font-bold text-charcoal mt-1">{card.value}</p>
              </div>
              <div className={cn('p-2 rounded-lg', card.bgColor)}>
                <card.icon className={cn('w-5 h-5', card.color)} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Performance Chart Placeholder */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-heading-md text-charcoal">Performance Overview</h2>
          <div className="flex items-center gap-2 text-sm text-stone">
            <ArrowTrendingUpIcon className="w-4 h-4" />
            <span>{DATE_RANGE_OPTIONS.find(o => o.value === dateRange)?.label}</span>
          </div>
        </div>
        {metrics.totalImpressions > 0 ? (
          <div className="h-64 flex items-center justify-center text-stone">
            {/* Performance chart component will be rendered here */}
            <div className="text-center">
              <ArrowTrendingUpIcon className="w-12 h-12 text-stone/30 mx-auto mb-3" />
              <p className="text-sm">
                Performance chart data is loading from your connected ad platforms.
              </p>
              <p className="text-xs mt-1 text-stone/60">
                Connect an ad account in Settings to start tracking metrics.
              </p>
            </div>
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center">
            <div className="text-center">
              <ArrowTrendingUpIcon className="w-12 h-12 text-stone/30 mx-auto mb-3" />
              <p className="text-sm text-stone">
                No performance data yet. Create and launch a campaign to see analytics here.
              </p>
            </div>
          </div>
        )}
      </Card>

      {/* Active Campaigns List */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-heading-md text-charcoal">Top Campaigns</h2>
          <Link
            href="/marketing/campaigns"
            className="text-sm text-teal font-medium hover:text-teal-light transition-colors"
          >
            View all campaigns
          </Link>
        </div>

        {topCampaigns.length > 0 ? (
          <div className="divide-y divide-stone/5">
            {topCampaigns.map((campaign) => {
              const statusInfo = STATUS_STYLES[campaign.status] || STATUS_STYLES.draft;
              return (
                <Link
                  key={campaign.id}
                  href={`/marketing/campaigns/${campaign.id}`}
                  className="flex items-center gap-4 py-3 px-2 -mx-2 rounded-lg hover:bg-cream-warm/50 transition-colors group"
                >
                  <PlatformIcon
                    platform={campaign.platform as AdPlatform}
                    size="sm"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-charcoal truncate group-hover:text-teal transition-colors">
                      {campaign.name}
                    </p>
                    <p className="text-xs text-stone mt-0.5">
                      {campaign.objective} &middot; {campaign.ad_set_count} ad set{campaign.ad_set_count !== 1 ? 's' : ''} &middot; {campaign.creative_count} creative{campaign.creative_count !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-semibold text-charcoal">
                      {formatZAR(campaign.budget_cents)}
                      <span className="text-xs text-stone font-normal">
                        /{campaign.budget_type === 'daily' ? 'day' : 'total'}
                      </span>
                    </p>
                  </div>
                  <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="py-12 text-center">
            <MegaphoneIcon className="w-12 h-12 text-stone/30 mx-auto mb-3" />
            <h3 className="text-sm font-medium text-charcoal mb-1">
              No campaigns yet
            </h3>
            <p className="text-sm text-stone mb-4">
              Create your first ad campaign to start reaching your audience.
            </p>
            <Link
              href="/marketing/campaigns/new"
              className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-semibold rounded-lg bg-teal text-cream hover:bg-teal-light transition-all duration-300"
            >
              <PlusIcon className="w-4 h-4" />
              Create Campaign
            </Link>
          </div>
        )}
      </Card>
    </div>
  );
}
