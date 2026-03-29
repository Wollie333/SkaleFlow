'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PLATFORM_DEFAULTS, AGGRESSIVENESS_TIERS, type SocialChannel, type Aggressiveness } from '@/config/platform-defaults';
import { PlusIcon } from '@heroicons/react/24/outline';

interface AdSet {
  id: string;
  channel: string;
  aggressiveness: string;
  posts_per_week: number;
  total_posts: number;
  status: string;
}

interface Post {
  id: string;
  adset_id: string;
  status: string;
}

interface CampaignChannelsTabProps {
  campaignId: string;
  adsets: AdSet[];
  posts: Post[];
  onCreateChannel: () => void;
  onRefresh: () => void;
}

export function CampaignChannelsTab({
  campaignId,
  adsets,
  posts,
  onCreateChannel,
  onRefresh,
}: CampaignChannelsTabProps) {
  // Group posts by adset for counts
  const postsByAdset: Record<string, Post[]> = {};
  for (const post of posts) {
    if (!postsByAdset[post.adset_id]) postsByAdset[post.adset_id] = [];
    postsByAdset[post.adset_id].push(post);
  }

  return (
    <div className="space-y-4">
      {/* Header with create button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-heading-md text-charcoal">Channels</h3>
          <p className="text-sm text-stone mt-1">{adsets.length} active channels</p>
        </div>
        <Button onClick={onCreateChannel} size="sm">
          <PlusIcon className="w-4 h-4 mr-1" />
          Add Channel
        </Button>
      </div>

      {/* Channels grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {adsets.map(adset => {
          const platform = PLATFORM_DEFAULTS[adset.channel as SocialChannel];
          const aggConfig = AGGRESSIVENESS_TIERS[adset.aggressiveness as Aggressiveness];
          const adsetPosts = postsByAdset[adset.id] || [];
          const statusCounts: Record<string, number> = {};

          for (const p of adsetPosts) {
            statusCounts[p.status] = (statusCounts[p.status] || 0) + 1;
          }

          return (
            <div
              key={adset.id}
              className="bg-cream-warm border border-stone/10 rounded-xl p-4 hover:border-teal/30 transition-colors"
            >
              {/* Channel header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-lg bg-teal/10 flex items-center justify-center">
                    {platform?.icon && (
                      <span className="text-lg">{platform.icon}</span>
                    )}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-charcoal">
                      {platform?.label || adset.channel}
                    </h4>
                    <p className="text-xs text-stone">
                      {aggConfig?.label || adset.aggressiveness}
                    </p>
                  </div>
                </div>
                <Badge
                  variant={adset.status === 'active' ? 'success' : 'default'}
                  size="sm"
                >
                  {adset.status}
                </Badge>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="bg-white/50 rounded-lg p-2">
                  <div className="text-xs text-stone">Posts/Week</div>
                  <div className="text-lg font-bold text-charcoal">{adset.posts_per_week}</div>
                </div>
                <div className="bg-white/50 rounded-lg p-2">
                  <div className="text-xs text-stone">Total Posts</div>
                  <div className="text-lg font-bold text-charcoal">{adset.total_posts}</div>
                </div>
              </div>

              {/* Status breakdown */}
              {Object.keys(statusCounts).length > 0 && (
                <div className="pt-3 border-t border-stone/10">
                  <div className="text-xs text-stone mb-2">Post Status</div>
                  <div className="space-y-1">
                    {Object.entries(statusCounts).map(([status, count]) => (
                      <div key={status} className="flex items-center justify-between text-xs">
                        <span className="text-stone capitalize">{status.replace('_', ' ')}</span>
                        <span className="font-medium text-charcoal">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {adsets.length === 0 && (
        <div className="text-center py-12 bg-cream-warm border border-stone/10 rounded-xl">
          <p className="text-stone text-body-md mb-4">No channels yet. Add your first channel to start posting.</p>
          <Button onClick={onCreateChannel}>
            <PlusIcon className="w-4 h-4 mr-1" />
            Add Channel
          </Button>
        </div>
      )}
    </div>
  );
}
