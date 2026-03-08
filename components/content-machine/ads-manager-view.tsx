'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { GenerationBatchTracker } from '@/components/content/generation-batch-tracker';
import { cn } from '@/lib/utils';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  ChevronUpDownIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ArrowPathIcon,
  PencilIcon,
  DocumentDuplicateIcon,
  TrashIcon,
  PauseIcon,
  PlayIcon,
  RocketLaunchIcon,
  XMarkIcon,
  Cog6ToothIcon,
  SparklesIcon,
  CalendarDaysIcon,
} from '@heroicons/react/24/outline';

// ─── Types ─────────────────────────────────────────────────────────────
type TabLevel = 'campaigns' | 'adsets' | 'posts';
type SortDir = 'asc' | 'desc' | null;

interface DrillContext {
  campaignId?: string;
  campaignName?: string;
  adsetId?: string;
  adsetName?: string;
}

interface Campaign {
  id: string;
  name: string;
  objective: string;
  objective_category: string;
  status: string;
  start_date: string;
  end_date: string | null;
  total_posts_target: number;
  created_at: string;
  updated_at: string;
  adset_count?: number;
  post_count?: number;
  published_count?: number;
  scheduled_count?: number;
}

interface AdSet {
  id: string;
  campaign_id: string;
  campaign_name?: string;
  channel: string;
  aggressiveness: string;
  posts_per_week: number;
  total_posts: number;
  status: string;
  created_at: string;
  updated_at: string;
  post_count?: number;
  published_count?: number;
}

interface Post {
  id: string;
  adset_id: string;
  campaign_id: string;
  content_type_name: string;
  platform: string;
  format: string;
  topic: string | null;
  hook: string | null;
  caption: string | null;
  status: string;
  scheduled_date: string | null;
  scheduled_time: string | null;
  assigned_to: string | null;
  ai_generated: boolean;
  created_at: string;
  updated_at: string;
}

interface AdsManagerViewProps {
  organizationId: string;
  onCreateCampaign: () => void;
  generatingBatchId?: string | null;
  onGenerationComplete?: () => void;
  onGenerationCancel?: () => void;
}

// ─── Constants ─────────────────────────────────────────────────────────
const STATUS_FILTERS: Record<TabLevel, string[]> = {
  campaigns: ['all', 'active', 'draft', 'paused', 'completed', 'cancelled'],
  adsets: ['all', 'active', 'paused'],
  posts: ['all', 'idea', 'scripted', 'pending_review', 'approved', 'scheduled', 'published', 'archived'],
};

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
  draft: 'bg-gold/15 text-gold border-gold/25',
  paused: 'bg-amber-500/15 text-amber-400 border-amber-500/25',
  completed: 'bg-blue-400/15 text-blue-400 border-blue-400/25',
  cancelled: 'bg-red-400/15 text-red-400 border-red-400/25',
  archived: 'bg-stone/15 text-stone border-stone/25',
  idea: 'bg-purple-400/15 text-purple-400 border-purple-400/25',
  scripted: 'bg-sky-400/15 text-sky-400 border-sky-400/25',
  pending_review: 'bg-amber-400/15 text-amber-400 border-amber-400/25',
  revision_requested: 'bg-orange-400/15 text-orange-400 border-orange-400/25',
  approved: 'bg-emerald-400/15 text-emerald-400 border-emerald-400/25',
  rejected: 'bg-red-400/15 text-red-400 border-red-400/25',
  scheduled: 'bg-blue-400/15 text-blue-400 border-blue-400/25',
  published: 'bg-teal/15 text-teal border-teal/25',
  failed: 'bg-red-400/15 text-red-400 border-red-400/25',
};

const CHANNEL_COLORS: Record<string, string> = {
  linkedin: 'bg-[#0A66C2]/20 text-[#5B9BD5]',
  facebook: 'bg-[#1877F2]/20 text-[#6BA3E8]',
  instagram: 'bg-[#E4405F]/20 text-[#E87A90]',
  tiktok: 'bg-charcoal/10 text-charcoal',
  youtube: 'bg-[#FF0000]/20 text-[#FF6666]',
  x: 'bg-charcoal/10 text-charcoal',
};

const CHANNEL_LABELS: Record<string, string> = {
  linkedin: 'LinkedIn',
  facebook: 'Facebook',
  instagram: 'Instagram',
  tiktok: 'TikTok',
  youtube: 'YouTube',
  x: 'X',
};

const CATEGORY_COLORS: Record<string, string> = {
  growth: 'text-emerald-400',
  revenue: 'text-gold',
  launch: 'text-blue-400',
  brand: 'text-purple-400',
  community: 'text-teal',
};

// ─── Component ─────────────────────────────────────────────────────────
export function AdsManagerView({ organizationId, onCreateCampaign, generatingBatchId, onGenerationComplete, onGenerationCancel }: AdsManagerViewProps) {
  const router = useRouter();

  // Navigation state
  const [activeTab, setActiveTab] = useState<TabLevel>('campaigns');
  const [drillContext, setDrillContext] = useState<DrillContext>({});

  // Data
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [adSets, setAdSets] = useState<AdSet[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  // Table controls
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Date range filter
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);

  // ─── Drill-down navigation ───────────────────────────────────────────
  function drillIntoCampaign(campaignId: string) {
    const campaign = campaigns.find(c => c.id === campaignId);
    setDrillContext({ campaignId, campaignName: campaign?.name || 'Campaign' });
    setActiveTab('adsets');
    resetTableControls();
  }

  function drillIntoAdSet(adsetId: string) {
    const adset = adSets.find(a => a.id === adsetId);
    setDrillContext(prev => ({
      ...prev,
      adsetId,
      adsetName: adset ? (CHANNEL_LABELS[adset.channel] || adset.channel) : 'Channel',
    }));
    setActiveTab('posts');
    resetTableControls();
  }

  function navigateTo(level: TabLevel) {
    if (level === 'campaigns') setDrillContext({});
    else if (level === 'adsets') setDrillContext(prev => ({ campaignId: prev.campaignId, campaignName: prev.campaignName }));
    setActiveTab(level);
    resetTableControls();
  }

  function resetTableControls() {
    setStatusFilter('all');
    setSelectedIds(new Set());
    setSearchQuery('');
    setSortColumn(null);
    setSortDir(null);
    // Keep date filter across tab switches (like Meta)
  }

  function switchTab(tab: TabLevel) {
    setDrillContext({});
    setActiveTab(tab);
    resetTableControls();
  }

  // ─── Data fetching ───────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const supabase = createClient();

      const { data: campaignData } = await supabase
        .from('campaigns')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });

      if (campaignData) {
        const enriched = await Promise.all(
          campaignData.map(async (c) => {
            const [adsets, allPosts, published, scheduled] = await Promise.all([
              supabase.from('campaign_adsets').select('*', { count: 'exact', head: true }).eq('campaign_id', c.id),
              supabase.from('content_posts').select('*', { count: 'exact', head: true }).eq('campaign_id', c.id),
              supabase.from('content_posts').select('*', { count: 'exact', head: true }).eq('campaign_id', c.id).eq('status', 'published'),
              supabase.from('content_posts').select('*', { count: 'exact', head: true }).eq('campaign_id', c.id).eq('status', 'scheduled'),
            ]);
            return { ...c, adset_count: adsets.count || 0, post_count: allPosts.count || 0, published_count: published.count || 0, scheduled_count: scheduled.count || 0 };
          })
        );
        setCampaigns(enriched);
      }

      const { data: adsetData } = await supabase
        .from('campaign_adsets')
        .select('*, campaigns!inner(name)')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });

      if (adsetData) {
        const enrichedAdsets = await Promise.all(
          adsetData.map(async (a: any) => {
            const [allPosts, published] = await Promise.all([
              supabase.from('content_posts').select('*', { count: 'exact', head: true }).eq('adset_id', a.id),
              supabase.from('content_posts').select('*', { count: 'exact', head: true }).eq('adset_id', a.id).eq('status', 'published'),
            ]);
            return { ...a, campaign_name: a.campaigns?.name || '', post_count: allPosts.count || 0, published_count: published.count || 0 };
          })
        );
        setAdSets(enrichedAdsets);
      }

      const { data: postData } = await supabase
        .from('content_posts')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })
        .limit(500);

      if (postData) setPosts(postData);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ─── Sorting ─────────────────────────────────────────────────────────
  function handleSort(column: string) {
    if (sortColumn === column) {
      if (sortDir === 'asc') setSortDir('desc');
      else if (sortDir === 'desc') { setSortColumn(null); setSortDir(null); }
      else setSortDir('asc');
    } else { setSortColumn(column); setSortDir('asc'); }
  }

  function SortIcon({ column }: { column: string }) {
    if (sortColumn !== column) return <ChevronUpDownIcon className="w-3.5 h-3.5 text-stone/40" />;
    if (sortDir === 'asc') return <ChevronUpIcon className="w-3.5 h-3.5 text-gold" />;
    return <ChevronDownIcon className="w-3.5 h-3.5 text-gold" />;
  }

  // ─── Selection ───────────────────────────────────────────────────────
  function toggleSelect(id: string) {
    setSelectedIds(prev => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  }
  function toggleSelectAll(ids: string[]) {
    if (ids.every(id => selectedIds.has(id))) setSelectedIds(new Set());
    else setSelectedIds(new Set(ids));
  }

  // ─── Filtered & sorted data ──────────────────────────────────────────
  function sortData<T>(data: T[]): T[] {
    if (!sortColumn || !sortDir) return data;
    return [...data].sort((a, b) => {
      const aVal = (a as any)[sortColumn]; const bVal = (b as any)[sortColumn];
      if (aVal == null) return 1; if (bVal == null) return -1;
      const cmp = typeof aVal === 'string' ? aVal.localeCompare(bVal) : aVal - bVal;
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }

  // Date filter helper: check if a date string falls within range
  function isInDateRange(dateStr: string | null): boolean {
    if (!dateFrom && !dateTo) return true;
    if (!dateStr) return !dateFrom && !dateTo; // no date = only show if no filter set
    const d = dateStr.slice(0, 10); // normalize to YYYY-MM-DD
    if (dateFrom && d < dateFrom) return false;
    if (dateTo && d > dateTo) return false;
    return true;
  }

  const visibleCampaigns = useMemo(() => {
    let data = campaigns;
    if (statusFilter !== 'all') data = data.filter(c => c.status === statusFilter);
    if (searchQuery) { const q = searchQuery.toLowerCase(); data = data.filter(c => c.name.toLowerCase().includes(q) || c.objective.toLowerCase().includes(q)); }
    if (dateFrom || dateTo) data = data.filter(c => isInDateRange(c.start_date));
    return sortData(data);
  }, [campaigns, statusFilter, searchQuery, dateFrom, dateTo, sortColumn, sortDir]);

  const visibleAdSets = useMemo(() => {
    let data = adSets;
    if (drillContext.campaignId) data = data.filter(a => a.campaign_id === drillContext.campaignId);
    if (statusFilter !== 'all') data = data.filter(a => a.status === statusFilter);
    if (searchQuery) { const q = searchQuery.toLowerCase(); data = data.filter(a => a.channel.toLowerCase().includes(q) || (a.campaign_name || '').toLowerCase().includes(q)); }
    return sortData(data);
  }, [adSets, drillContext.campaignId, statusFilter, searchQuery, sortColumn, sortDir]);

  const visiblePosts = useMemo(() => {
    let data = posts;
    if (drillContext.adsetId) data = data.filter(p => p.adset_id === drillContext.adsetId);
    else if (drillContext.campaignId) data = data.filter(p => p.campaign_id === drillContext.campaignId);
    if (statusFilter !== 'all') data = data.filter(p => p.status === statusFilter);
    if (searchQuery) { const q = searchQuery.toLowerCase(); data = data.filter(p => (p.topic || '').toLowerCase().includes(q) || (p.hook || '').toLowerCase().includes(q) || (p.caption || '').toLowerCase().includes(q) || p.platform.toLowerCase().includes(q)); }
    if (dateFrom || dateTo) data = data.filter(p => isInDateRange(p.scheduled_date));
    return sortData(data);
  }, [posts, drillContext.adsetId, drillContext.campaignId, statusFilter, searchQuery, dateFrom, dateTo, sortColumn, sortDir]);

  const currentDataForCounts = useMemo(() => {
    if (activeTab === 'campaigns') return campaigns;
    if (activeTab === 'adsets') return drillContext.campaignId ? adSets.filter(a => a.campaign_id === drillContext.campaignId) : adSets;
    if (drillContext.adsetId) return posts.filter(p => p.adset_id === drillContext.adsetId);
    if (drillContext.campaignId) return posts.filter(p => p.campaign_id === drillContext.campaignId);
    return posts;
  }, [activeTab, campaigns, adSets, posts, drillContext]);

  // ─── Actions ─────────────────────────────────────────────────────────
  async function handleToggleCampaignStatus(id: string, currentStatus: string) {
    const newStatus = currentStatus === 'active' ? 'paused' : 'active';
    const supabase = createClient();
    await supabase.from('campaigns').update({ status: newStatus, updated_at: new Date().toISOString() }).eq('id', id);
    fetchData();
  }

  async function handleToggleAdSetStatus(id: string, currentStatus: string) {
    const newStatus = currentStatus === 'active' ? 'paused' : 'active';
    const supabase = createClient();
    await supabase.from('campaign_adsets').update({ status: newStatus, updated_at: new Date().toISOString() }).eq('id', id);
    fetchData();
  }

  // ─── Helpers ─────────────────────────────────────────────────────────
  const activeCampaignCount = campaigns.filter(c => c.status === 'active').length;
  const hasCampaigns = campaigns.length > 0;

  function formatDate(d: string | null) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' });
  }
  function formatStatus(s: string) {
    return s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  // ─── Empty state ─────────────────────────────────────────────────────
  if (!loading && !hasCampaigns) {
    return (
      <div className="min-h-[600px] flex flex-col bg-cream-warm rounded-xl border border-stone/10 overflow-hidden">
        <div className="border-b border-stone/10 px-6 py-4">
          <h1 className="text-xl font-semibold text-charcoal">Content Engine</h1>
          <p className="text-sm text-stone mt-0.5">Campaign → Channel → Post</p>
        </div>
        <div className="border-b border-stone/10 px-6 py-2">
          <div className="flex border border-stone/10 rounded-lg overflow-hidden w-fit">
            {(['campaigns', 'adsets', 'posts'] as TabLevel[]).map(tab => (
              <div key={tab} className={cn('px-5 py-2 text-xs font-medium border-r last:border-r-0 border-stone/10', tab === 'campaigns' ? 'bg-teal/10 text-teal' : 'text-stone/30')}>
                {tab === 'campaigns' ? 'Campaigns' : tab === 'adsets' ? 'Channels' : 'Posts'}
              </div>
            ))}
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto px-6">
            <div className="w-20 h-20 rounded-2xl bg-teal/10 flex items-center justify-center mx-auto mb-6">
              <RocketLaunchIcon className="w-10 h-10 text-teal" />
            </div>
            <h2 className="text-xl font-semibold text-charcoal mb-2">No campaigns yet</h2>
            <p className="text-stone text-sm mb-8 leading-relaxed">
              Create your first campaign to start generating content.<br />
              Campaigns organize your content into channels and posts.
            </p>
            <Button onClick={onCreateCampaign} className="gap-2 px-6 py-2.5">
              <PlusIcon className="w-4 h-4" />
              Create Campaign
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Main layout ─────────────────────────────────────────────────────
  return (
    <div className="min-h-[600px] flex flex-col bg-cream-warm rounded-xl border border-stone/10 overflow-hidden shadow-sm">

      {/* Top bar */}
      <div className="border-b border-stone/10 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold text-charcoal">Content Engine</h1>
          {activeCampaignCount > 0 && (
            <span className="text-xs text-teal font-medium px-2 py-0.5 bg-teal/10 rounded-full">
              {activeCampaignCount}/5 active
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {lastUpdated && (
            <span className="text-xs text-stone">
              Updated {lastUpdated.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          <button onClick={fetchData} className="p-1.5 rounded-lg hover:bg-teal/10 text-stone transition-colors" title="Refresh">
            <ArrowPathIcon className={cn('w-4 h-4', loading && 'animate-spin')} />
          </button>
        </div>
      </div>

      {/* Generation progress tracker */}
      {generatingBatchId && (
        <div className="border-b border-stone/10 px-6 py-3">
          <GenerationBatchTracker
            batchId={generatingBatchId}
            onComplete={() => {
              fetchData();
              onGenerationComplete?.();
            }}
            onCancel={() => {
              fetchData();
              onGenerationCancel?.();
            }}
            onProgress={() => fetchData()}
          />
        </div>
      )}

      {/* Three-level tabs + Breadcrumb */}
      <div className="border-b border-stone/10 px-6 py-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex border border-stone/10 rounded-lg overflow-hidden">
            {(['campaigns', 'adsets', 'posts'] as TabLevel[]).map(tab => {
              const labels: Record<TabLevel, string> = { campaigns: 'Campaigns', adsets: 'Channels', posts: 'Posts' };
              const counts: Record<TabLevel, number> = {
                campaigns: campaigns.length,
                adsets: drillContext.campaignId ? adSets.filter(a => a.campaign_id === drillContext.campaignId).length : adSets.length,
                posts: drillContext.adsetId ? posts.filter(p => p.adset_id === drillContext.adsetId).length : drillContext.campaignId ? posts.filter(p => p.campaign_id === drillContext.campaignId).length : posts.length,
              };
              return (
                <button key={tab} onClick={() => switchTab(tab)} className={cn(
                  'px-4 py-1.5 text-xs font-medium flex items-center gap-1.5 transition-colors border-r last:border-r-0 border-stone/10',
                  activeTab === tab ? 'bg-teal/10 text-teal' : 'text-stone hover:bg-teal/5'
                )}>
                  {labels[tab]}
                  <span className={cn('text-[10px] px-1.5 py-0.5 rounded-full min-w-[18px] text-center', activeTab === tab ? 'bg-teal/15' : 'bg-stone/10')}>{counts[tab]}</span>
                </button>
              );
            })}
          </div>

          {/* Breadcrumb */}
          {(drillContext.campaignId || drillContext.adsetId) && (
            <div className="flex items-center gap-1 text-xs">
              <button onClick={() => navigateTo('campaigns')} className="text-stone hover:text-teal transition-colors">All Campaigns</button>
              {drillContext.campaignName && (
                <>
                  <ChevronRightIcon className="w-3 h-3 text-stone/40" />
                  <button onClick={() => navigateTo('adsets')} className={cn('transition-colors max-w-[160px] truncate', drillContext.adsetId ? 'text-stone hover:text-teal' : 'text-teal font-medium')}>
                    {drillContext.campaignName}
                  </button>
                </>
              )}
              {drillContext.adsetName && (
                <>
                  <ChevronRightIcon className="w-3 h-3 text-stone/40" />
                  <span className="text-teal font-medium max-w-[120px] truncate">{drillContext.adsetName}</span>
                </>
              )}
              <button onClick={() => navigateTo('campaigns')} className="ml-1 p-0.5 rounded hover:bg-stone/10 text-stone/40 hover:text-stone transition-colors" title="Clear filter">
                <XMarkIcon className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Filter pills */}
      <div className="border-b border-stone/10 px-6 py-2 flex items-center gap-2 overflow-x-auto">
        {STATUS_FILTERS[activeTab].map(status => {
          const isActive = statusFilter === status;
          const count = status === 'all' ? currentDataForCounts.length : currentDataForCounts.filter((d: any) => d.status === status).length;
          if (status !== 'all' && count === 0) return null;
          return (
            <button key={status} onClick={() => setStatusFilter(status)} className={cn(
              'px-3 py-1 text-xs font-medium rounded-full transition-colors whitespace-nowrap flex items-center gap-1.5',
              isActive ? 'bg-teal text-cream-warm' : 'bg-stone/10 text-stone hover:bg-stone/15'
            )}>
              {formatStatus(status)}
              <span className={cn('text-[10px] px-1.5 py-0.5 rounded-full min-w-[18px] text-center', isActive ? 'bg-cream-warm/20' : 'bg-stone/10')}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* Search + Action toolbar */}
      <div className="border-b border-stone/10 px-6 py-2 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button size="sm" onClick={onCreateCampaign} className="gap-1.5 text-xs">
            <PlusIcon className="w-3.5 h-3.5" />
            Create
          </Button>
          {selectedIds.size > 0 && (
            <>
              <div className="w-px h-5 bg-stone/10" />
              <Button size="sm" variant="outline" className="gap-1.5 text-xs !border-teal/30 !text-teal hover:!bg-teal/10"><PencilIcon className="w-3.5 h-3.5" />Edit</Button>
              <Button size="sm" variant="outline" className="gap-1.5 text-xs !border-teal/30 !text-teal hover:!bg-teal/10"><DocumentDuplicateIcon className="w-3.5 h-3.5" />Duplicate</Button>
              <Button size="sm" variant="outline" className="gap-1.5 text-xs !border-red-400/30 !text-red-400 hover:!bg-red-400/10"><TrashIcon className="w-3.5 h-3.5" />Delete</Button>
              <div className="w-px h-5 bg-stone/10" />
              <span className="text-xs text-stone font-medium">{selectedIds.size} selected</span>
            </>
          )}
        </div>
        <div className="relative w-72">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone/40" />
          <input
            type="text"
            placeholder="Search to filter..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-sm border border-stone/10 rounded-lg bg-cream/50 text-charcoal placeholder:text-stone/40 focus:outline-none focus:border-teal/30 focus:ring-1 focus:ring-teal/20"
          />
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-teal border-t-transparent rounded-full animate-spin" />
          </div>
        ) : activeTab === 'campaigns' ? (
          <CampaignsTable
            data={visibleCampaigns} selectedIds={selectedIds}
            onToggleSelect={toggleSelect} onToggleSelectAll={toggleSelectAll}
            onSort={handleSort} SortIcon={SortIcon}
            formatDate={formatDate} formatStatus={formatStatus}
            onRowClick={drillIntoCampaign}
            onToggleStatus={handleToggleCampaignStatus}
            onEdit={(id) => router.push(`/content/campaigns/${id}`)}
          />
        ) : activeTab === 'adsets' ? (
          <AdSetsTable
            data={visibleAdSets} selectedIds={selectedIds}
            onToggleSelect={toggleSelect} onToggleSelectAll={toggleSelectAll}
            onSort={handleSort} SortIcon={SortIcon}
            formatStatus={formatStatus}
            onRowClick={drillIntoAdSet}
            showCampaignColumn={!drillContext.campaignId}
            onToggleStatus={handleToggleAdSetStatus}
          />
        ) : (
          <PostsTable
            data={visiblePosts} selectedIds={selectedIds}
            onToggleSelect={toggleSelect} onToggleSelectAll={toggleSelectAll}
            onSort={handleSort} SortIcon={SortIcon}
            formatDate={formatDate} formatStatus={formatStatus}
            onRowClick={(id) => router.push(`/content/${id}`)}
          />
        )}
      </div>

      {/* Footer summary */}
      <div className="border-t border-stone/10 px-6 py-2 flex items-center justify-between text-xs text-stone">
        <span>
          {activeTab === 'campaigns' && `${visibleCampaigns.length} campaign${visibleCampaigns.length !== 1 ? 's' : ''}`}
          {activeTab === 'adsets' && `${visibleAdSets.length} channel${visibleAdSets.length !== 1 ? 's' : ''}`}
          {activeTab === 'posts' && `${visiblePosts.length} post${visiblePosts.length !== 1 ? 's' : ''}`}
        </span>
        <span>
          {drillContext.campaignName
            ? `Filtered: ${drillContext.campaignName}${drillContext.adsetName ? ` → ${drillContext.adsetName}` : ''}`
            : `Results from ${campaigns.length} campaign${campaigns.length !== 1 ? 's' : ''}`}
        </span>
      </div>
    </div>
  );
}

// ─── Hover Action Buttons ──────────────────────────────────────────────
function RowActions({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn(
      'absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10',
      className
    )}>
      <div className="flex items-center gap-0.5 bg-cream-warm border border-stone/10 rounded-lg shadow-sm px-1 py-0.5">
        {children}
      </div>
    </div>
  );
}

function ActionBtn({ icon: Icon, title, onClick, className }: { icon: React.FC<{ className?: string }>; title: string; onClick: (e: React.MouseEvent) => void; className?: string }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={cn('p-1.5 rounded-md hover:bg-teal/10 text-stone hover:text-teal transition-colors', className)}
    >
      <Icon className="w-3.5 h-3.5" />
    </button>
  );
}

// ─── Campaigns Table ───────────────────────────────────────────────────
function CampaignsTable({
  data, selectedIds, onToggleSelect, onToggleSelectAll, onSort, SortIcon, formatDate, formatStatus, onRowClick, onToggleStatus, onEdit,
}: {
  data: Campaign[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: (ids: string[]) => void;
  onSort: (col: string) => void;
  SortIcon: React.FC<{ column: string }>;
  formatDate: (d: string | null) => string;
  formatStatus: (s: string) => string;
  onRowClick: (id: string) => void;
  onToggleStatus: (id: string, status: string) => void;
  onEdit: (id: string) => void;
}) {
  const allIds = data.map(c => c.id);
  const allSelected = allIds.length > 0 && allIds.every(id => selectedIds.has(id));

  if (data.length === 0) return <EmptyTable message="No campaigns match your filters" />;

  return (
    <table className="w-full text-sm">
      <thead className="sticky top-0 z-10">
        <tr className="border-b border-stone/10 bg-cream/50">
          <th className="w-10 px-3 py-2.5">
            <input type="checkbox" checked={allSelected} onChange={() => onToggleSelectAll(allIds)} className="rounded border-stone/20 text-teal focus:ring-teal/20" />
          </th>
          <ThSort label="Campaign" column="name" onSort={onSort} SortIcon={SortIcon} />
          <ThSort label="Objective" column="objective_category" onSort={onSort} SortIcon={SortIcon} />
          <ThSort label="Status" column="status" onSort={onSort} SortIcon={SortIcon} />
          <ThSort label="Channels" column="adset_count" onSort={onSort} SortIcon={SortIcon} className="text-right" />
          <ThSort label="Posts" column="post_count" onSort={onSort} SortIcon={SortIcon} className="text-right" />
          <ThSort label="Published" column="published_count" onSort={onSort} SortIcon={SortIcon} className="text-right" />
          <ThSort label="Scheduled" column="scheduled_count" onSort={onSort} SortIcon={SortIcon} className="text-right" />
          <ThSort label="Start" column="start_date" onSort={onSort} SortIcon={SortIcon} />
          <ThSort label="Ends" column="end_date" onSort={onSort} SortIcon={SortIcon} />
        </tr>
      </thead>
      <tbody>
        {data.map(c => (
          <tr
            key={c.id}
            onClick={() => onRowClick(c.id)}
            className={cn(
              'border-b border-stone/5 hover:bg-teal/[0.04] cursor-pointer transition-colors group relative',
              selectedIds.has(c.id) && 'bg-teal/10'
            )}
          >
            <td className="px-3 py-2.5" onClick={e => e.stopPropagation()}>
              <input type="checkbox" checked={selectedIds.has(c.id)} onChange={() => onToggleSelect(c.id)} className="rounded border-stone/20 text-teal focus:ring-teal/20" />
            </td>
            <td className="px-3 py-2.5">
              <div className="flex items-center gap-1.5">
                <span className="font-medium text-teal group-hover:text-gold transition-colors">{c.name}</span>
                <ChevronRightIcon className="w-3 h-3 text-stone/0 group-hover:text-teal/60 transition-colors" />
              </div>
            </td>
            <td className="px-3 py-2.5">
              <span className={cn('text-xs font-medium uppercase', CATEGORY_COLORS[c.objective_category] || 'text-stone')}>{c.objective_category}</span>
            </td>
            <td className="px-3 py-2.5"><StatusPill status={c.status} label={formatStatus(c.status)} /></td>
            <td className="px-3 py-2.5 text-right text-charcoal tabular-nums">{c.adset_count}</td>
            <td className="px-3 py-2.5 text-right text-charcoal tabular-nums">{c.post_count}</td>
            <td className="px-3 py-2.5 text-right text-charcoal tabular-nums">{c.published_count}</td>
            <td className="px-3 py-2.5 text-right text-charcoal tabular-nums">{c.scheduled_count}</td>
            <td className="px-3 py-2.5 text-charcoal whitespace-nowrap">{formatDate(c.start_date)}</td>
            <td className="px-3 py-2.5 text-charcoal whitespace-nowrap">
              {c.end_date ? formatDate(c.end_date) : <span className="text-teal text-xs font-medium">Ongoing</span>}
            </td>

            {/* Hover actions */}
            <RowActions>
              <ActionBtn icon={PencilIcon} title="Edit campaign" onClick={(e) => { e.stopPropagation(); onEdit(c.id); }} />
              <ActionBtn
                icon={c.status === 'active' ? PauseIcon : PlayIcon}
                title={c.status === 'active' ? 'Pause campaign' : 'Activate campaign'}
                onClick={(e) => { e.stopPropagation(); onToggleStatus(c.id, c.status); }}
              />
              <ActionBtn icon={Cog6ToothIcon} title="Campaign settings" onClick={(e) => { e.stopPropagation(); onEdit(c.id); }} />
            </RowActions>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// ─── Channels Table ─────────────────────────────────────────────────────
function AdSetsTable({
  data, selectedIds, onToggleSelect, onToggleSelectAll, onSort, SortIcon, formatStatus, onRowClick, showCampaignColumn, onToggleStatus,
}: {
  data: AdSet[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: (ids: string[]) => void;
  onSort: (col: string) => void;
  SortIcon: React.FC<{ column: string }>;
  formatStatus: (s: string) => string;
  onRowClick: (id: string) => void;
  showCampaignColumn: boolean;
  onToggleStatus: (id: string, status: string) => void;
}) {
  const allIds = data.map(a => a.id);
  const allSelected = allIds.length > 0 && allIds.every(id => selectedIds.has(id));

  if (data.length === 0) return <EmptyTable message="No channels match your filters" />;

  return (
    <table className="w-full text-sm">
      <thead className="sticky top-0 z-10">
        <tr className="border-b border-stone/10 bg-cream/50">
          <th className="w-10 px-3 py-2.5">
            <input type="checkbox" checked={allSelected} onChange={() => onToggleSelectAll(allIds)} className="rounded border-stone/20 text-teal focus:ring-teal/20" />
          </th>
          <ThSort label="Channel" column="channel" onSort={onSort} SortIcon={SortIcon} />
          {showCampaignColumn && <ThSort label="Campaign" column="campaign_name" onSort={onSort} SortIcon={SortIcon} />}
          <ThSort label="Status" column="status" onSort={onSort} SortIcon={SortIcon} />
          <ThSort label="Aggressiveness" column="aggressiveness" onSort={onSort} SortIcon={SortIcon} />
          <ThSort label="Posts/Week" column="posts_per_week" onSort={onSort} SortIcon={SortIcon} className="text-right" />
          <ThSort label="Total Posts" column="total_posts" onSort={onSort} SortIcon={SortIcon} className="text-right" />
          <ThSort label="Published" column="published_count" onSort={onSort} SortIcon={SortIcon} className="text-right" />
          <ThSort label="Delivery" column="post_count" onSort={onSort} SortIcon={SortIcon} className="text-right" />
        </tr>
      </thead>
      <tbody>
        {data.map(a => {
          const deliveryPct = a.total_posts > 0 ? Math.round(((a.post_count || 0) / a.total_posts) * 100) : 0;
          return (
            <tr
              key={a.id}
              onClick={() => onRowClick(a.id)}
              className={cn(
                'border-b border-stone/5 hover:bg-teal/[0.04] cursor-pointer transition-colors group relative',
                selectedIds.has(a.id) && 'bg-teal/10'
              )}
            >
              <td className="px-3 py-2.5" onClick={e => e.stopPropagation()}>
                <input type="checkbox" checked={selectedIds.has(a.id)} onChange={() => onToggleSelect(a.id)} className="rounded border-stone/20 text-teal focus:ring-teal/20" />
              </td>
              <td className="px-3 py-2.5">
                <div className="flex items-center gap-1.5">
                  <span className={cn('px-2 py-0.5 text-xs font-medium rounded-full', CHANNEL_COLORS[a.channel] || 'bg-stone/10 text-charcoal')}>
                    {CHANNEL_LABELS[a.channel] || a.channel}
                  </span>
                  <ChevronRightIcon className="w-3 h-3 text-stone/0 group-hover:text-teal/60 transition-colors" />
                </div>
              </td>
              {showCampaignColumn && <td className="px-3 py-2.5 text-teal font-medium">{a.campaign_name}</td>}
              <td className="px-3 py-2.5"><StatusPill status={a.status} label={formatStatus(a.status)} /></td>
              <td className="px-3 py-2.5"><span className="text-xs capitalize text-charcoal">{a.aggressiveness}</span></td>
              <td className="px-3 py-2.5 text-right text-charcoal tabular-nums">{a.posts_per_week}</td>
              <td className="px-3 py-2.5 text-right text-charcoal tabular-nums">{a.total_posts}</td>
              <td className="px-3 py-2.5 text-right text-charcoal tabular-nums">{a.published_count}</td>
              <td className="px-3 py-2.5 text-right">
                <div className="flex items-center justify-end gap-2">
                  <div className="w-16 h-1.5 bg-stone/10 rounded-full overflow-hidden">
                    <div className="h-full bg-teal rounded-full transition-all" style={{ width: `${Math.min(deliveryPct, 100)}%` }} />
                  </div>
                  <span className="text-xs text-charcoal tabular-nums w-8 text-right">{deliveryPct}%</span>
                </div>
              </td>

              {/* Hover actions */}
              <RowActions>
                <ActionBtn
                  icon={a.status === 'active' ? PauseIcon : PlayIcon}
                  title={a.status === 'active' ? 'Pause channel' : 'Activate channel'}
                  onClick={(e) => { e.stopPropagation(); onToggleStatus(a.id, a.status); }}
                />
                <ActionBtn icon={Cog6ToothIcon} title="Channel settings" onClick={(e) => { e.stopPropagation(); }} />
              </RowActions>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

// ─── Posts Table ────────────────────────────────────────────────────────
function PostsTable({
  data, selectedIds, onToggleSelect, onToggleSelectAll, onSort, SortIcon, formatDate, formatStatus, onRowClick,
}: {
  data: Post[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: (ids: string[]) => void;
  onSort: (col: string) => void;
  SortIcon: React.FC<{ column: string }>;
  formatDate: (d: string | null) => string;
  formatStatus: (s: string) => string;
  onRowClick: (id: string) => void;
}) {
  const allIds = data.map(p => p.id);
  const allSelected = allIds.length > 0 && allIds.every(id => selectedIds.has(id));

  if (data.length === 0) return <EmptyTable message="No posts match your filters" />;

  return (
    <table className="w-full text-sm">
      <thead className="sticky top-0 z-10">
        <tr className="border-b border-stone/10 bg-cream/50">
          <th className="w-10 px-3 py-2.5">
            <input type="checkbox" checked={allSelected} onChange={() => onToggleSelectAll(allIds)} className="rounded border-stone/20 text-teal focus:ring-teal/20" />
          </th>
          <ThSort label="Post" column="topic" onSort={onSort} SortIcon={SortIcon} />
          <ThSort label="Platform" column="platform" onSort={onSort} SortIcon={SortIcon} />
          <ThSort label="Format" column="format" onSort={onSort} SortIcon={SortIcon} />
          <ThSort label="Type" column="content_type_name" onSort={onSort} SortIcon={SortIcon} />
          <ThSort label="Status" column="status" onSort={onSort} SortIcon={SortIcon} />
          <ThSort label="Scheduled" column="scheduled_date" onSort={onSort} SortIcon={SortIcon} />
          <ThSort label="AI" column="ai_generated" onSort={onSort} SortIcon={SortIcon} className="text-center" />
        </tr>
      </thead>
      <tbody>
        {data.map(p => (
          <tr
            key={p.id}
            onClick={() => onRowClick(p.id)}
            className={cn(
              'border-b border-stone/5 hover:bg-teal/[0.04] cursor-pointer transition-colors group relative',
              selectedIds.has(p.id) && 'bg-teal/10'
            )}
          >
            <td className="px-3 py-2.5" onClick={e => e.stopPropagation()}>
              <input type="checkbox" checked={selectedIds.has(p.id)} onChange={() => onToggleSelect(p.id)} className="rounded border-stone/20 text-teal focus:ring-teal/20" />
            </td>
            <td className="px-3 py-2.5 max-w-[280px]">
              <div className="truncate font-medium text-teal group-hover:text-gold transition-colors">
                {p.topic || p.hook || p.caption?.slice(0, 60) || 'Untitled post'}
              </div>
            </td>
            <td className="px-3 py-2.5">
              <span className={cn('px-2 py-0.5 text-xs font-medium rounded-full', CHANNEL_COLORS[p.platform] || 'bg-stone/10 text-charcoal')}>
                {CHANNEL_LABELS[p.platform] || p.platform}
              </span>
            </td>
            <td className="px-3 py-2.5"><span className="text-xs text-charcoal capitalize">{p.format.replace(/_/g, ' ')}</span></td>
            <td className="px-3 py-2.5"><span className="text-xs text-charcoal">{p.content_type_name}</span></td>
            <td className="px-3 py-2.5"><StatusPill status={p.status} label={formatStatus(p.status)} /></td>
            <td className="px-3 py-2.5 text-charcoal whitespace-nowrap">
              {p.scheduled_date ? (
                <span>{formatDate(p.scheduled_date)}{p.scheduled_time && <span className="text-stone ml-1">{p.scheduled_time}</span>}</span>
              ) : <span className="text-stone/40">—</span>}
            </td>
            <td className="px-3 py-2.5 text-center">
              {p.ai_generated
                ? <span className="inline-flex items-center gap-1 text-[10px] text-purple-400"><SparklesIcon className="w-3 h-3" />AI</span>
                : <span className="text-[10px] text-stone">Manual</span>
              }
            </td>

            {/* Hover actions */}
            <RowActions>
              <ActionBtn icon={PencilIcon} title="Edit post" onClick={(e) => { e.stopPropagation(); onRowClick(p.id); }} />
            </RowActions>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// ─── Shared sub-components ─────────────────────────────────────────────
function ThSort({ label, column, onSort, SortIcon, className }: {
  label: string; column: string; onSort: (col: string) => void;
  SortIcon: React.FC<{ column: string }>; className?: string;
}) {
  return (
    <th onClick={() => onSort(column)} className={cn(
      'px-3 py-2.5 text-xs font-medium text-stone uppercase tracking-wider cursor-pointer hover:text-charcoal select-none whitespace-nowrap bg-cream/50',
      className
    )}>
      <span className="inline-flex items-center gap-1">{label}<SortIcon column={column} /></span>
    </th>
  );
}

function StatusPill({ status, label }: { status: string; label: string }) {
  return (
    <span className={cn('inline-flex px-2 py-0.5 text-[11px] font-medium rounded-full border', STATUS_COLORS[status] || 'bg-stone/10 text-stone border-stone/20')}>
      {label}
    </span>
  );
}

function EmptyTable({ message }: { message: string }) {
  return <div className="flex items-center justify-center py-20 text-sm text-stone">{message}</div>;
}
