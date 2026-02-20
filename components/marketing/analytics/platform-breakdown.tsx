'use client';

import { cn, formatCurrency } from '@/lib/utils';
import { PlatformIcon } from '@/components/marketing/shared/platform-icon';

interface PlatformMetrics {
  spend: number;
  impressions: number;
  clicks: number;
  ctr: number;
  conversions: number;
}

interface PlatformBreakdownProps {
  metaMetrics: PlatformMetrics;
  tiktokMetrics: PlatformMetrics;
}

function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toLocaleString();
}

interface MetricRowProps {
  label: string;
  metaValue: string;
  tiktokValue: string;
}

function MetricRow({ label, metaValue, tiktokValue }: MetricRowProps) {
  return (
    <div className="grid grid-cols-3 py-2.5 border-b border-stone/5 last:border-0">
      <span className="text-xs font-medium text-stone">{label}</span>
      <span className="text-xs font-semibold text-charcoal text-center">{metaValue}</span>
      <span className="text-xs font-semibold text-charcoal text-center">{tiktokValue}</span>
    </div>
  );
}

export function PlatformBreakdown({ metaMetrics, tiktokMetrics }: PlatformBreakdownProps) {
  const totalSpend = metaMetrics.spend + tiktokMetrics.spend;
  const metaSpendPct = totalSpend > 0 ? (metaMetrics.spend / totalSpend) * 100 : 50;
  const tiktokSpendPct = totalSpend > 0 ? (tiktokMetrics.spend / totalSpend) * 100 : 50;

  return (
    <div className="bg-cream-warm rounded-xl border border-teal/8 p-6">
      <h3 className="text-sm font-semibold text-charcoal mb-4">Platform Breakdown</h3>

      {/* Platform Headers */}
      <div className="grid grid-cols-3 mb-3">
        <div />
        <div className="flex flex-col items-center gap-1.5">
          <PlatformIcon platform="meta" size="md" />
          <span className="text-xs font-semibold text-charcoal">Meta</span>
        </div>
        <div className="flex flex-col items-center gap-1.5">
          <PlatformIcon platform="tiktok" size="md" />
          <span className="text-xs font-semibold text-charcoal">TikTok</span>
        </div>
      </div>

      {/* Spend Bar */}
      <div className="mb-4">
        <div className="flex rounded-full h-3 overflow-hidden">
          <div
            className="bg-blue-500 transition-all duration-500"
            style={{ width: `${metaSpendPct}%` }}
          />
          <div
            className="bg-charcoal transition-all duration-500"
            style={{ width: `${tiktokSpendPct}%` }}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[10px] text-blue-600 font-medium">
            {metaSpendPct.toFixed(0)}%
          </span>
          <span className="text-[10px] text-charcoal font-medium">
            {tiktokSpendPct.toFixed(0)}%
          </span>
        </div>
      </div>

      {/* Metrics Table */}
      <div>
        <MetricRow
          label="Spend"
          metaValue={formatCurrency(metaMetrics.spend)}
          tiktokValue={formatCurrency(tiktokMetrics.spend)}
        />
        <MetricRow
          label="Impressions"
          metaValue={formatNumber(metaMetrics.impressions)}
          tiktokValue={formatNumber(tiktokMetrics.impressions)}
        />
        <MetricRow
          label="Clicks"
          metaValue={formatNumber(metaMetrics.clicks)}
          tiktokValue={formatNumber(tiktokMetrics.clicks)}
        />
        <MetricRow
          label="CTR"
          metaValue={`${metaMetrics.ctr.toFixed(2)}%`}
          tiktokValue={`${tiktokMetrics.ctr.toFixed(2)}%`}
        />
        <MetricRow
          label="Conversions"
          metaValue={formatNumber(metaMetrics.conversions)}
          tiktokValue={formatNumber(tiktokMetrics.conversions)}
        />
      </div>

      {/* Best Performing Highlight */}
      {totalSpend > 0 && (
        <div className="mt-4 pt-3 border-t border-stone/10">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                'w-2 h-2 rounded-full',
                metaMetrics.ctr >= tiktokMetrics.ctr ? 'bg-blue-500' : 'bg-charcoal'
              )}
            />
            <p className="text-xs text-stone">
              <span className="font-semibold text-charcoal">
                {metaMetrics.ctr >= tiktokMetrics.ctr ? 'Meta' : 'TikTok'}
              </span>{' '}
              is performing better with a{' '}
              <span className="font-semibold text-teal">
                {Math.max(metaMetrics.ctr, tiktokMetrics.ctr).toFixed(2)}% CTR
              </span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
