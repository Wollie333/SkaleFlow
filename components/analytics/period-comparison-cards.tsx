'use client';

import { Card } from '@/components/ui';
import {
  DocumentTextIcon,
  HeartIcon,
  EyeIcon,
  ChartBarIcon,
  UsersIcon,
  CursorArrowRaysIcon,
  BookmarkIcon,
  PlayCircleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
} from '@heroicons/react/24/outline';
import type { AnalyticsOverview, AnalyticsChanges } from './types';

interface PeriodComparisonCardsProps {
  data: AnalyticsOverview;
  changes?: AnalyticsChanges | null;
  isLoading?: boolean;
}

function formatCompact(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}k`;
  return v.toLocaleString();
}

function ChangeBadge({ value }: { value: number | null | undefined }) {
  if (value === null || value === undefined) return null;
  const isPositive = value >= 0;
  const Icon = isPositive ? ArrowTrendingUpIcon : ArrowTrendingDownIcon;
  return (
    <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs font-semibold ${
      isPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'
    }`}>
      <Icon className="w-3 h-3" />
      {Math.abs(value)}%
    </span>
  );
}

export function PeriodComparisonCards({ data, changes, isLoading }: PeriodComparisonCardsProps) {
  const cards = [
    {
      label: 'Posts Published',
      value: data.totalPosts,
      change: changes?.totalPosts,
      icon: DocumentTextIcon,
      color: 'text-charcoal',
      bg: 'bg-charcoal/10',
      format: (v: number) => v.toLocaleString(),
    },
    {
      label: 'Total Engagement',
      value: data.totalEngagement,
      change: changes?.totalEngagement,
      icon: HeartIcon,
      color: 'text-teal',
      bg: 'bg-teal/10',
      format: formatCompact,
    },
    {
      label: 'Total Impressions',
      value: data.totalImpressions,
      change: changes?.totalImpressions,
      icon: EyeIcon,
      color: 'text-indigo-500',
      bg: 'bg-indigo-500/10',
      format: formatCompact,
    },
    {
      label: 'Avg Eng. Rate',
      value: data.avgEngagementRate,
      change: changes?.avgEngagementRate,
      icon: ChartBarIcon,
      color: 'text-violet-600',
      bg: 'bg-violet-600/10',
      format: (v: number) => `${v.toFixed(2)}%`,
    },
    {
      label: 'Total Reach',
      value: data.totalReach,
      change: changes?.totalReach,
      icon: UsersIcon,
      color: 'text-violet-500',
      bg: 'bg-violet-500/10',
      format: formatCompact,
    },
    {
      label: 'Total Clicks',
      value: data.totalClicks,
      change: changes?.totalClicks,
      icon: CursorArrowRaysIcon,
      color: 'text-gold',
      bg: 'bg-gold/10',
      format: formatCompact,
    },
    {
      label: 'Total Saves',
      value: data.totalSaves,
      change: changes?.totalSaves,
      icon: BookmarkIcon,
      color: 'text-pink-500',
      bg: 'bg-pink-500/10',
      format: formatCompact,
    },
    {
      label: 'Video Views',
      value: data.totalVideoViews,
      change: changes?.totalVideoViews,
      icon: PlayCircleIcon,
      color: 'text-orange-500',
      bg: 'bg-orange-500/10',
      format: formatCompact,
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map(card => (
        <Card key={card.label} className="p-5 group hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 ${card.bg} rounded-lg flex items-center justify-center`}>
                <card.icon className={`w-5 h-5 ${card.color}`} />
              </div>
              <span className="text-sm text-stone">{card.label}</span>
            </div>
          </div>
          {isLoading ? (
            <div className="h-8 w-20 bg-stone/10 rounded animate-pulse" />
          ) : (
            <div className="flex items-end justify-between">
              <p className="text-2xl font-bold text-charcoal">
                {card.format(card.value)}
              </p>
              <ChangeBadge value={card.change} />
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}
