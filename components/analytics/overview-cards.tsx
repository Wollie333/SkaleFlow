'use client';

import { Card } from '@/components/ui';
import {
  DocumentTextIcon,
  HeartIcon,
  EyeIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';

interface OverviewData {
  totalPosts: number;
  totalEngagement: number;
  totalImpressions: number;
  avgEngagementRate: number;
}

interface OverviewCardsProps {
  data: OverviewData;
  isLoading?: boolean;
}

export function OverviewCards({ data, isLoading }: OverviewCardsProps) {
  const cards = [
    {
      label: 'Posts Published',
      value: data.totalPosts,
      icon: DocumentTextIcon,
      format: (v: number) => v.toLocaleString(),
    },
    {
      label: 'Total Engagement',
      value: data.totalEngagement,
      icon: HeartIcon,
      format: (v: number) => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v.toLocaleString(),
    },
    {
      label: 'Total Impressions',
      value: data.totalImpressions,
      icon: EyeIcon,
      format: (v: number) => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v.toLocaleString(),
    },
    {
      label: 'Avg Engagement Rate',
      value: data.avgEngagementRate,
      icon: ChartBarIcon,
      format: (v: number) => `${v.toFixed(2)}%`,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map(card => (
        <Card key={card.label} className="p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-teal/10 rounded-lg flex items-center justify-center">
              <card.icon className="w-5 h-5 text-teal" />
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
