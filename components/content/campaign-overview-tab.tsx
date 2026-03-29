'use client';

import { Badge } from '@/components/ui/badge';
import { ContentTypeExplainer } from './content-type-explainer';
import { RatioAdjuster } from './ratio-adjuster';
import { PLATFORM_DEFAULTS, type SocialChannel } from '@/config/platform-defaults';
import type { ContentTypeRatio } from '@/config/campaign-objectives';

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
  status: string;
  is_winner: boolean;
}

interface CampaignOverviewTabProps {
  adsets: AdSet[];
  posts: Post[];
  objectiveConfig: any;
}

export function CampaignOverviewTab({ adsets, posts, objectiveConfig }: CampaignOverviewTabProps) {
  const publishedCount = posts.filter(p => p.status === 'published').length;
  const winnersCount = posts.filter(p => p.is_winner).length;
  const scriptedCount = posts.filter(p => p.status === 'scripted').length;
  const ideasCount = posts.filter(p => p.status === 'idea').length;

  return (
    <div className="space-y-6">
      {/* Stats grid */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-cream-warm border border-stone/10 rounded-xl p-4">
          <div className="text-xs text-stone mb-1">Total Posts</div>
          <div className="text-2xl font-bold text-charcoal">{posts.length}</div>
        </div>
        <div className="bg-cream-warm border border-stone/10 rounded-xl p-4">
          <div className="text-xs text-stone mb-1">Published</div>
          <div className="text-2xl font-bold text-teal">{publishedCount}</div>
        </div>
        <div className="bg-cream-warm border border-stone/10 rounded-xl p-4">
          <div className="text-xs text-stone mb-1">Scripted</div>
          <div className="text-2xl font-bold text-blue-500">{scriptedCount}</div>
        </div>
        <div className="bg-cream-warm border border-stone/10 rounded-xl p-4">
          <div className="text-xs text-stone mb-1">Winners</div>
          <div className="text-2xl font-bold text-gold">{winnersCount}</div>
        </div>
      </div>

      {/* Content type spectrum */}
      <div className="bg-cream-warm border border-stone/10 rounded-xl p-4">
        <h3 className="text-heading-sm text-charcoal mb-3">Content Type Distribution</h3>
        <ContentTypeExplainer />
      </div>

      {/* Per-channel ratios */}
      {adsets.map(adset => {
        const platform = PLATFORM_DEFAULTS[adset.channel as SocialChannel];
        return (
          <div key={adset.id} className="bg-cream-warm border border-stone/10 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-heading-sm text-charcoal">
                {platform?.label || adset.channel} — Content Type Ratios
              </h3>
              <Badge variant={adset.status === 'active' ? 'success' : 'default'} size="sm">
                {adset.status}
              </Badge>
            </div>
            <RatioAdjuster
              ratio={adset.content_type_ratios}
              onChange={() => {/* read-only in detail view */}}
              defaultRatio={objectiveConfig?.defaultRatio}
            />
            <div className="mt-3 text-xs text-stone">
              {adset.posts_per_week} posts/week · {adset.total_posts} total · {adset.aggressiveness}
            </div>
          </div>
        );
      })}
    </div>
  );
}
