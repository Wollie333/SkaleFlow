'use client';

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CONTENT_TYPES, type ContentTypeId } from '@/config/content-types';
import { PLATFORM_DEFAULTS, type SocialChannel } from '@/config/platform-defaults';
import { AGGRESSIVENESS_TIERS, type Aggressiveness } from '@/config/platform-defaults';

// ---- Types ----

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
  aggressiveness: string;
  posts_per_week: number;
  total_posts: number;
  status: string;
}

interface CampaignTableViewProps {
  campaignId: string;
  campaignName: string;
  objective: string;
  adsets: AdSet[];
  posts: Post[];
  onPostClick: (postId: string) => void;
  onRefresh: () => void;
}

// ---- Status styles ----

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

// ---- Component ----

export function CampaignTableView({
  campaignId,
  campaignName,
  objective,
  adsets,
  posts,
  onPostClick,
  onRefresh,
}: CampaignTableViewProps) {
  const [expandedAdSets, setExpandedAdSets] = useState<Set<string>>(new Set(adsets.map(a => a.id)));
  const [sortBy, setSortBy] = useState<'date' | 'type' | 'status'>('date');

  function toggleAdSet(id: string) {
    setExpandedAdSets(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  // Group posts by adset
  const postsByAdSet: Record<string, Post[]> = {};
  for (const post of posts) {
    if (!postsByAdSet[post.adset_id]) postsByAdSet[post.adset_id] = [];
    postsByAdSet[post.adset_id].push(post);
  }

  // Sort posts
  function sortPosts(list: Post[]): Post[] {
    return [...list].sort((a, b) => {
      if (sortBy === 'date') {
        return (a.scheduled_date || '').localeCompare(b.scheduled_date || '');
      }
      if (sortBy === 'type') {
        return a.content_type - b.content_type;
      }
      return a.status.localeCompare(b.status);
    });
  }

  return (
    <div className="space-y-4">
      {/* Sort controls */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {(['date', 'type', 'status'] as const).map(s => (
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
        <Button variant="ghost" size="sm" onClick={onRefresh}>Refresh</Button>
      </div>

      {/* Campaign level header */}
      <div className="bg-dark-light rounded-xl overflow-hidden">
        {/* Campaign row */}
        <div className="px-4 py-3 border-b border-teal/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-teal" />
              <span className="font-semibold text-cream">{campaignName}</span>
              <Badge variant="primary" size="sm">{objective}</Badge>
            </div>
            <div className="flex items-center gap-6 text-xs text-cream/60">
              <span>{posts.length} posts</span>
              <span>{posts.filter(p => p.status === 'published').length} published</span>
              <span>{posts.filter(p => p.is_winner).length} winners</span>
            </div>
          </div>
        </div>

        {/* Ad Set rows */}
        {adsets.map(adset => {
          const adsetPosts = sortPosts(postsByAdSet[adset.id] || []);
          const isExpanded = expandedAdSets.has(adset.id);
          const platformConfig = PLATFORM_DEFAULTS[adset.channel as SocialChannel];
          const aggConfig = AGGRESSIVENESS_TIERS[adset.aggressiveness as Aggressiveness];

          // Status breakdown
          const statusCounts: Record<string, number> = {};
          for (const p of adsetPosts) {
            statusCounts[p.status] = (statusCounts[p.status] || 0) + 1;
          }

          return (
            <div key={adset.id}>
              {/* Ad Set header */}
              <div
                className="px-4 py-2.5 bg-dark/50 border-b border-teal/5 cursor-pointer hover:bg-dark/70 transition-colors"
                onClick={() => toggleAdSet(adset.id)}
              >
                <div className="flex items-center justify-between ml-6">
                  <div className="flex items-center gap-3">
                    <svg
                      className={`w-3 h-3 text-cream/40 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M6 4l8 6-8 6V4z" />
                    </svg>
                    <span className="font-medium text-cream/90">
                      {platformConfig?.label || adset.channel}
                    </span>
                    <span className="text-xs text-cream/40">
                      {aggConfig?.label || adset.aggressiveness} · {adsetPosts.length} posts
                    </span>
                    <Badge
                      variant={adset.status === 'active' ? 'success' : 'warning'}
                      size="sm"
                    >
                      {adset.status}
                    </Badge>
                  </div>
                  <div className="flex gap-3 text-xs text-cream/40">
                    {Object.entries(statusCounts).map(([status, count]) => (
                      <span key={status} className="capitalize">
                        {count} {status.replace('_', ' ')}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Posts table */}
              {isExpanded && adsetPosts.length > 0 && (
                <div className="bg-dark/30">
                  {/* Table header */}
                  <div className="grid grid-cols-12 gap-2 px-4 py-2 text-[10px] uppercase tracking-wider text-cream/30 border-b border-teal/5 ml-12">
                    <div className="col-span-1">Type</div>
                    <div className="col-span-1">Format</div>
                    <div className="col-span-3">Topic</div>
                    <div className="col-span-2">Hook</div>
                    <div className="col-span-1">Date</div>
                    <div className="col-span-1">Status</div>
                    <div className="col-span-1">Score</div>
                    <div className="col-span-2">Performance</div>
                  </div>

                  {/* Post rows */}
                  {adsetPosts.map(post => {
                    const statusStyle = STATUS_STYLES[post.status] || STATUS_STYLES.idea;
                    const perf = post.performance || {};

                    return (
                      <div
                        key={post.id}
                        className="grid grid-cols-12 gap-2 px-4 py-2 text-xs text-cream/70 border-b border-teal/3 ml-12 hover:bg-teal/5 cursor-pointer transition-colors"
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

                        {/* Format */}
                        <div className="col-span-1 capitalize truncate">{post.format}</div>

                        {/* Topic */}
                        <div className="col-span-3 truncate">
                          {post.topic || <span className="text-cream/30 italic">Pending generation</span>}
                        </div>

                        {/* Hook */}
                        <div className="col-span-2 truncate text-cream/50">
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
                            ? <span className={post.brand_voice_score >= 80 ? 'text-green-400' : 'text-amber-400'}>
                                {post.brand_voice_score}
                              </span>
                            : '—'}
                        </div>

                        {/* Performance */}
                        <div className="col-span-2 flex items-center gap-2 text-cream/40">
                          {post.status === 'published' && Object.keys(perf).length > 0 ? (
                            <>
                              {perf.engagement_rate !== undefined && (
                                <span>{(perf.engagement_rate * 100).toFixed(1)}% ER</span>
                              )}
                              {perf.impressions !== undefined && (
                                <span>{formatNumber(perf.impressions)} imp</span>
                              )}
                            </>
                          ) : (
                            '—'
                          )}
                          {post.is_winner && (
                            <span className="text-gold text-[10px] font-bold">WINNER</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function formatNumber(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return n.toString();
}
