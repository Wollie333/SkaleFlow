'use client';

import { cn, formatCurrency } from '@/lib/utils';
import { TrophyIcon } from '@heroicons/react/24/outline';

interface CreativeLeaderboardProps {
  creatives: any[];
}

function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toLocaleString();
}

const formatLabels: Record<string, string> = {
  single_image: 'Image',
  single_video: 'Video',
  carousel: 'Carousel',
  collection: 'Collection',
  in_feed: 'In-Feed',
  topview: 'TopView',
  spark_ad: 'Spark',
};

export function CreativeLeaderboard({ creatives }: CreativeLeaderboardProps) {
  // Sort by CTR descending, take top 10
  const sorted = [...creatives]
    .map((c) => ({
      ...c,
      ctr:
        c.ctr ??
        (c.impressions > 0
          ? ((c.clicks || 0) / c.impressions) * 100
          : 0),
    }))
    .sort((a, b) => b.ctr - a.ctr)
    .slice(0, 10);

  if (sorted.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-teal/8 p-6">
        <h3 className="text-sm font-semibold text-charcoal mb-4">Top Creatives</h3>
        <div className="flex items-center justify-center h-32 text-stone text-sm">
          No creative performance data available yet.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-teal/8 p-6">
      <div className="flex items-center gap-2 mb-4">
        <TrophyIcon className="w-5 h-5 text-gold" />
        <h3 className="text-sm font-semibold text-charcoal">Top Creatives</h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-stone/10">
              <th className="text-left text-[10px] font-semibold text-stone uppercase tracking-wider py-2 pr-3 w-8">
                #
              </th>
              <th className="text-left text-[10px] font-semibold text-stone uppercase tracking-wider py-2 pr-3">
                Creative
              </th>
              <th className="text-left text-[10px] font-semibold text-stone uppercase tracking-wider py-2 pr-3 w-16">
                Format
              </th>
              <th className="text-right text-[10px] font-semibold text-stone uppercase tracking-wider py-2 pr-3 w-16">
                CTR
              </th>
              <th className="text-right text-[10px] font-semibold text-stone uppercase tracking-wider py-2 pr-3 w-20">
                Clicks
              </th>
              <th className="text-right text-[10px] font-semibold text-stone uppercase tracking-wider py-2 pr-3 w-24">
                Impressions
              </th>
              <th className="text-right text-[10px] font-semibold text-stone uppercase tracking-wider py-2 w-20">
                Spend
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((creative, idx) => (
              <tr
                key={creative.id || idx}
                className={cn(
                  'border-b border-stone/5 transition-colors hover:bg-cream-warm/20',
                  idx === 0 && 'bg-gold/5'
                )}
              >
                <td className="py-2.5 pr-3">
                  <span
                    className={cn(
                      'inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold',
                      idx === 0
                        ? 'bg-gold text-dark'
                        : idx === 1
                        ? 'bg-stone/20 text-charcoal'
                        : idx === 2
                        ? 'bg-orange-200 text-orange-800'
                        : 'text-stone'
                    )}
                  >
                    {idx + 1}
                  </span>
                </td>
                <td className="py-2.5 pr-3">
                  <p className="text-xs font-medium text-charcoal truncate max-w-[180px]">
                    {creative.name || creative.headline || 'Unnamed Creative'}
                  </p>
                </td>
                <td className="py-2.5 pr-3">
                  <span className="text-[10px] text-stone font-medium">
                    {formatLabels[creative.ad_format] || creative.ad_format || '-'}
                  </span>
                </td>
                <td className="py-2.5 pr-3 text-right">
                  <span
                    className={cn(
                      'text-xs font-bold',
                      creative.ctr >= 3
                        ? 'text-green-600'
                        : creative.ctr >= 1
                        ? 'text-teal'
                        : 'text-charcoal'
                    )}
                  >
                    {creative.ctr.toFixed(2)}%
                  </span>
                </td>
                <td className="py-2.5 pr-3 text-right">
                  <span className="text-xs text-charcoal">
                    {formatNumber(creative.clicks || 0)}
                  </span>
                </td>
                <td className="py-2.5 pr-3 text-right">
                  <span className="text-xs text-stone">
                    {formatNumber(creative.impressions || 0)}
                  </span>
                </td>
                <td className="py-2.5 text-right">
                  <span className="text-xs text-charcoal">
                    {formatCurrency(creative.spend_cents || creative.spend || 0)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
