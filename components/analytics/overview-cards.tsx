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
} from '@heroicons/react/24/outline';

interface OverviewData {
  totalPosts: number;
  totalEngagement: number;
  totalImpressions: number;
  avgEngagementRate: number;
  totalReach: number;
  totalClicks: number;
  totalSaves: number;
  totalVideoViews: number;
}

interface OverviewCardsProps {
  data: OverviewData;
  isLoading?: boolean;
}

function formatCompact(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}k`;
  return v.toLocaleString();
}

export function OverviewCards({ data, isLoading }: OverviewCardsProps) {
  const cards = [
    {
      label: 'Posts Published',
      value: data.totalPosts,
      icon: DocumentTextIcon,
      color: 'text-charcoal',
      bg: 'bg-charcoal/10',
      format: (v: number) => v.toLocaleString(),
    },
    {
      label: 'Total Engagement',
      value: data.totalEngagement,
      icon: HeartIcon,
      color: 'text-teal',
      bg: 'bg-teal/10',
      format: formatCompact,
    },
    {
      label: 'Total Impressions',
      value: data.totalImpressions,
      icon: EyeIcon,
      color: 'text-indigo-500',
      bg: 'bg-indigo-500/10',
      format: formatCompact,
    },
    {
      label: 'Avg Eng. Rate',
      value: data.avgEngagementRate,
      icon: ChartBarIcon,
      color: 'text-violet-600',
      bg: 'bg-violet-600/10',
      format: (v: number) => `${v.toFixed(2)}%`,
    },
    {
      label: 'Total Reach',
      value: data.totalReach,
      icon: UsersIcon,
      color: 'text-violet-500',
      bg: 'bg-violet-500/10',
      format: formatCompact,
    },
    {
      label: 'Total Clicks',
      value: data.totalClicks,
      icon: CursorArrowRaysIcon,
      color: 'text-gold',
      bg: 'bg-gold/10',
      format: formatCompact,
    },
    {
      label: 'Total Saves',
      value: data.totalSaves,
      icon: BookmarkIcon,
      color: 'text-pink-500',
      bg: 'bg-pink-500/10',
      format: formatCompact,
    },
    {
      label: 'Video Views',
      value: data.totalVideoViews,
      icon: PlayCircleIcon,
      color: 'text-orange-500',
      bg: 'bg-orange-500/10',
      format: formatCompact,
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map(card => (
        <Card key={card.label} className="p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className={`w-10 h-10 ${card.bg} rounded-lg flex items-center justify-center`}>
              <card.icon className={`w-5 h-5 ${card.color}`} />
            </div>
            <span className="text-sm text-stone">{card.label}</span>
          </div>
          {isLoading ? (
            <div className="h-8 w-20 bg-stone/10 rounded animate-pulse" />
          ) : (
            <p className="text-2xl font-bold text-charcoal">
              {card.format(card.value)}
            </p>
          )}
        </Card>
      ))}
    </div>
  );
}
