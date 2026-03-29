'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PlusIcon } from '@heroicons/react/24/outline';
import { PLATFORM_DEFAULTS, type SocialChannel } from '@/config/platform-defaults';

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

interface AdSet {
  id: string;
  channel: string;
}

interface CampaignPostsTabProps {
  campaignId: string;
  posts: Post[];
  adsets: AdSet[];
  onPostClick: (postId: string) => void;
  onCreatePost: () => void;
  onRefresh: () => void;
}

const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  idea: { bg: 'bg-stone/10', text: 'text-stone' },
  scripted: { bg: 'bg-blue-500/10', text: 'text-blue-500' },
  pending_review: { bg: 'bg-amber-500/10', text: 'text-amber-500' },
  revision_requested: { bg: 'bg-orange-500/10', text: 'text-orange-500' },
  approved: { bg: 'bg-green-500/10', text: 'text-green-500' },
  rejected: { bg: 'bg-red-500/10', text: 'text-red-500' },
  scheduled: { bg: 'bg-teal/10', text: 'text-teal' },
  published: { bg: 'bg-teal/20', text: 'text-teal' },
  failed: { bg: 'bg-red-500/10', text: 'text-red-500' },
};

const TYPE_COLORS = ['', '#EF4444', '#F97316', '#F59E0B', '#EAB308', '#22C55E', '#14B8A6', '#3B82F6'];

export function CampaignPostsTab({
  campaignId,
  posts,
  adsets,
  onPostClick,
  onCreatePost,
  onRefresh,
}: CampaignPostsTabProps) {
  const [sortBy, setSortBy] = useState<'date' | 'type' | 'status' | 'channel'>('date');
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [filterChannel, setFilterChannel] = useState<string | null>(null);

  // Create adset lookup
  const adsetById: Record<string, AdSet> = {};
  for (const adset of adsets) {
    adsetById[adset.id] = adset;
  }

  // Apply filters
  let filteredPosts = posts;
  if (filterStatus) {
    filteredPosts = filteredPosts.filter(p => p.status === filterStatus);
  }
  if (filterChannel) {
    filteredPosts = filteredPosts.filter(p => {
      const adset = adsetById[p.adset_id];
      return adset?.channel === filterChannel;
    });
  }

  // Sort posts
  const sortedPosts = [...filteredPosts].sort((a, b) => {
    if (sortBy === 'date') {
      return (a.scheduled_date || '').localeCompare(b.scheduled_date || '');
    }
    if (sortBy === 'type') {
      return a.content_type - b.content_type;
    }
    if (sortBy === 'status') {
      return a.status.localeCompare(b.status);
    }
    if (sortBy === 'channel') {
      const adsetA = adsetById[a.adset_id];
      const adsetB = adsetById[b.adset_id];
      return (adsetA?.channel || '').localeCompare(adsetB?.channel || '');
    }
    return 0;
  });

  // Get unique statuses and channels for filters
  const statuses = Array.from(new Set(posts.map(p => p.status)));
  const channels = Array.from(new Set(posts.map(p => {
    const adset = adsetById[p.adset_id];
    return adset?.channel;
  }).filter(Boolean)));

  return (
    <div className="space-y-4">
      {/* Header with create button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-heading-md text-charcoal">Posts</h3>
          <p className="text-sm text-stone mt-1">
            {filteredPosts.length} {filterStatus || filterChannel ? 'filtered' : 'total'} posts
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onRefresh}>Refresh</Button>
          <Button onClick={onCreatePost} size="sm">
            <PlusIcon className="w-4 h-4 mr-1" />
            New Post
          </Button>
        </div>
      </div>

      {/* Filters and sort controls */}
      <div className="flex items-center gap-4">
        <div className="flex gap-2">
          {(['date', 'type', 'status', 'channel'] as const).map(s => (
            <button
              key={s}
              onClick={() => setSortBy(s)}
              className={`px-3 py-1 text-xs rounded capitalize ${
                sortBy === s ? 'bg-teal text-cream' : 'bg-stone/5 text-stone hover:bg-stone/10'
              }`}
            >
              Sort by {s}
            </button>
          ))}
        </div>

        {/* Status filter */}
        <select
          value={filterStatus || ''}
          onChange={(e) => setFilterStatus(e.target.value || null)}
          className="text-xs px-3 py-1.5 rounded bg-stone/5 border border-stone/10 text-stone"
        >
          <option value="">All statuses</option>
          {statuses.map(status => (
            <option key={status} value={status}>{status.replace('_', ' ')}</option>
          ))}
        </select>

        {/* Channel filter */}
        <select
          value={filterChannel || ''}
          onChange={(e) => setFilterChannel(e.target.value || null)}
          className="text-xs px-3 py-1.5 rounded bg-stone/5 border border-stone/10 text-stone"
        >
          <option value="">All channels</option>
          {channels.map(channel => (
            <option key={channel} value={channel}>{channel}</option>
          ))}
        </select>
      </div>

      {/* Posts table */}
      <div className="bg-cream-warm border border-stone/10 rounded-xl overflow-hidden">
        {/* Table header */}
        <div className="grid grid-cols-12 gap-2 px-4 py-3 text-xs font-medium text-stone border-b border-stone/10 bg-stone/5">
          <div className="col-span-1">Type</div>
          <div className="col-span-1">Channel</div>
          <div className="col-span-1">Format</div>
          <div className="col-span-3">Topic</div>
          <div className="col-span-2">Hook</div>
          <div className="col-span-1">Date</div>
          <div className="col-span-1">Status</div>
          <div className="col-span-1">Score</div>
          <div className="col-span-1">Actions</div>
        </div>

        {/* Table rows */}
        {sortedPosts.length > 0 ? (
          <div className="divide-y divide-stone/10">
            {sortedPosts.map(post => {
              const statusStyle = STATUS_STYLES[post.status] || STATUS_STYLES.idea;
              const adset = adsetById[post.adset_id];
              const platform = PLATFORM_DEFAULTS[adset?.channel as SocialChannel];

              return (
                <div
                  key={post.id}
                  className="grid grid-cols-12 gap-2 px-4 py-3 text-xs text-charcoal hover:bg-teal/5 cursor-pointer transition-colors"
                  onClick={() => onPostClick(post.id)}
                >
                  {/* Type */}
                  <div className="col-span-1 flex items-center gap-1">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: TYPE_COLORS[post.content_type] || '#888' }}
                    />
                    <span>T{post.content_type}</span>
                  </div>

                  {/* Channel */}
                  <div className="col-span-1 capitalize truncate">
                    {platform?.label || adset?.channel || '—'}
                  </div>

                  {/* Format */}
                  <div className="col-span-1 capitalize truncate">{post.format}</div>

                  {/* Topic */}
                  <div className="col-span-3 truncate">
                    {post.topic || <span className="text-stone/60 italic">Pending generation</span>}
                  </div>

                  {/* Hook */}
                  <div className="col-span-2 truncate text-stone">
                    {post.hook || '—'}
                  </div>

                  {/* Date */}
                  <div className="col-span-1">
                    {post.scheduled_date
                      ? new Date(post.scheduled_date).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })
                      : '—'}
                  </div>

                  {/* Status */}
                  <div className="col-span-1">
                    <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium ${statusStyle.bg} ${statusStyle.text}`}>
                      {post.status.replace('_', ' ')}
                    </span>
                  </div>

                  {/* Voice Score */}
                  <div className="col-span-1">
                    {post.brand_voice_score
                      ? <span className={post.brand_voice_score >= 80 ? 'text-green-500' : 'text-amber-500'}>
                          {post.brand_voice_score}
                        </span>
                      : '—'}
                  </div>

                  {/* Actions */}
                  <div className="col-span-1">
                    {post.is_winner && (
                      <Badge variant="warning" size="sm">WIN</Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-stone text-body-md mb-4">No posts yet. Create your first post to get started.</p>
            <Button onClick={onCreatePost} size="sm">
              <PlusIcon className="w-4 h-4 mr-1" />
              New Post
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
