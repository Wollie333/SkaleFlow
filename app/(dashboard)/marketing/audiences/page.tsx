'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import { Card, Badge, Button, Input, PageHeader } from '@/components/ui';
import { PlatformIcon } from '@/components/marketing/shared/platform-icon';
import {
  UserGroupIcon,
  PlusIcon,
  ChevronRightIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  ArrowPathIcon,
  LinkIcon,
  UsersIcon,
  GlobeAltIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import type { AdPlatform } from '@/lib/marketing/types';
import type { Json } from '@/types/database';

interface Audience {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  platform: string;
  audience_type: string;
  targeting_spec: Json;
  source_pipeline_id: string | null;
  source_stage_ids: string[];
  source_tag_ids: string[];
  last_synced_at: string | null;
  platform_audience_id: string | null;
  approximate_size: number | null;
  created_at: string;
}

interface Pipeline {
  id: string;
  name: string;
}

interface PipelineStage {
  id: string;
  name: string;
  pipeline_id: string;
}

interface PipelineTag {
  id: string;
  name: string;
  color: string;
  pipeline_id: string;
}

const PLATFORM_OPTIONS = [
  { value: 'all', label: 'All Platforms' },
  { value: 'meta', label: 'Meta' },
  { value: 'tiktok', label: 'TikTok' },
];

const AUDIENCE_TYPE_OPTIONS = [
  { value: 'all', label: 'All Types' },
  { value: 'saved', label: 'Saved' },
  { value: 'custom', label: 'Custom' },
  { value: 'lookalike', label: 'Lookalike' },
];

const AUDIENCE_TYPE_STYLES: Record<string, { label: string; variant: 'primary' | 'success' | 'warning' | 'default' }> = {
  saved: { label: 'Saved', variant: 'default' },
  custom: { label: 'Custom', variant: 'primary' },
  lookalike: { label: 'Lookalike', variant: 'success' },
};

type TabKey = 'audiences' | 'pipeline_audiences';

export default function AudiencesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab') as TabKey | null;
  const supabase = createClient();
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [audiences, setAudiences] = useState<Audience[]>([]);
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [platformFilter, setPlatformFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [activeTab, setActiveTab] = useState<TabKey>(tabParam || 'audiences');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create audience modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newAudienceName, setNewAudienceName] = useState('');
  const [newAudienceDescription, setNewAudienceDescription] = useState('');
  const [newAudiencePlatform, setNewAudiencePlatform] = useState<AdPlatform>('meta');
  const [newAudienceType, setNewAudienceType] = useState('saved');
  const [isCreating, setIsCreating] = useState(false);

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

  // Sync activeTab with URL parameter
  useEffect(() => {
    if (tabParam && ['audiences', 'pipeline_audiences'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const handleTabChange = (tab: TabKey) => {
    setActiveTab(tab);
    const params = new URLSearchParams(searchParams.toString());
    if (tab === 'audiences') {
      params.delete('tab');
    } else {
      params.set('tab', tab);
    }
    const queryString = params.toString();
    router.push(queryString ? `/marketing/audiences?${queryString}` : '/marketing/audiences', { scroll: false });
  };

  const loadAudiences = useCallback(async () => {
    if (!organizationId) return;
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/marketing/audiences?organizationId=${organizationId}`);
      if (res.ok) {
        const data = await res.json();
        setAudiences(data);
      } else {
        // API might not exist yet, set empty
        setAudiences([]);
      }
    } catch {
      setAudiences([]);
    }

    // Load pipelines for pipeline audiences tab
    try {
      const pipeRes = await fetch(`/api/pipeline?organizationId=${organizationId}`);
      if (pipeRes.ok) {
        const pipeData = await pipeRes.json();
        setPipelines(Array.isArray(pipeData) ? pipeData : []);
      }
    } catch {
      setPipelines([]);
    }

    setIsLoading(false);
  }, [organizationId]);

  useEffect(() => {
    loadAudiences();
  }, [loadAudiences]);

  async function handleCreateAudience() {
    if (!organizationId || !newAudienceName.trim()) return;
    setIsCreating(true);
    setError(null);

    try {
      const res = await fetch('/api/marketing/audiences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId,
          name: newAudienceName.trim(),
          description: newAudienceDescription.trim() || null,
          platform: newAudiencePlatform,
          audienceType: newAudienceType,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create audience');
      }

      setShowCreateModal(false);
      setNewAudienceName('');
      setNewAudienceDescription('');
      setNewAudiencePlatform('meta');
      setNewAudienceType('saved');
      loadAudiences();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsCreating(false);
    }
  }

  // Filter audiences
  const filteredAudiences = audiences.filter(a => {
    if (platformFilter !== 'all' && a.platform !== platformFilter) return false;
    if (typeFilter !== 'all' && a.audience_type !== typeFilter) return false;
    return true;
  });

  const pipelineAudiences = audiences.filter(a => a.source_pipeline_id);

  if (isLoading && audiences.length === 0) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-stone/10 rounded animate-pulse" />
        <div className="h-12 bg-stone/10 rounded-xl animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-48 bg-stone/10 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb + Header */}
      <PageHeader
        title="Audiences"
        icon={UserGroupIcon}
        breadcrumbs={[
          { label: 'Marketing', href: '/marketing' },
          { label: 'Audiences' },
        ]}
        action={
          <Button onClick={() => setShowCreateModal(true)}>
            <PlusIcon className="w-4 h-4" />
            Create Audience
          </Button>
        }
      />

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-stone/10 overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
        <button
          onClick={() => handleTabChange('audiences')}
          className={cn(
            'flex items-center gap-2 px-4 pb-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex-shrink-0',
            activeTab === 'audiences'
              ? 'border-teal text-teal'
              : 'border-transparent text-stone hover:text-charcoal'
          )}
        >
          <UsersIcon className="w-4 h-4" />
          All Audiences
          {audiences.length > 0 && (
            <span className={cn(
              'text-xs px-1.5 py-0.5 rounded-full',
              activeTab === 'audiences' ? 'bg-teal/10 text-teal' : 'bg-stone/10 text-stone'
            )}>
              {audiences.length}
            </span>
          )}
        </button>
        <button
          onClick={() => handleTabChange('pipeline_audiences')}
          className={cn(
            'flex items-center gap-2 px-4 pb-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex-shrink-0',
            activeTab === 'pipeline_audiences'
              ? 'border-teal text-teal'
              : 'border-transparent text-stone hover:text-charcoal'
          )}
        >
          <LinkIcon className="w-4 h-4" />
          Pipeline Audiences
          {pipelineAudiences.length > 0 && (
            <span className={cn(
              'text-xs px-1.5 py-0.5 rounded-full',
              activeTab === 'pipeline_audiences' ? 'bg-teal/10 text-teal' : 'bg-stone/10 text-stone'
            )}>
              {pipelineAudiences.length}
            </span>
          )}
        </button>
      </div>

      {/* All Audiences Tab */}
      {activeTab === 'audiences' && (
        <>
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
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
              className="px-4 py-2 rounded-lg text-sm font-medium border border-stone/20 bg-white focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal"
            >
              {AUDIENCE_TYPE_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            {(platformFilter !== 'all' || typeFilter !== 'all') && (
              <button
                onClick={() => { setPlatformFilter('all'); setTypeFilter('all'); }}
                className="text-sm text-teal hover:text-teal-light font-medium transition-colors"
              >
                Clear filters
              </button>
            )}
          </div>

          {/* Error */}
          {error && (
            <Card className="border-red-200 bg-red-50">
              <p className="text-sm text-red-600">{error}</p>
            </Card>
          )}

          {/* Audience Grid */}
          {filteredAudiences.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAudiences.map(audience => {
                const typeInfo = AUDIENCE_TYPE_STYLES[audience.audience_type] || AUDIENCE_TYPE_STYLES.saved;
                return (
                  <Card key={audience.id} hover>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <PlatformIcon platform={audience.platform as AdPlatform} size="sm" />
                        <div className="min-w-0">
                          <h3 className="text-sm font-semibold text-charcoal truncate">
                            {audience.name}
                          </h3>
                          {audience.description && (
                            <p className="text-xs text-stone mt-0.5 line-clamp-1">
                              {audience.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <Badge variant={typeInfo.variant}>{typeInfo.label}</Badge>
                    </div>

                    <div className="space-y-2">
                      {audience.approximate_size != null && (
                        <div className="flex items-center gap-2">
                          <UsersIcon className="w-4 h-4 text-stone" />
                          <span className="text-sm text-charcoal">
                            {audience.approximate_size.toLocaleString()} people
                          </span>
                        </div>
                      )}
                      {audience.source_pipeline_id && (
                        <div className="flex items-center gap-2">
                          <LinkIcon className="w-4 h-4 text-stone" />
                          <span className="text-xs text-stone">Linked to pipeline</span>
                        </div>
                      )}
                      {audience.platform_audience_id && (
                        <div className="flex items-center gap-2">
                          <GlobeAltIcon className="w-4 h-4 text-stone" />
                          <span className="text-xs text-stone">Synced to platform</span>
                        </div>
                      )}
                    </div>

                    <div className="mt-3 pt-3 border-t border-stone/5 flex items-center justify-between">
                      <span className="text-xs text-stone">
                        Created {new Date(audience.created_at).toLocaleDateString('en-ZA', { month: 'short', day: 'numeric' })}
                      </span>
                      {audience.last_synced_at && (
                        <span className="text-xs text-stone flex items-center gap-1">
                          <ArrowPathIcon className="w-3 h-3" />
                          Synced {new Date(audience.last_synced_at).toLocaleDateString('en-ZA', { month: 'short', day: 'numeric' })}
                        </span>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card>
              <div className="py-16 text-center">
                <UserGroupIcon className="w-16 h-16 text-stone/20 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-charcoal mb-2">
                  No audiences yet
                </h3>
                <p className="text-sm text-stone mb-6 max-w-md mx-auto">
                  Create audiences to target specific groups of people with your ad campaigns. You can also sync audiences from your sales pipeline.
                </p>
                <Button onClick={() => setShowCreateModal(true)}>
                  <PlusIcon className="w-4 h-4" />
                  Create Your First Audience
                </Button>
              </div>
            </Card>
          )}
        </>
      )}

      {/* Pipeline Audiences Tab */}
      {activeTab === 'pipeline_audiences' && (
        <div className="space-y-4">
          <p className="text-sm text-stone">
            Connect your sales pipeline stages and tags to advertising audiences.
            Contacts matching your criteria will be synced to the ad platform for custom audience targeting.
          </p>

          {pipelines.length > 0 ? (
            <div className="space-y-4">
              {pipelines.map(pipeline => {
                const linkedAudiences = pipelineAudiences.filter(a => a.source_pipeline_id === pipeline.id);
                return (
                  <Card key={pipeline.id}>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold text-charcoal">{pipeline.name}</h3>
                      <Button size="sm" variant="ghost">
                        <PlusIcon className="w-4 h-4" />
                        Link Audience
                      </Button>
                    </div>

                    {linkedAudiences.length > 0 ? (
                      <div className="space-y-2">
                        {linkedAudiences.map(aud => (
                          <div key={aud.id} className="flex items-center justify-between p-3 bg-cream-warm/50 rounded-lg">
                            <div className="flex items-center gap-2">
                              <PlatformIcon platform={aud.platform as AdPlatform} size="sm" />
                              <div>
                                <p className="text-sm font-medium text-charcoal">{aud.name}</p>
                                <p className="text-xs text-stone">
                                  {aud.source_stage_ids.length > 0 && `${aud.source_stage_ids.length} stage(s)`}
                                  {aud.source_stage_ids.length > 0 && aud.source_tag_ids.length > 0 && ' | '}
                                  {aud.source_tag_ids.length > 0 && `${aud.source_tag_ids.length} tag(s)`}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {aud.approximate_size != null && (
                                <span className="text-xs text-stone">{aud.approximate_size.toLocaleString()} contacts</span>
                              )}
                              <Button variant="ghost" size="sm">
                                <ArrowPathIcon className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-stone py-4 text-center">
                        No audiences linked to this pipeline yet.
                      </p>
                    )}
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card>
              <div className="py-12 text-center">
                <LinkIcon className="w-12 h-12 text-stone/20 mx-auto mb-3" />
                <h3 className="text-sm font-medium text-charcoal mb-1">No pipelines found</h3>
                <p className="text-sm text-stone">
                  Create a sales pipeline first to connect pipeline audiences.
                </p>
                <Link
                  href="/pipeline"
                  className="inline-block mt-3 text-sm font-medium text-teal hover:text-teal-light transition-colors"
                >
                  Go to Pipeline
                </Link>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Create Audience Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full mx-4">
            <div className="flex items-center justify-between p-5 border-b border-stone/10">
              <h2 className="text-lg font-semibold text-charcoal">Create Audience</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 hover:bg-stone/10 rounded-lg transition-colors"
              >
                <XMarkIcon className="w-5 h-5 text-stone" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">Audience Name</label>
                <Input
                  value={newAudienceName}
                  onChange={e => setNewAudienceName(e.target.value)}
                  placeholder="e.g. High-Value Customers"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">Description (optional)</label>
                <textarea
                  value={newAudienceDescription}
                  onChange={e => setNewAudienceDescription(e.target.value)}
                  rows={2}
                  placeholder="Describe this audience..."
                  className="w-full px-4 py-3 rounded-xl border border-stone/20 bg-white focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal text-sm resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-2">Platform</label>
                  <select
                    value={newAudiencePlatform}
                    onChange={e => setNewAudiencePlatform(e.target.value as AdPlatform)}
                    className="w-full px-4 py-3 rounded-xl border border-stone/20 bg-white focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal text-sm"
                  >
                    <option value="meta">Meta</option>
                    <option value="tiktok">TikTok</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-2">Type</label>
                  <select
                    value={newAudienceType}
                    onChange={e => setNewAudienceType(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-stone/20 bg-white focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal text-sm"
                  >
                    <option value="saved">Saved</option>
                    <option value="custom">Custom</option>
                    <option value="lookalike">Lookalike</option>
                  </select>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 p-5 border-t border-stone/10">
              <Button
                variant="ghost"
                onClick={() => setShowCreateModal(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateAudience}
                disabled={isCreating || !newAudienceName.trim()}
                isLoading={isCreating}
              >
                Create Audience
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
