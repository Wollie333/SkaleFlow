'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CAMPAIGN_OBJECTIVES, OBJECTIVE_CATEGORIES, type CampaignObjectiveId, type ObjectiveCategory } from '@/config/campaign-objectives';

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
  campaign_adsets?: Array<{
    id: string;
    channel: string;
    total_posts: number;
    status: string;
  }>;
}

interface CampaignManagerProps {
  organizationId: string;
  onCreateCampaign: () => void;
  onSelectCampaign: (campaignId: string) => void;
}

const STATUS_BADGES: Record<string, { variant: 'default' | 'primary' | 'success' | 'warning' | 'danger'; label: string }> = {
  draft: { variant: 'default', label: 'Draft' },
  active: { variant: 'success', label: 'Active' },
  paused: { variant: 'warning', label: 'Paused' },
  completed: { variant: 'primary', label: 'Completed' },
  cancelled: { variant: 'danger', label: 'Cancelled' },
  archived: { variant: 'default', label: 'Archived' },
};

const CATEGORY_COLORS: Record<string, string> = {
  growth: 'text-green-500',
  revenue: 'text-gold',
  launch: 'text-blue-400',
  brand: 'text-purple-400',
  community: 'text-teal',
};

export function CampaignManager({ organizationId, onCreateCampaign, onSelectCampaign }: CampaignManagerProps) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    fetchCampaigns();
  }, [organizationId]);

  async function fetchCampaigns() {
    setLoading(true);
    try {
      const res = await fetch(`/api/content/campaigns?organizationId=${organizationId}`);
      if (res.ok) {
        const data = await res.json();
        setCampaigns(data.campaigns || []);
      } else {
        setCampaigns([]);
      }
    } catch (err) {
      console.error('Failed to fetch campaigns:', err);
      setCampaigns([]);
    } finally {
      setLoading(false);
    }
  }

  const filtered = statusFilter === 'all'
    ? campaigns
    : campaigns.filter(c => c.status === statusFilter);

  const activeCampaigns = campaigns.filter(c => c.status === 'active');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-heading-lg text-charcoal">Content Engine</h1>
          <p className="text-body-md text-stone mt-1">
            Campaign → Ad Set → Post. Like Meta Ads Manager, but for organic content.
          </p>
        </div>
        <Button onClick={onCreateCampaign} disabled={activeCampaigns.length >= 5}>
          + New Campaign
        </Button>
      </div>

      {/* Active campaigns count */}
      {activeCampaigns.length > 0 && (
        <div className="flex items-center gap-2 px-4 py-2 bg-teal/5 border border-teal/10 rounded-lg">
          <span className="text-sm text-teal font-medium">
            {activeCampaigns.length}/5 active campaigns
          </span>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {['all', 'active', 'draft', 'paused', 'completed'].map(status => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors capitalize ${
              statusFilter === status
                ? 'bg-teal text-cream'
                : 'bg-stone/5 text-stone hover:bg-stone/10'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Campaign cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-48 bg-stone/5 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <p className="text-stone text-body-md mb-4">
              {campaigns.length === 0
                ? 'No campaigns yet. Create your first campaign to get started.'
                : 'No campaigns match the current filter.'}
            </p>
            {campaigns.length === 0 && (
              <Button onClick={onCreateCampaign}>Create First Campaign</Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(campaign => (
            <CampaignCard
              key={campaign.id}
              campaign={campaign}
              onClick={() => onSelectCampaign(campaign.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function CampaignCard({ campaign, onClick }: { campaign: Campaign; onClick: () => void }) {
  const objectiveConfig = CAMPAIGN_OBJECTIVES[campaign.objective as CampaignObjectiveId];
  const statusBadge = STATUS_BADGES[campaign.status] || STATUS_BADGES.draft;
  const categoryColor = CATEGORY_COLORS[campaign.objective_category] || 'text-stone';
  const channels = campaign.campaign_adsets?.map(a => a.channel) || [];
  const totalPosts = campaign.campaign_adsets?.reduce((sum, a) => sum + a.total_posts, 0) || campaign.total_posts_target;

  const startDate = new Date(campaign.start_date).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' });
  const endDate = campaign.end_date
    ? new Date(campaign.end_date).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })
    : 'Ongoing';

  return (
    <Card hover onClick={onClick} className="relative">
      <CardContent>
        {/* Status badge */}
        <div className="flex items-center justify-between mb-3">
          <Badge variant={statusBadge.variant} size="sm">{statusBadge.label}</Badge>
          <span className={`text-xs font-medium uppercase ${categoryColor}`}>
            {campaign.objective_category}
          </span>
        </div>

        {/* Campaign name */}
        <h3 className="text-heading-sm text-charcoal mb-1 line-clamp-1">{campaign.name}</h3>

        {/* Objective */}
        <p className="text-sm text-stone mb-3">
          {objectiveConfig?.name || campaign.objective}
        </p>

        {/* Stats row */}
        <div className="flex items-center gap-4 text-xs text-stone mb-3">
          <span>{startDate} — {endDate}</span>
          <span>{totalPosts} posts</span>
        </div>

        {/* Channels */}
        {channels.length > 0 && (
          <div className="flex gap-1.5 flex-wrap">
            {channels.map(ch => (
              <span
                key={ch}
                className="px-2 py-0.5 bg-stone/5 text-stone text-xs rounded capitalize"
              >
                {ch}
              </span>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
