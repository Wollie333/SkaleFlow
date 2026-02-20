'use client';

import { cn, formatCurrency, formatDate } from '@/lib/utils';
import { PlatformIcon } from '@/components/marketing/shared/platform-icon';
import { CampaignStatusBadge } from './campaign-status-badge';
import {
  EyeIcon,
  CursorArrowRaysIcon,
  ChartBarIcon,
  BanknotesIcon,
} from '@heroicons/react/24/outline';

interface CampaignCardProps {
  campaign: any;
  onClick?: () => void;
}

const objectiveLabels: Record<string, string> = {
  awareness: 'Awareness',
  traffic: 'Traffic',
  engagement: 'Engagement',
  leads: 'Leads',
  conversions: 'Conversions',
  app_installs: 'App Installs',
};

export function CampaignCard({ campaign, onClick }: CampaignCardProps) {
  const metrics = campaign.metrics || null;
  const hasMetrics = metrics && (metrics.impressions > 0 || metrics.clicks > 0);

  return (
    <div
      className={cn(
        'bg-cream-warm rounded-xl border border-teal/8 p-5 transition-all duration-300',
        'hover:-translate-y-0.5 hover:shadow-lg hover:shadow-dark/5',
        onClick && 'cursor-pointer'
      )}
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <PlatformIcon platform={campaign.platform || 'meta'} size="sm" />
          <div>
            <h3 className="text-sm font-semibold text-charcoal line-clamp-1">
              {campaign.name}
            </h3>
            <p className="text-xs text-stone mt-0.5">
              {formatDate(campaign.created_at || new Date())}
            </p>
          </div>
        </div>
        <CampaignStatusBadge status={campaign.status || 'draft'} />
      </div>

      {/* Objective + Budget */}
      <div className="flex items-center gap-2 mb-3">
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-teal/10 text-teal capitalize">
          {objectiveLabels[campaign.objective] || campaign.objective || 'N/A'}
        </span>
        {campaign.budget_cents > 0 && (
          <span className="text-xs text-stone font-medium">
            {formatCurrency(campaign.budget_cents)} {campaign.budget_type === 'daily' ? '/day' : 'total'}
          </span>
        )}
      </div>

      {/* Metrics Row */}
      {hasMetrics && (
        <div className="grid grid-cols-4 gap-2 pt-3 border-t border-stone/10">
          <MetricItem
            icon={<EyeIcon className="w-3.5 h-3.5" />}
            label="Impressions"
            value={formatNumber(metrics.impressions)}
          />
          <MetricItem
            icon={<CursorArrowRaysIcon className="w-3.5 h-3.5" />}
            label="Clicks"
            value={formatNumber(metrics.clicks)}
          />
          <MetricItem
            icon={<ChartBarIcon className="w-3.5 h-3.5" />}
            label="CTR"
            value={`${((metrics.clicks / Math.max(metrics.impressions, 1)) * 100).toFixed(2)}%`}
          />
          <MetricItem
            icon={<BanknotesIcon className="w-3.5 h-3.5" />}
            label="Spend"
            value={formatCurrency(metrics.spend_cents || 0)}
          />
        </div>
      )}
    </div>
  );
}

function MetricItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="text-center">
      <div className="flex items-center justify-center text-stone mb-0.5">{icon}</div>
      <p className="text-xs font-semibold text-charcoal">{value}</p>
      <p className="text-[10px] text-stone">{label}</p>
    </div>
  );
}

function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}
