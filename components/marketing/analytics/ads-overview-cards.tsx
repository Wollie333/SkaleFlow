'use client';

import { cn, formatCurrency } from '@/lib/utils';
import {
  BanknotesIcon,
  EyeIcon,
  CursorArrowRaysIcon,
  ShoppingCartIcon,
} from '@heroicons/react/24/outline';

interface AdsOverviewCardsProps {
  metrics: {
    totalSpend: number;
    totalImpressions: number;
    avgCtr: number;
    totalConversions: number;
  };
}

function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toLocaleString();
}

export function AdsOverviewCards({ metrics }: AdsOverviewCardsProps) {
  const cards = [
    {
      label: 'Total Spend',
      value: formatCurrency(metrics.totalSpend),
      icon: BanknotesIcon,
      iconBg: 'bg-teal/10',
      iconColor: 'text-teal',
    },
    {
      label: 'Total Impressions',
      value: formatNumber(metrics.totalImpressions),
      icon: EyeIcon,
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
    },
    {
      label: 'Average CTR',
      value: `${metrics.avgCtr.toFixed(2)}%`,
      icon: CursorArrowRaysIcon,
      iconBg: 'bg-gold/10',
      iconColor: 'text-gold',
    },
    {
      label: 'Total Conversions',
      value: formatNumber(metrics.totalConversions),
      icon: ShoppingCartIcon,
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            className="bg-white rounded-xl border border-teal/8 p-4 transition-all duration-300 hover:shadow-md hover:shadow-dark/5"
          >
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'w-10 h-10 rounded-lg flex items-center justify-center shrink-0',
                  card.iconBg
                )}
              >
                <Icon className={cn('w-5 h-5', card.iconColor)} />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-stone font-medium">{card.label}</p>
                <p className="text-lg font-bold text-charcoal truncate">{card.value}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
