'use client';

import { cn } from '@/lib/utils';
import { ArrowTrendingUpIcon, ArrowTrendingDownIcon } from '@heroicons/react/24/outline';

interface AnalyticsMetricCardProps {
  title: string;
  value: string | number;
  growth?: number;
  icon: React.ComponentType<{ className?: string }>;
  color: 'teal' | 'blue' | 'purple' | 'pink' | 'orange' | 'green';
}

const COLOR_CLASSES = {
  teal: {
    icon: 'text-teal',
    bg: 'bg-teal/10',
    gradient: 'from-teal-50 to-blue-50',
    border: 'border-teal/20',
  },
  blue: {
    icon: 'text-blue-600',
    bg: 'bg-blue-500/10',
    gradient: 'from-blue-50 to-indigo-50',
    border: 'border-blue/20',
  },
  purple: {
    icon: 'text-purple-600',
    bg: 'bg-purple-100',
    gradient: 'from-purple-50 to-pink-50',
    border: 'border-purple/20',
  },
  pink: {
    icon: 'text-pink-600',
    bg: 'bg-pink-100',
    gradient: 'from-pink-50 to-red-50',
    border: 'border-pink/20',
  },
  orange: {
    icon: 'text-orange-600',
    bg: 'bg-orange-100',
    gradient: 'from-orange-50 to-yellow-50',
    border: 'border-orange/20',
  },
  green: {
    icon: 'text-green-600',
    bg: 'bg-green-500/10',
    gradient: 'from-green-50 to-teal-50',
    border: 'border-green/20',
  },
};

export function AnalyticsMetricCard({
  title,
  value,
  growth,
  icon: Icon,
  color,
}: AnalyticsMetricCardProps) {
  const colors = COLOR_CLASSES[color];
  const hasGrowth = growth !== undefined && growth !== null;
  const isPositive = hasGrowth && growth >= 0;

  return (
    <div
      className={cn(
        'bg-gradient-to-br rounded-xl border p-6 hover:shadow-lg transition-all',
        colors.gradient,
        colors.border
      )}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={cn('w-12 h-12 rounded-lg flex items-center justify-center', colors.bg)}>
          <Icon className={cn('w-6 h-6', colors.icon)} />
        </div>

        {hasGrowth && (
          <div
            className={cn(
              'flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold',
              isPositive
                ? 'bg-green-500/10 text-green-400'
                : 'bg-red-500/10 text-red-400'
            )}
          >
            {isPositive ? (
              <ArrowTrendingUpIcon className="w-3.5 h-3.5" />
            ) : (
              <ArrowTrendingDownIcon className="w-3.5 h-3.5" />
            )}
            {Math.abs(growth).toFixed(1)}%
          </div>
        )}
      </div>

      <div>
        <p className="text-sm text-stone mb-1">{title}</p>
        <p className="text-3xl font-bold text-charcoal">{value}</p>
      </div>

      {hasGrowth && (
        <p className="text-xs text-stone mt-2">vs previous 30 days</p>
      )}
    </div>
  );
}
