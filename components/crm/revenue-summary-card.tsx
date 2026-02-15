'use client';

import { ArrowTrendingUpIcon, ArrowTrendingDownIcon } from '@heroicons/react/24/outline';

interface RevenueSummaryCardProps {
  revenueThisMonth: number; // cents
  revenueLastMonth: number; // cents
}

function formatZAR(cents: number): string {
  return `R${(cents / 100).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
}

export function RevenueSummaryCard({ revenueThisMonth, revenueLastMonth }: RevenueSummaryCardProps) {
  const diff = revenueLastMonth > 0
    ? ((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100
    : revenueThisMonth > 0 ? 100 : 0;
  const isUp = diff >= 0;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <p className="text-sm font-medium text-stone mb-1">Revenue This Month</p>
      <p className="text-2xl font-bold text-charcoal">{formatZAR(revenueThisMonth)}</p>
      <div className="flex items-center gap-1 mt-2">
        {isUp ? (
          <ArrowTrendingUpIcon className="w-4 h-4 text-green-500" />
        ) : (
          <ArrowTrendingDownIcon className="w-4 h-4 text-red-500" />
        )}
        <span className={`text-sm font-medium ${isUp ? 'text-green-600' : 'text-red-600'}`}>
          {Math.abs(diff).toFixed(1)}%
        </span>
        <span className="text-sm text-stone">vs last month ({formatZAR(revenueLastMonth)})</span>
      </div>
    </div>
  );
}
