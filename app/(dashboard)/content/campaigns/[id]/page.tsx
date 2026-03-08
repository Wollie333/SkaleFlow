'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CampaignTableView } from '@/components/content/campaign-table-view';
import { AdjustmentBanner } from '@/components/content/adjustment-banner';
import { ContentTypeExplainer } from '@/components/content/content-type-explainer';
import { RatioAdjuster } from '@/components/content/ratio-adjuster';
import { CAMPAIGN_OBJECTIVES, type CampaignObjectiveId, type ContentTypeRatio } from '@/config/campaign-objectives';
import { PLATFORM_DEFAULTS, AGGRESSIVENESS_TIERS, type SocialChannel, type Aggressiveness } from '@/config/platform-defaults';

// ---- Types ----

interface Campaign {
  id: string;
  name: string;
  objective: string;
  objective_category: string;
  status: string;
  start_date: string;
  end_date: string | null;
  total_posts_target: number;
}

interface AdSet {
  id: string;
  channel: string;
  aggressiveness: string;
  content_type_ratios: ContentTypeRatio;
  posts_per_week: number;
  total_posts: number;
  status: string;
}

interface Post {
  id: string;
  adset_id: string;
  campaign_id: string;
  content_type: number;
  content_type_name: string;
  platform: string;
  format: string;
  topic: string | null;
  hook: string | null;
  status: string;
  scheduled_date: string | null;
  scheduled_time: string | null;
  is_winner: boolean;
  brand_voice_score: number | null;
  performance: Record<string, number>;
}

interface Adjustment {
  id: string;
  campaign_id: string;
  trigger_type: string;
  severity: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  recommendation: string;
  data: Record<string, unknown>;
  status: 'pending' | 'approved' | 'dismissed';
  created_at: string;
}

type ViewMode = 'table' | 'insights';

// ---- Status badge config ----

const STATUS_BADGES: Record<string, { variant: 'default' | 'primary' | 'success' | 'warning' | 'danger'; label: string }> = {
  draft: { variant: 'default', label: 'Draft' },
  active: { variant: 'success', label: 'Active' },
  paused: { variant: 'warning', label: 'Paused' },
  completed: { variant: 'primary', label: 'Completed' },
  cancelled: { variant: 'danger', label: 'Cancelled' },
};

// ---- Page ----

export default function CampaignDetailPage() {
  const router = useRouter();
  const params = useParams();
  const campaignId = params.id as string;

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [adsets, setAdsets] = useState<AdSet[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [adjustments, setAdjustments] = useState<Adjustment[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('table');

  const fetchData = useCallback(async () => {
    try {
      const [campRes, postsRes] = await Promise.all([
        fetch(`/api/content/campaigns/${campaignId}`),
        fetch(`/api/content/campaigns/${campaignId}/posts`),
      ]);

      if (campRes.ok) {
        const campData = await campRes.json();
        setCampaign(campData.campaign);
        setAdsets(campData.adsets || []);
      }
      if (postsRes.ok) {
        const postsData = await postsRes.json();
        setPosts(postsData.posts || []);
      }

      // Try adjustments (may not exist yet)
      try {
        const adjRes = await fetch(`/api/content/campaigns/${campaignId}/adjustments`);
        if (adjRes.ok) {
          const adjData = await adjRes.json();
          setAdjustments(adjData.adjustments || []);
        }
      } catch { /* API not built yet */ }
    } catch (err) {
      console.error('Failed to fetch campaign data:', err);
    } finally {
      setLoading(false);
    }
  }, [campaignId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleGenerate() {
    setGenerating(true);
    try {
      const res = await fetch(`/api/content/campaigns/${campaignId}/generate`, { method: 'POST' });
      if (res.ok) {
        // Refresh data after generation starts
        await fetchData();
      }
    } catch (err) {
      console.error('Failed to start generation:', err);
    } finally {
      setGenerating(false);
    }
  }

  async function handleStatusChange(status: string) {
    try {
      await fetch(`/api/content/campaigns/${campaignId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      await fetchData();
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  }

  async function handleAdjustmentAction(adjId: string, action: 'approved' | 'dismissed') {
    try {
      await fetch(`/api/content/campaigns/${campaignId}/adjustments/${adjId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: action }),
      });
      setAdjustments(prev => prev.map(a => a.id === adjId ? { ...a, status: action } : a));
    } catch (err) {
      console.error('Failed to update adjustment:', err);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-2 border-teal border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="text-center py-12">
        <p className="text-stone text-body-md mb-4">Campaign not found.</p>
        <Button onClick={() => router.push('/content/campaigns')}>Back to Campaigns</Button>
      </div>
    );
  }

  const objectiveConfig = CAMPAIGN_OBJECTIVES[campaign.objective as CampaignObjectiveId];
  const statusBadge = STATUS_BADGES[campaign.status] || STATUS_BADGES.draft;
  const hasUngeneratedPosts = posts.some(p => p.status === 'idea' && !p.topic);
  const publishedCount = posts.filter(p => p.status === 'published').length;
  const winnersCount = posts.filter(p => p.is_winner).length;

  return (
    <div className="space-y-6">
      {/* Back button + header */}
      <div>
        <button
          onClick={() => router.push('/content/campaigns')}
          className="text-xs text-stone hover:text-teal transition-colors mb-2 flex items-center gap-1"
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Campaigns
        </button>

        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-heading-lg text-charcoal">{campaign.name}</h1>
              <Badge variant={statusBadge.variant} size="sm">{statusBadge.label}</Badge>
            </div>
            <p className="text-body-md text-stone mt-1">
              {objectiveConfig?.name || campaign.objective} · {posts.length} posts · {publishedCount} published · {winnersCount} winners
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* View mode toggle */}
            <div className="flex bg-stone/5 rounded-lg p-0.5">
              {(['table', 'insights'] as const).map(mode => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`px-3 py-1.5 text-xs rounded-md capitalize transition-colors ${
                    viewMode === mode ? 'bg-white text-charcoal shadow-sm' : 'text-stone hover:text-charcoal'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>

            {/* Actions */}
            {campaign.status === 'draft' && (
              <Button onClick={() => handleStatusChange('active')} size="sm">
                Activate
              </Button>
            )}
            {campaign.status === 'active' && (
              <Button onClick={() => handleStatusChange('paused')} variant="ghost" size="sm">
                Pause
              </Button>
            )}
            {campaign.status === 'paused' && (
              <Button onClick={() => handleStatusChange('active')} size="sm">
                Resume
              </Button>
            )}
            {hasUngeneratedPosts && (
              <Button onClick={handleGenerate} disabled={generating}>
                {generating ? 'Generating...' : 'Generate Content'}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Adjustment banners */}
      <AdjustmentBanner
        adjustments={adjustments}
        onApprove={(id) => handleAdjustmentAction(id, 'approved')}
        onDismiss={(id) => handleAdjustmentAction(id, 'dismissed')}
      />

      {/* Main content */}
      {viewMode === 'table' ? (
        <CampaignTableView
          campaignId={campaign.id}
          campaignName={campaign.name}
          objective={objectiveConfig?.name || campaign.objective}
          adsets={adsets}
          posts={posts}
          onPostClick={(postId) => router.push(`/content/campaigns/${campaignId}/posts/${postId}`)}
          onRefresh={fetchData}
        />
      ) : (
        <div className="space-y-6">
          {/* Content type spectrum */}
          <div className="bg-white border border-stone/10 rounded-xl p-4">
            <h3 className="text-heading-sm text-charcoal mb-3">Content Type Distribution</h3>
            <ContentTypeExplainer />
          </div>

          {/* Per-adset ratio breakdown */}
          {adsets.map(adset => {
            const platform = PLATFORM_DEFAULTS[adset.channel as SocialChannel];
            return (
              <div key={adset.id} className="bg-white border border-stone/10 rounded-xl p-4">
                <h3 className="text-heading-sm text-charcoal mb-3">
                  {platform?.label || adset.channel} — Content Type Ratios
                </h3>
                <RatioAdjuster
                  ratio={adset.content_type_ratios}
                  onChange={() => {/* read-only in detail view */}}
                  defaultRatio={objectiveConfig?.defaultRatio}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
