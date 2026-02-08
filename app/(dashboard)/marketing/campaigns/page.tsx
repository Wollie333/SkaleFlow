'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import { Card, Badge, Button, PageHeader } from '@/components/ui';
import { PlatformIcon } from '@/components/marketing/shared/platform-icon';
import {
  MegaphoneIcon,
  FunnelIcon,
  PlusIcon,
  ChevronRightIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  RectangleStackIcon,
  PhotoIcon,
  RocketLaunchIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import type { AdPlatform } from '@/lib/marketing/types';

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

const PLATFORM_OPTIONS = [
  { value: 'all', label: 'All Platforms' },
  { value: 'meta', label: 'Meta' },
  { value: 'tiktok', label: 'TikTok' },
];

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Statuses' },
  { value: 'draft', label: 'Draft' },
  { value: 'active', label: 'Active' },
  { value: 'paused', label: 'Paused' },
  { value: 'completed', label: 'Completed' },
  { value: 'archived', label: 'Archived' },
];

const STATUS_STYLES: Record<string, { label: string; variant: 'primary' | 'success' | 'warning' | 'danger' | 'default' }> = {
  draft: { label: 'Draft', variant: 'default' },
  active: { label: 'Active', variant: 'success' },
  paused: { label: 'Paused', variant: 'warning' },
  completed: { label: 'Completed', variant: 'primary' },
  archived: { label: 'Archived', variant: 'default' },
  error: { label: 'Error', variant: 'danger' },
};

function formatZAR(cents: number): string {
  return `R${(cents / 100).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
}

export default function CampaignListPage() {
  const supabase = createClient();
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [platformFilter, setPlatformFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const loadCampaigns = useCallback(async () => {
    if (!organizationId) return;
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({ organizationId });
      if (platformFilter !== 'all') params.set('platform', platformFilter);
      if (statusFilter !== 'all') params.set('status', statusFilter);

      const res = await fetch(`/api/marketing/campaigns?${params}`);
      if (!res.ok) throw new Error('Failed to load campaigns');
      const data: Campaign[] = await res.json();
      setCampaigns(data);
    } catch (err) {
      console.error('Failed to load campaigns:', err);
      setError('Failed to load campaigns. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [organizationId, platformFilter, statusFilter]);

  useEffect(() => {
    loadCampaigns();
  }, [loadCampaigns]);

  // Loading skeleton
  if (isLoading && campaigns.length === 0 && !error) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 bg-stone/10 rounded animate-pulse" />
        <div className="h-12 bg-stone/10 rounded-xl animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-56 bg-stone/10 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb + Header */}
      <PageHeader
        title="Campaigns"
        icon={RocketLaunchIcon}
        breadcrumbs={[
          { label: 'Marketing', href: '/marketing' },
          { label: 'Campaigns' },
        ]}
        action={
          <Link
            href="/marketing/campaigns/new"
            className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-semibold rounded-lg bg-teal text-cream hover:bg-teal-light transition-all duration-300"
          >
            <PlusIcon className="w-4 h-4" />
            New Campaign
          </Link>
        }
      />

      {/* Filter Bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <FunnelIcon className="w-4 h-4 text-stone" />
          <span className="text-sm text-stone">Filters:</span>
        </div>

        <select
          value={platformFilter}
          onChange={e => setPlatformFilter(e.target.value)}
          className="px-4 py-2 rounded-lg text-sm font-medium border border-stone/20 bg-white focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal"
        >
          {PLATFORM_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="px-4 py-2 rounded-lg text-sm font-medium border border-stone/20 bg-white focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal"
        >
          {STATUS_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>

        {(platformFilter !== 'all' || statusFilter !== 'all') && (
          <button
            onClick={() => { setPlatformFilter('all'); setStatusFilter('all'); }}
            className="text-sm text-teal hover:text-teal-light font-medium transition-colors"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Error State */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <p className="text-sm text-red-600">{error}</p>
          <button
            onClick={loadCampaigns}
            className="text-sm text-red-700 font-medium underline mt-1"
          >
            Retry
          </button>
        </Card>
      )}

      {/* Campaign Grid */}
      {campaigns.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {campaigns.map((campaign) => {
            const statusInfo = STATUS_STYLES[campaign.status] || STATUS_STYLES.draft;
            return (
              <Link key={campaign.id} href={`/marketing/campaigns/${campaign.id}`}>
                <Card hover className="h-full flex flex-col">
                  {/* Card Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <PlatformIcon
                        platform={campaign.platform as AdPlatform}
                        size="sm"
                      />
                      <div className="min-w-0">
                        <h3 className="text-sm font-semibold text-charcoal truncate">
                          {campaign.name}
                        </h3>
                        <p className="text-xs text-stone capitalize">
                          {campaign.objective.replace(/_/g, ' ')}
                        </p>
                      </div>
                    </div>
                    <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                  </div>

                  {/* Budget */}
                  <div className="flex items-center gap-2 mb-3">
                    <CurrencyDollarIcon className="w-4 h-4 text-stone" />
                    <span className="text-sm text-charcoal font-medium">
                      {formatZAR(campaign.budget_cents)}
                    </span>
                    <span className="text-xs text-stone">
                      / {campaign.budget_type === 'daily' ? 'day' : 'total'}
                    </span>
                  </div>

                  {/* Date Range */}
                  {campaign.start_date && (
                    <div className="flex items-center gap-2 mb-3">
                      <CalendarIcon className="w-4 h-4 text-stone" />
                      <span className="text-xs text-stone">
                        {new Date(campaign.start_date).toLocaleDateString('en-ZA', { month: 'short', day: 'numeric' })}
                        {campaign.end_date && (
                          <> &mdash; {new Date(campaign.end_date).toLocaleDateString('en-ZA', { month: 'short', day: 'numeric' })}</>
                        )}
                      </span>
                    </div>
                  )}

                  {/* Footer Stats */}
                  <div className="mt-auto pt-3 border-t border-stone/5 flex items-center gap-4">
                    <div className="flex items-center gap-1.5">
                      <RectangleStackIcon className="w-3.5 h-3.5 text-stone" />
                      <span className="text-xs text-stone">
                        {campaign.ad_set_count} ad set{campaign.ad_set_count !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <PhotoIcon className="w-3.5 h-3.5 text-stone" />
                      <span className="text-xs text-stone">
                        {campaign.creative_count} creative{campaign.creative_count !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      ) : (
        <Card>
          <div className="py-16 text-center">
            <MegaphoneIcon className="w-16 h-16 text-stone/20 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-charcoal mb-2">
              No campaigns yet
            </h3>
            <p className="text-sm text-stone mb-6 max-w-md mx-auto">
              Create your first ad campaign to get started. You can target audiences on Meta and TikTok with AI-generated creatives.
            </p>
            <Link
              href="/marketing/campaigns/new"
              className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-semibold rounded-lg bg-teal text-cream hover:bg-teal-light transition-all duration-300"
            >
              <PlusIcon className="w-4 h-4" />
              Create Your First Campaign
            </Link>
          </div>
        </Card>
      )}
    </div>
  );
}
