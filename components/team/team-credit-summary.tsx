'use client';

import { cn } from '@/lib/utils';
import {
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  UserGroupIcon,
  BoltIcon,
} from '@heroicons/react/24/outline';

interface OrgBalance {
  monthlyRemaining: number;
  monthlyTotal: number;
  topupRemaining: number;
  totalRemaining: number;
}

interface TeamCreditSummaryProps {
  orgBalance: OrgBalance;
  totalAllocated: number;
}

export function TeamCreditSummary({ orgBalance, totalAllocated }: TeamCreditSummaryProps) {
  const monthlyUsed = orgBalance.monthlyTotal - orgBalance.monthlyRemaining;
  const monthlyPercent =
    orgBalance.monthlyTotal > 0
      ? Math.round((monthlyUsed / orgBalance.monthlyTotal) * 100)
      : 0;

  const unallocated = orgBalance.totalRemaining - totalAllocated;

  const stats = [
    {
      label: 'Total Available',
      value: orgBalance.totalRemaining.toLocaleString(),
      icon: CurrencyDollarIcon,
      iconColor: 'text-teal',
      iconBg: 'bg-teal/10',
    },
    {
      label: 'Monthly Remaining',
      value: orgBalance.monthlyRemaining.toLocaleString(),
      sub: `of ${orgBalance.monthlyTotal.toLocaleString()}`,
      icon: ArrowTrendingUpIcon,
      iconColor: 'text-charcoal',
      iconBg: 'bg-stone/10',
    },
    {
      label: 'Top-up Remaining',
      value: orgBalance.topupRemaining.toLocaleString(),
      icon: BoltIcon,
      iconColor: 'text-gold',
      iconBg: 'bg-gold/10',
    },
    {
      label: 'Allocated to Team',
      value: totalAllocated.toLocaleString(),
      sub: unallocated >= 0 ? `${unallocated.toLocaleString()} unallocated` : 'Over-allocated',
      icon: UserGroupIcon,
      iconColor: unallocated >= 0 ? 'text-teal' : 'text-red-500',
      iconBg: unallocated >= 0 ? 'bg-teal/10' : 'bg-red-50',
    },
  ];

  return (
    <div className="bg-cream-warm rounded-xl border border-teal/[0.08] shadow-[0_2px_12px_rgba(15,31,29,0.03)] p-6">
      <h3 className="text-sm font-semibold text-charcoal mb-5">Team Credit Overview</h3>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        {stats.map((stat) => (
          <div key={stat.label} className="flex items-start gap-3">
            <div
              className={cn(
                'w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0',
                stat.iconBg
              )}
            >
              <stat.icon className={cn('w-4.5 h-4.5', stat.iconColor)} />
            </div>
            <div>
              <p className="text-xs text-stone">{stat.label}</p>
              <p className="text-lg font-bold text-charcoal">{stat.value}</p>
              {stat.sub && (
                <p className="text-[10px] text-stone/60">{stat.sub}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Monthly Usage Progress */}
      <div>
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="text-stone font-medium">Monthly Usage</span>
          <span className="text-charcoal font-semibold">
            {monthlyUsed.toLocaleString()} / {orgBalance.monthlyTotal.toLocaleString()}
            <span className="text-stone font-normal ml-1">({monthlyPercent}%)</span>
          </span>
        </div>
        <div className="w-full bg-stone/10 rounded-full h-2.5">
          <div
            className={cn(
              'h-2.5 rounded-full transition-all duration-500',
              monthlyPercent > 90
                ? 'bg-red-400'
                : monthlyPercent > 70
                  ? 'bg-gold'
                  : 'bg-teal'
            )}
            style={{ width: `${Math.min(monthlyPercent, 100)}%` }}
          />
        </div>
        {monthlyPercent > 90 && (
          <p className="text-[10px] text-red-500 mt-1">
            Monthly credits are nearly exhausted. Consider purchasing a top-up pack.
          </p>
        )}
      </div>
    </div>
  );
}
