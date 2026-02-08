'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import { Card, Badge, Button, PageHeader } from '@/components/ui';
import { PlatformIcon } from '@/components/marketing/shared/platform-icon';
import {
  ChevronRightIcon,
  PauseIcon,
  PlayIcon,
  PencilSquareIcon,
  ArrowPathIcon,
  PlusIcon,
  SparklesIcon,
  PhotoIcon,
  RectangleStackIcon,
  ChartBarIcon,
  TrashIcon,
  ArrowTrendingUpIcon,
  EyeIcon,
  CursorArrowRaysIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  ExclamationTriangleIcon,
  RocketLaunchIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import type { AdPlatform } from '@/lib/marketing/types';
import type { Json } from '@/types/database';

interface AdSet {
  id: string;
  name: string;
  targeting_config: Json;
  placements: string[];
  bidding_strategy: string;
  bid_amount_cents: number | null;
  budget_type: string | null;
  budget_cents: number | null;
  status: string;
  platform_ad_set_id: string | null;
  created_at: string;
}

interface AdCreative {
  id: string;
  name: string;
  format: string;
  media_urls: string[];
  thumbnail_url: string | null;
  primary_text: string;
  headline: string | null;
  cta_type: string | null;
  target_url: string;
  ai_generated: boolean;
  compliance_status: string;
  compliance_issues: Json;
  status: string;
  created_at: string;
}

interface CampaignDetail {
  id: string;
  organization_id: string;
  ad_account_id: string;
  name: string;
  platform: string;
  objective: string;
  status: string;
  budget_type: string;
  budget_cents: number;
  currency: string;
  start_date: string | null;
  end_date: string | null;
  special_ad_category: string | null;
  platform_campaign_id: string | null;
  created_at: string;
  ad_sets: AdSet[];
  ad_creatives: AdCreative[];
}

type TabKey = 'ad_sets' | 'creatives' | 'analytics';

const STATUS_STYLES: Record<string, { label: string; variant: 'primary' | 'success' | 'warning' | 'danger' | 'default' }> = {
  draft: { label: 'Draft', variant: 'default' },
  active: { label: 'Active', variant: 'success' },
  paused: { label: 'Paused', variant: 'warning' },
  completed: { label: 'Completed', variant: 'primary' },
  archived: { label: 'Archived', variant: 'default' },
  error: { label: 'Error', variant: 'danger' },
  pending_review: { label: 'Pending Review', variant: 'warning' },
  approved: { label: 'Approved', variant: 'success' },
  rejected: { label: 'Rejected', variant: 'danger' },
};

const COMPLIANCE_STYLES: Record<string, { label: string; variant: 'success' | 'warning' | 'danger' | 'default' }> = {
  passed: { label: 'Passed', variant: 'success' },
  flagged: { label: 'Flagged', variant: 'warning' },
  rejected: { label: 'Rejected', variant: 'danger' },
  pending: { label: 'Pending', variant: 'default' },
  unchecked: { label: 'Unchecked', variant: 'default' },
};

function formatZAR(cents: number): string {
  return `R${(cents / 100).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
}

function summarizeTargeting(config: Json): string {
  if (!config || typeof config !== 'object') return 'No targeting set';
  const c = config as Record<string, any>;
  const parts: string[] = [];
  if (c.ageMin || c.ageMax) parts.push(`Ages ${c.ageMin || 18}-${c.ageMax || 65}`);
  if (c.locations?.length) parts.push(`${c.locations.length} location(s)`);
  if (c.interests?.length) parts.push(`${c.interests.length} interest(s)`);
  if (c.customAudiences?.length) parts.push(`${c.customAudiences.length} audience(s)`);
  return parts.length > 0 ? parts.join(' | ') : 'No targeting set';
}

export default function CampaignDetailPage() {
  const params = useParams();
  const router = useRouter();
  const campaignId = params.campaignId as string;
  const supabase = createClient();

  const [campaign, setCampaign] = useState<CampaignDetail | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>('ad_sets');
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCampaign = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/marketing/campaigns/${campaignId}`);
      if (!res.ok) throw new Error('Campaign not found');
      const data: CampaignDetail = await res.json();
      setCampaign(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load campaign');
    } finally {
      setIsLoading(false);
    }
  }, [campaignId]);

  useEffect(() => {
    loadCampaign();
  }, [loadCampaign]);

  async function handleToggleStatus() {
    if (!campaign) return;
    const newStatus = campaign.status === 'active' ? 'paused' : 'active';
    setIsUpdating(true);
    try {
      const res = await fetch(`/api/marketing/campaigns/${campaignId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update status');
      }
      const updated = await res.json();
      setCampaign(prev => prev ? { ...prev, status: updated.status } : prev);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsUpdating(false);
    }
  }

  async function handleDelete() {
    if (!campaign) return;
    if (!confirm('Are you sure you want to delete this draft campaign? This action cannot be undone.')) return;
    setIsUpdating(true);
    try {
      const res = await fetch(`/api/marketing/campaigns/${campaignId}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete campaign');
      }
      router.push('/marketing/campaigns');
    } catch (err: any) {
      setError(err.message);
      setIsUpdating(false);
    }
  }

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-6 w-64 bg-stone/10 rounded animate-pulse" />
        <div className="h-40 bg-stone/10 rounded-xl animate-pulse" />
        <div className="h-10 w-96 bg-stone/10 rounded animate-pulse" />
        <div className="h-64 bg-stone/10 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (error && !campaign) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Campaign Not Found"
          icon={RocketLaunchIcon}
          breadcrumbs={[
            { label: 'Marketing', href: '/marketing' },
            { label: 'Campaigns', href: '/marketing/campaigns' },
          ]}
        />
        <Card className="border-red-200 bg-red-50">
          <div className="py-8 text-center">
            <ExclamationTriangleIcon className="w-12 h-12 text-red-400 mx-auto mb-3" />
            <p className="text-sm text-red-600">{error}</p>
            <button
              onClick={() => router.push('/marketing/campaigns')}
              className="mt-3 text-sm font-medium text-red-700 underline"
            >
              Back to campaigns
            </button>
          </div>
        </Card>
      </div>
    );
  }

  if (!campaign) return null;

  const statusInfo = STATUS_STYLES[campaign.status] || STATUS_STYLES.draft;
  const adSets = campaign.ad_sets || [];
  const creatives = campaign.ad_creatives || [];

  const TABS: { key: TabKey; label: string; icon: React.ElementType; count: number }[] = [
    { key: 'ad_sets', label: 'Ad Sets', icon: RectangleStackIcon, count: adSets.length },
    { key: 'creatives', label: 'Creatives', icon: PhotoIcon, count: creatives.length },
    { key: 'analytics', label: 'Analytics', icon: ChartBarIcon, count: 0 },
  ];

  return (
    <div className="space-y-6">
      {/* Breadcrumb + Header */}
      <PageHeader
        title={campaign.name}
        icon={RocketLaunchIcon}
        breadcrumbs={[
          { label: 'Marketing', href: '/marketing' },
          { label: 'Campaigns', href: '/marketing/campaigns' },
          { label: campaign.name },
        ]}
      />

      {/* Campaign Header Card */}
      <Card>
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-start gap-4">
            <PlatformIcon platform={campaign.platform as AdPlatform} size="lg" />
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl font-bold text-charcoal">{campaign.name}</h2>
                <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
              </div>
              <p className="text-sm text-stone mt-1 capitalize">
                {campaign.objective.replace(/_/g, ' ').replace(/^OUTCOME /, '')}
                {campaign.special_ad_category && (
                  <> &middot; {campaign.special_ad_category.replace(/_/g, ' ')}</>
                )}
              </p>
              <div className="flex items-center gap-4 mt-2">
                <div className="flex items-center gap-1.5">
                  <CurrencyDollarIcon className="w-4 h-4 text-stone" />
                  <span className="text-sm text-charcoal font-medium">
                    {formatZAR(campaign.budget_cents)}
                  </span>
                  <span className="text-xs text-stone">
                    /{campaign.budget_type === 'daily' ? 'day' : 'total'}
                  </span>
                </div>
                {campaign.start_date && (
                  <span className="text-xs text-stone">
                    {new Date(campaign.start_date).toLocaleDateString('en-ZA', { month: 'short', day: 'numeric', year: 'numeric' })}
                    {campaign.end_date && (
                      <> &mdash; {new Date(campaign.end_date).toLocaleDateString('en-ZA', { month: 'short', day: 'numeric', year: 'numeric' })}</>
                    )}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {campaign.platform_campaign_id && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => loadCampaign()}
                title="Sync from platform"
              >
                <ArrowPathIcon className="w-4 h-4" />
                Sync
              </Button>
            )}

            {(campaign.status === 'active' || campaign.status === 'paused') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleToggleStatus}
                disabled={isUpdating}
              >
                {campaign.status === 'active' ? (
                  <><PauseIcon className="w-4 h-4" /> Pause</>
                ) : (
                  <><PlayIcon className="w-4 h-4" /> Resume</>
                )}
              </Button>
            )}

            {campaign.status === 'draft' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                disabled={isUpdating}
                className="text-red-500 hover:text-red-600 hover:bg-red-50"
              >
                <TrashIcon className="w-4 h-4" />
                Delete
              </Button>
            )}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
      </Card>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-stone/10">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              'flex items-center gap-2 px-4 pb-3 text-sm font-medium border-b-2 transition-colors',
              activeTab === tab.key
                ? 'border-teal text-teal'
                : 'border-transparent text-stone hover:text-charcoal'
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
            {tab.count > 0 && (
              <span className={cn(
                'text-xs px-1.5 py-0.5 rounded-full',
                activeTab === tab.key ? 'bg-teal/10 text-teal' : 'bg-stone/10 text-stone'
              )}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content: Ad Sets */}
      {activeTab === 'ad_sets' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-heading-md text-charcoal">Ad Sets</h2>
            <Button size="sm">
              <PlusIcon className="w-4 h-4" />
              Add Ad Set
            </Button>
          </div>

          {adSets.length > 0 ? (
            <div className="space-y-3">
              {adSets.map((adSet) => {
                const setStatus = STATUS_STYLES[adSet.status] || STATUS_STYLES.draft;
                return (
                  <Card key={adSet.id}>
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-semibold text-charcoal">{adSet.name}</h3>
                          <Badge variant={setStatus.variant}>{setStatus.label}</Badge>
                        </div>
                        <p className="text-xs text-stone mt-1">
                          {summarizeTargeting(adSet.targeting_config)}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-stone">
                          <span>Strategy: {adSet.bidding_strategy}</span>
                          {adSet.placements.length > 0 && (
                            <span>{adSet.placements.length} placement(s)</span>
                          )}
                          {adSet.budget_cents && (
                            <span>Budget: {formatZAR(adSet.budget_cents)}</span>
                          )}
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        <PencilSquareIcon className="w-4 h-4" />
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card>
              <div className="py-12 text-center">
                <RectangleStackIcon className="w-12 h-12 text-stone/20 mx-auto mb-3" />
                <h3 className="text-sm font-medium text-charcoal mb-1">No ad sets yet</h3>
                <p className="text-sm text-stone mb-4">
                  Ad sets define your target audience and placements.
                </p>
                <Button size="sm">
                  <PlusIcon className="w-4 h-4" />
                  Create First Ad Set
                </Button>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Tab Content: Creatives */}
      {activeTab === 'creatives' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h2 className="text-heading-md text-charcoal">Creatives</h2>
            <div className="flex items-center gap-2">
              <Link
                href={`/marketing/campaigns/${campaignId}/creatives/generate`}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-gold/10 text-gold hover:bg-gold/20 transition-colors"
              >
                <SparklesIcon className="w-4 h-4" />
                Generate with AI
              </Link>
              <Button size="sm">
                <PlusIcon className="w-4 h-4" />
                Add Creative
              </Button>
            </div>
          </div>

          {creatives.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {creatives.map((creative) => {
                const creativeStatus = STATUS_STYLES[creative.status] || STATUS_STYLES.draft;
                const complianceInfo = COMPLIANCE_STYLES[creative.compliance_status] || COMPLIANCE_STYLES.unchecked;
                return (
                  <Card key={creative.id} hover>
                    {/* Thumbnail */}
                    <div className="h-40 rounded-lg bg-cream-warm mb-3 flex items-center justify-center overflow-hidden">
                      {creative.thumbnail_url || (creative.media_urls && creative.media_urls.length > 0) ? (
                        <img
                          src={creative.thumbnail_url || creative.media_urls[0]}
                          alt={creative.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <PhotoIcon className="w-12 h-12 text-stone/30" />
                      )}
                    </div>

                    {/* Creative Info */}
                    <div className="flex items-start justify-between mb-2">
                      <div className="min-w-0">
                        <h3 className="text-sm font-semibold text-charcoal truncate">
                          {creative.name}
                        </h3>
                        <p className="text-xs text-stone mt-0.5 capitalize">
                          {creative.format.replace(/_/g, ' ')}
                        </p>
                      </div>
                      <Badge variant={creativeStatus.variant}>{creativeStatus.label}</Badge>
                    </div>

                    {/* Primary Text Preview */}
                    <p className="text-xs text-stone line-clamp-2 mb-3">
                      {creative.primary_text}
                    </p>

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-2 border-t border-stone/5">
                      <div className="flex items-center gap-2">
                        <Badge variant={complianceInfo.variant} size="sm">
                          {complianceInfo.label}
                        </Badge>
                        {creative.ai_generated && (
                          <span className="flex items-center gap-1 text-xs text-gold">
                            <SparklesIcon className="w-3 h-3" />
                            AI
                          </span>
                        )}
                      </div>
                      {creative.headline && (
                        <p className="text-xs text-stone truncate max-w-[120px]">
                          {creative.headline}
                        </p>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card>
              <div className="py-12 text-center">
                <PhotoIcon className="w-12 h-12 text-stone/20 mx-auto mb-3" />
                <h3 className="text-sm font-medium text-charcoal mb-1">No creatives yet</h3>
                <p className="text-sm text-stone mb-4">
                  Add ad creatives or generate them with AI using your brand guidelines.
                </p>
                <div className="flex items-center gap-3 justify-center">
                  <Link
                    href={`/marketing/campaigns/${campaignId}/creatives/generate`}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-gold/10 text-gold hover:bg-gold/20 transition-colors"
                  >
                    <SparklesIcon className="w-4 h-4" />
                    Generate with AI
                  </Link>
                  <Button size="sm" variant="ghost">
                    <PlusIcon className="w-4 h-4" />
                    Add Manually
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Tab Content: Analytics */}
      {activeTab === 'analytics' && (
        <div className="space-y-4">
          <h2 className="text-heading-md text-charcoal">Campaign Analytics</h2>

          {campaign.platform_campaign_id ? (
            <>
              {/* Metrics Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Impressions', value: '--', icon: EyeIcon, color: 'text-blue-600', bg: 'bg-blue-50' },
                  { label: 'Clicks', value: '--', icon: CursorArrowRaysIcon, color: 'text-teal', bg: 'bg-teal/10' },
                  { label: 'Spend', value: '--', icon: CurrencyDollarIcon, color: 'text-gold', bg: 'bg-gold/10' },
                  { label: 'Reach', value: '--', icon: UserGroupIcon, color: 'text-green-600', bg: 'bg-green-50' },
                ].map(metric => (
                  <Card key={metric.label}>
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs text-stone">{metric.label}</p>
                        <p className="text-xl font-bold text-charcoal mt-1">{metric.value}</p>
                      </div>
                      <div className={cn('p-1.5 rounded-lg', metric.bg)}>
                        <metric.icon className={cn('w-4 h-4', metric.color)} />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Chart Placeholder */}
              <Card>
                <div className="h-64 flex items-center justify-center">
                  <div className="text-center">
                    <ArrowTrendingUpIcon className="w-12 h-12 text-stone/30 mx-auto mb-3" />
                    <p className="text-sm text-stone">
                      Analytics data will appear after the campaign starts delivering.
                    </p>
                  </div>
                </div>
              </Card>
            </>
          ) : (
            <Card>
              <div className="py-12 text-center">
                <ChartBarIcon className="w-12 h-12 text-stone/20 mx-auto mb-3" />
                <h3 className="text-sm font-medium text-charcoal mb-1">
                  No analytics data available
                </h3>
                <p className="text-sm text-stone">
                  Analytics will be available once the campaign is synced to the ad platform and starts delivering impressions.
                </p>
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
