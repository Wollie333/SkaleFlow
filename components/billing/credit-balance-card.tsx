'use client';

import { Card } from '@/components/ui';
import Link from 'next/link';

interface CreditBalanceCardProps {
  monthlyRemaining: number;
  monthlyTotal: number;
  topupRemaining: number;
  periodEnd: string | null;
  compact?: boolean;
  isSuperAdmin?: boolean;
  apiCostUSD30d?: number;
  apiCostUSDAllTime?: number;
}

export function CreditBalanceCard({
  monthlyRemaining,
  monthlyTotal,
  topupRemaining,
  periodEnd,
  compact = false,
  isSuperAdmin = false,
  apiCostUSD30d,
  apiCostUSDAllTime,
}: CreditBalanceCardProps) {
  const totalRemaining = monthlyRemaining + topupRemaining;
  const monthlyPercent = monthlyTotal > 0 ? Math.round((monthlyRemaining / monthlyTotal) * 100) : 0;

  const resetDate = periodEnd
    ? new Date(periodEnd).toLocaleDateString('en-ZA', { month: 'short', day: 'numeric' })
    : null;

  if (compact) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-cream-warm text-sm">
        {isSuperAdmin && apiCostUSDAllTime !== undefined ? (
          <>
            <span className="font-semibold text-charcoal">${apiCostUSDAllTime.toFixed(2)}</span>
            <span className="text-stone">API spent</span>
          </>
        ) : (
          <>
            <span className="font-semibold text-charcoal">{totalRemaining.toLocaleString()}</span>
            <span className="text-stone">credits</span>
          </>
        )}
      </div>
    );
  }

  return (
    <Card className="p-6">
      {/* Super Admin: API Cost Overview */}
      {isSuperAdmin && (apiCostUSD30d !== undefined || apiCostUSDAllTime !== undefined) && (
        <div className="mb-5 p-4 rounded-xl bg-charcoal/5 border border-charcoal/10">
          <h4 className="text-xs font-semibold text-stone uppercase tracking-wider mb-3">API Cost (Real Spend)</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-stone">Last 30 Days</p>
              <p className="text-xl font-bold text-charcoal">${(apiCostUSD30d || 0).toFixed(4)}</p>
            </div>
            <div>
              <p className="text-xs text-stone">All Time</p>
              <p className="text-xl font-bold text-charcoal">${(apiCostUSDAllTime || 0).toFixed(4)}</p>
            </div>
          </div>
          {isSuperAdmin && (
            <p className="text-xs text-teal mt-2 font-medium">Admin bypass active — credits not deducted</p>
          )}
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-charcoal">Credit Balance</h3>
        <span className="text-2xl font-bold text-teal">{totalRemaining.toLocaleString()}</span>
      </div>

      {/* Monthly Credits Progress */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-sm mb-1">
          <span className="text-stone">Monthly Credits</span>
          <span className="font-medium text-charcoal">
            {monthlyRemaining.toLocaleString()} / {monthlyTotal.toLocaleString()}
          </span>
        </div>
        <div className="w-full bg-stone/10 rounded-full h-2.5">
          <div
            className="bg-teal h-2.5 rounded-full transition-all duration-500"
            style={{ width: `${monthlyPercent}%` }}
          />
        </div>
        {resetDate && (
          <p className="text-xs text-stone mt-1">Resets on {resetDate}</p>
        )}
      </div>

      {/* Top-up Credits */}
      <div className="flex items-center justify-between text-sm mb-4">
        <span className="text-stone">Top-up Credits</span>
        <span className="font-medium text-charcoal">{topupRemaining.toLocaleString()}</span>
      </div>

      <Link
        href="/billing"
        className="block w-full text-center px-4 py-2 bg-teal text-white rounded-lg text-sm font-medium hover:bg-teal/90 transition-colors"
      >
        Buy More Credits
      </Link>
    </Card>
  );
}
