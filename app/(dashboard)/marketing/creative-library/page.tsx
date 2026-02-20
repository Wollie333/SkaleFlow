'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import { Card, Badge, Button, Input, PageHeader } from '@/components/ui';
import { PlatformIcon } from '@/components/marketing/shared/platform-icon';
import {
  PhotoIcon,
  ChevronRightIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  SparklesIcon,
  XMarkIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon,
  LinkIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import type { AdPlatform } from '@/lib/marketing/types';
import type { Json } from '@/types/database';

interface Creative {
  id: string;
  ad_set_id: string | null;
  campaign_id: string | null;
  organization_id: string;
  name: string;
  format: string;
  media_urls: string[];
  thumbnail_url: string | null;
  primary_text: string;
  headline: string | null;
  description: string | null;
  cta_type: string | null;
  target_url: string;
  ai_generated: boolean;
  ai_model: string | null;
  funnel_stage: string | null;
  storybrand_stage: string | null;
  compliance_status: string;
  compliance_issues: Json;
  status: string;
  rejection_reason: string | null;
  created_at: string;
  // Joined from campaign
  campaign_name?: string;
  campaign_platform?: string;
}

const COMPLIANCE_OPTIONS = [
  { value: 'all', label: 'All Statuses' },
  { value: 'passed', label: 'Passed' },
  { value: 'flagged', label: 'Flagged' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'pending', label: 'Pending' },
  { value: 'unchecked', label: 'Unchecked' },
];

const FORMAT_OPTIONS = [
  { value: 'all', label: 'All Formats' },
  { value: 'single_image', label: 'Single Image' },
  { value: 'single_video', label: 'Single Video' },
  { value: 'carousel', label: 'Carousel' },
  { value: 'collection', label: 'Collection' },
  { value: 'in_feed', label: 'In-Feed' },
  { value: 'topview', label: 'TopView' },
  { value: 'spark_ad', label: 'Spark Ad' },
];

const PLATFORM_OPTIONS = [
  { value: 'all', label: 'All Platforms' },
  { value: 'meta', label: 'Meta' },
  { value: 'tiktok', label: 'TikTok' },
];

const COMPLIANCE_STYLES: Record<string, { label: string; variant: 'success' | 'warning' | 'danger' | 'default'; icon: React.ElementType }> = {
  passed: { label: 'Passed', variant: 'success', icon: ShieldCheckIcon },
  flagged: { label: 'Flagged', variant: 'warning', icon: ExclamationTriangleIcon },
  rejected: { label: 'Rejected', variant: 'danger', icon: XMarkIcon },
  pending: { label: 'Pending', variant: 'default', icon: ShieldCheckIcon },
  unchecked: { label: 'Unchecked', variant: 'default', icon: ShieldCheckIcon },
};

const STATUS_STYLES: Record<string, { label: string; variant: 'primary' | 'success' | 'warning' | 'danger' | 'default' }> = {
  draft: { label: 'Draft', variant: 'default' },
  active: { label: 'Active', variant: 'success' },
  paused: { label: 'Paused', variant: 'warning' },
  approved: { label: 'Approved', variant: 'success' },
  rejected: { label: 'Rejected', variant: 'danger' },
  archived: { label: 'Archived', variant: 'default' },
};

export default function CreativeLibraryPage() {
  const supabase = createClient();
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [creatives, setCreatives] = useState<Creative[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [complianceFilter, setComplianceFilter] = useState('all');
  const [formatFilter, setFormatFilter] = useState('all');
  const [platformFilter, setPlatformFilter] = useState('all');
  const [aiOnlyFilter, setAiOnlyFilter] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Slide-over panel state
  const [selectedCreative, setSelectedCreative] = useState<Creative | null>(null);

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

  const loadCreatives = useCallback(async () => {
    if (!organizationId) return;
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/marketing/creatives?organizationId=${organizationId}`);
      if (res.ok) {
        const data = await res.json();
        setCreatives(data);
      } else {
        // API may not exist yet, try direct query
        const { data, error: dbError } = await supabase
          .from('ad_creatives')
          .select('*, ad_campaigns(name, platform)')
          .eq('organization_id', organizationId)
          .order('created_at', { ascending: false });

        if (dbError) throw dbError;

        setCreatives((data || []).map((c: any) => ({
          ...c,
          campaign_name: c.ad_campaigns?.name || null,
          campaign_platform: c.ad_campaigns?.platform || null,
          ad_campaigns: undefined,
        })));
      }
    } catch (err: any) {
      console.error('Failed to load creatives:', err);
      setError('Failed to load creatives');
      setCreatives([]);
    } finally {
      setIsLoading(false);
    }
  }, [organizationId, supabase]);

  useEffect(() => {
    loadCreatives();
  }, [loadCreatives]);

  // Filter creatives
  const filteredCreatives = creatives.filter(c => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        c.name.toLowerCase().includes(q) ||
        c.primary_text.toLowerCase().includes(q) ||
        (c.headline && c.headline.toLowerCase().includes(q));
      if (!matchesSearch) return false;
    }
    if (complianceFilter !== 'all' && c.compliance_status !== complianceFilter) return false;
    if (formatFilter !== 'all' && c.format !== formatFilter) return false;
    if (platformFilter !== 'all' && c.campaign_platform !== platformFilter) return false;
    if (aiOnlyFilter && !c.ai_generated) return false;
    return true;
  });

  if (isLoading && creatives.length === 0) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-stone/10 rounded animate-pulse" />
        <div className="h-12 bg-stone/10 rounded-xl animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <div key={i} className="h-64 bg-stone/10 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb + Header */}
      <PageHeader
        title="Creative Library"
        icon={PhotoIcon}
        subtitle="All your ad creatives across campaigns in one place"
        breadcrumbs={[
          { label: 'Marketing', href: '/marketing' },
          { label: 'Creative Library' },
        ]}
      />

      {/* Search + Filter Bar */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search creatives..."
            className="w-full pl-10 pr-4 py-2 rounded-lg text-sm border border-stone/20 bg-cream-warm focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <XMarkIcon className="w-4 h-4 text-stone" />
            </button>
          )}
        </div>

        <select
          value={complianceFilter}
          onChange={e => setComplianceFilter(e.target.value)}
          className="px-4 py-2 rounded-lg text-sm font-medium border border-stone/20 bg-cream-warm focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal"
        >
          {COMPLIANCE_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>

        <select
          value={formatFilter}
          onChange={e => setFormatFilter(e.target.value)}
          className="px-4 py-2 rounded-lg text-sm font-medium border border-stone/20 bg-cream-warm focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal"
        >
          {FORMAT_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>

        <select
          value={platformFilter}
          onChange={e => setPlatformFilter(e.target.value)}
          className="px-4 py-2 rounded-lg text-sm font-medium border border-stone/20 bg-cream-warm focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal"
        >
          {PLATFORM_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>

        {/* AI Filter Toggle */}
        <button
          onClick={() => setAiOnlyFilter(!aiOnlyFilter)}
          className={cn(
            'flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium border transition-colors',
            aiOnlyFilter
              ? 'border-gold bg-gold/10 text-gold'
              : 'border-stone/20 text-stone hover:text-charcoal'
          )}
        >
          <SparklesIcon className="w-4 h-4" />
          AI Generated
        </button>

        {(searchQuery || complianceFilter !== 'all' || formatFilter !== 'all' || platformFilter !== 'all' || aiOnlyFilter) && (
          <button
            onClick={() => {
              setSearchQuery('');
              setComplianceFilter('all');
              setFormatFilter('all');
              setPlatformFilter('all');
              setAiOnlyFilter(false);
            }}
            className="text-sm text-teal hover:text-teal-light font-medium transition-colors"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Results count */}
      <p className="text-sm text-stone">
        {filteredCreatives.length} creative{filteredCreatives.length !== 1 ? 's' : ''}
        {creatives.length !== filteredCreatives.length && ` (of ${creatives.length} total)`}
      </p>

      {/* Error */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <p className="text-sm text-red-600">{error}</p>
        </Card>
      )}

      {/* Creative Grid */}
      {filteredCreatives.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredCreatives.map(creative => {
            const complianceInfo = COMPLIANCE_STYLES[creative.compliance_status] || COMPLIANCE_STYLES.unchecked;
            const statusInfo = STATUS_STYLES[creative.status] || STATUS_STYLES.draft;
            return (
              <Card
                key={creative.id}
                hover
                onClick={() => setSelectedCreative(creative)}
                className="cursor-pointer"
              >
                {/* Thumbnail */}
                <div className="h-36 rounded-lg bg-cream-warm mb-3 flex items-center justify-center overflow-hidden relative">
                  {creative.thumbnail_url || (creative.media_urls && creative.media_urls.length > 0) ? (
                    <img
                      src={creative.thumbnail_url || creative.media_urls[0]}
                      alt={creative.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <PhotoIcon className="w-10 h-10 text-stone/30" />
                  )}
                  {/* Overlay badges */}
                  <div className="absolute top-2 right-2 flex items-center gap-1">
                    {creative.ai_generated && (
                      <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-black/60 text-white text-[10px]">
                        <SparklesIcon className="w-3 h-3" />
                        AI
                      </span>
                    )}
                  </div>
                </div>

                {/* Info */}
                <h3 className="text-sm font-semibold text-charcoal truncate mb-1">
                  {creative.name}
                </h3>
                <p className="text-xs text-stone line-clamp-2 mb-2">
                  {creative.primary_text}
                </p>

                {/* Footer */}
                <div className="flex items-center justify-between pt-2 border-t border-stone/5">
                  <Badge variant={complianceInfo.variant} size="sm">
                    {complianceInfo.label}
                  </Badge>
                  <span className="text-xs text-stone capitalize">
                    {creative.format.replace(/_/g, ' ')}
                  </span>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <div className="py-16 text-center">
            <PhotoIcon className="w-16 h-16 text-stone/20 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-charcoal mb-2">
              No creatives found
            </h3>
            <p className="text-sm text-stone mb-6 max-w-md mx-auto">
              {creatives.length === 0
                ? 'Create your first ad creative by going to a campaign and generating creatives with AI.'
                : 'No creatives match your current filters. Try adjusting your search criteria.'
              }
            </p>
            <Link
              href="/marketing/campaigns"
              className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-semibold rounded-lg bg-teal text-cream hover:bg-teal-light transition-all duration-300"
            >
              Go to Campaigns
            </Link>
          </div>
        </Card>
      )}

      {/* Slide-Over Panel */}
      {selectedCreative && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setSelectedCreative(null)}
          />

          {/* Panel */}
          <div className="relative w-full max-w-lg bg-cream-warm shadow-2xl overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-cream-warm z-10 flex items-center justify-between p-5 border-b border-stone/10">
              <h2 className="text-lg font-semibold text-charcoal truncate">
                {selectedCreative.name}
              </h2>
              <button
                onClick={() => setSelectedCreative(null)}
                className="p-1.5 hover:bg-stone/10 rounded-lg transition-colors"
              >
                <XMarkIcon className="w-5 h-5 text-stone" />
              </button>
            </div>

            <div className="p-5 space-y-5">
              {/* Thumbnail */}
              <div className="h-48 rounded-xl bg-cream-warm flex items-center justify-center overflow-hidden">
                {selectedCreative.thumbnail_url || (selectedCreative.media_urls && selectedCreative.media_urls.length > 0) ? (
                  <img
                    src={selectedCreative.thumbnail_url || selectedCreative.media_urls[0]}
                    alt={selectedCreative.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <PhotoIcon className="w-16 h-16 text-stone/30" />
                )}
              </div>

              {/* Badges Row */}
              <div className="flex items-center flex-wrap gap-2">
                {selectedCreative.campaign_platform && (
                  <PlatformIcon platform={selectedCreative.campaign_platform as AdPlatform} size="sm" />
                )}
                <Badge variant={STATUS_STYLES[selectedCreative.status]?.variant || 'default'}>
                  {STATUS_STYLES[selectedCreative.status]?.label || selectedCreative.status}
                </Badge>
                <Badge variant={COMPLIANCE_STYLES[selectedCreative.compliance_status]?.variant || 'default'}>
                  Compliance: {COMPLIANCE_STYLES[selectedCreative.compliance_status]?.label || selectedCreative.compliance_status}
                </Badge>
                {selectedCreative.ai_generated && (
                  <span className="flex items-center gap-1 text-xs text-gold font-medium">
                    <SparklesIcon className="w-3.5 h-3.5" />
                    AI Generated
                    {selectedCreative.ai_model && ` (${selectedCreative.ai_model})`}
                  </span>
                )}
              </div>

              {/* Content */}
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-medium text-stone uppercase tracking-wider mb-1">Primary Text</p>
                  <p className="text-sm text-charcoal whitespace-pre-wrap">{selectedCreative.primary_text}</p>
                </div>

                {selectedCreative.headline && (
                  <div>
                    <p className="text-xs font-medium text-stone uppercase tracking-wider mb-1">Headline</p>
                    <p className="text-sm font-medium text-charcoal">{selectedCreative.headline}</p>
                  </div>
                )}

                {selectedCreative.description && (
                  <div>
                    <p className="text-xs font-medium text-stone uppercase tracking-wider mb-1">Description</p>
                    <p className="text-sm text-charcoal">{selectedCreative.description}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-cream-warm/50 rounded-lg">
                    <p className="text-xs text-stone mb-0.5">Format</p>
                    <p className="text-sm font-medium text-charcoal capitalize">
                      {selectedCreative.format.replace(/_/g, ' ')}
                    </p>
                  </div>
                  {selectedCreative.cta_type && (
                    <div className="p-3 bg-cream-warm/50 rounded-lg">
                      <p className="text-xs text-stone mb-0.5">CTA</p>
                      <p className="text-sm font-medium text-charcoal">
                        {selectedCreative.cta_type.replace(/_/g, ' ')}
                      </p>
                    </div>
                  )}
                  {selectedCreative.funnel_stage && (
                    <div className="p-3 bg-cream-warm/50 rounded-lg">
                      <p className="text-xs text-stone mb-0.5">Funnel Stage</p>
                      <p className="text-sm font-medium text-charcoal capitalize">
                        {selectedCreative.funnel_stage}
                      </p>
                    </div>
                  )}
                  {selectedCreative.campaign_name && (
                    <div className="p-3 bg-cream-warm/50 rounded-lg">
                      <p className="text-xs text-stone mb-0.5">Campaign</p>
                      <p className="text-sm font-medium text-charcoal">
                        {selectedCreative.campaign_name}
                      </p>
                    </div>
                  )}
                </div>

                {/* Target URL */}
                <div>
                  <p className="text-xs font-medium text-stone uppercase tracking-wider mb-1">Target URL</p>
                  <a
                    href={selectedCreative.target_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-teal hover:text-teal-light transition-colors flex items-center gap-1 break-all"
                  >
                    <LinkIcon className="w-3.5 h-3.5 flex-shrink-0" />
                    {selectedCreative.target_url}
                  </a>
                </div>

                {/* Rejection Reason */}
                {selectedCreative.rejection_reason && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-xs font-medium text-red-700 mb-1">Rejection Reason</p>
                    <p className="text-sm text-red-600">{selectedCreative.rejection_reason}</p>
                  </div>
                )}

                {/* Compliance Issues */}
                {selectedCreative.compliance_issues && Array.isArray(selectedCreative.compliance_issues) && (selectedCreative.compliance_issues as any[]).length > 0 && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-xs font-medium text-yellow-700 mb-1">Compliance Issues</p>
                    <ul className="text-sm text-yellow-600 space-y-1">
                      {(selectedCreative.compliance_issues as any[]).map((issue: any, i: number) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <ExclamationTriangleIcon className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                          <span>{typeof issue === 'string' ? issue : issue.message || JSON.stringify(issue)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-4 border-t border-stone/10">
                {selectedCreative.campaign_id && (
                  <Link
                    href={`/marketing/campaigns/${selectedCreative.campaign_id}`}
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-teal hover:text-teal-light transition-colors"
                  >
                    <EyeIcon className="w-4 h-4" />
                    View Campaign
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
