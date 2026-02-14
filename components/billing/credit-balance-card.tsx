'use client';

import { Card, Badge } from '@/components/ui';
import Link from 'next/link';
import { apiCostToSalesRevenue } from '@/lib/ai/utils';

interface CreditBalanceCardProps {
  monthlyRemaining: number;
  monthlyTotal: number;
  topupRemaining: number;
  periodEnd: string | null;
  compact?: boolean;
  isSuperAdmin?: boolean;
  apiCostUSD30d?: number;
  apiCostUSDAllTime?: number;
  systemTotalCredits?: number;
  systemTotalCostUSD?: number;
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
  systemTotalCredits,
  systemTotalCostUSD,
}: CreditBalanceCardProps) {
  const totalRemaining = monthlyRemaining + topupRemaining;
  const monthlyPercent = monthlyTotal > 0 ? Math.round((monthlyRemaining / monthlyTotal) * 100) : 0;

  const resetDate = periodEnd
    ? new Date(periodEnd).toLocaleDateString('en-ZA', { month: 'short', day: 'numeric' })
    : null;

  if (compact) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-cream-warm text-sm">
        {isSuperAdmin && systemTotalCredits !== undefined ? (
          <>
            <span className="font-semibold text-charcoal">{systemTotalCredits.toLocaleString()}</span>
            <span className="text-stone">credits available</span>
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

  // Super Admin: Show system-wide available credits
  if (isSuperAdmin && systemTotalCredits !== undefined && systemTotalCostUSD !== undefined) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-charcoal">System Available Credits</h3>
          <Badge variant="default" className="bg-teal/10 text-teal">
            Real-Time
          </Badge>
        </div>

        {/* Main Balance Display */}
        <div className="mb-6 p-6 rounded-xl bg-gradient-to-br from-teal/5 to-teal/10 border border-teal/20">
          <div className="flex items-baseline justify-between mb-2">
            <span className="text-sm text-stone">Total Credits Available</span>
            <div className="flex items-baseline gap-3">
              <span className={`text-4xl font-bold ${systemTotalCredits < 0 ? 'text-red-600' : 'text-teal'}`}>
                {systemTotalCredits.toLocaleString()}
              </span>
              <span className="text-lg text-stone">credits</span>
            </div>
          </div>
          <div className="flex items-baseline justify-between pt-3 border-t border-teal/10">
            <span className="text-sm text-stone">USD Value (Cost Basis)</span>
            <div className="flex items-baseline gap-3">
              <span className={`text-3xl font-bold ${systemTotalCostUSD < 0 ? 'text-red-600' : 'text-charcoal'}`}>
                ${Math.abs(systemTotalCostUSD).toFixed(2)}
              </span>
              {systemTotalCostUSD < 0 && (
                <Badge variant="default" className="bg-red-100 text-red-700">
                  Negative
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Explanation */}
        <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
          <div className="flex items-start gap-3">
            <span className="text-xl">ℹ️</span>
            <div className="flex-1">
              <h5 className="text-sm font-semibold text-blue-900 mb-1">What This Means</h5>
              <div className="text-xs text-blue-800 space-y-1">
                <p>• <strong>Available Credits:</strong> Sum of all credits across all organizations in the system</p>
                <p>• <strong>USD Value:</strong> Actual API cost value of these credits (what you'd pay providers)</p>
                <p>• <strong>Real-Time:</strong> Updates every 30 seconds as users consume credits</p>
                <p>• <strong>Negative Balance:</strong> System has used more than allocated (super admins can go negative)</p>
              </div>
            </div>
          </div>
        </div>

        {/* Status Indicator */}
        <div className="mt-4 flex items-center justify-between p-3 rounded-lg bg-cream-warm">
          <span className="text-sm font-medium text-charcoal">System Status</span>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${systemTotalCredits > 10000 ? 'bg-green-500' : systemTotalCredits > 0 ? 'bg-amber-500' : 'bg-red-500'} animate-pulse`} />
            <span className="text-sm text-stone">
              {systemTotalCredits > 10000 ? 'Healthy' : systemTotalCredits > 0 ? 'Low' : 'Negative'}
            </span>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      {/* Super Admin: API Cost & Revenue Overview */}
      {isSuperAdmin && (apiCostUSD30d !== undefined || apiCostUSDAllTime !== undefined) && (
        <div className="mb-5 space-y-4">
          {/* Real API Cost */}
          <div className="p-4 rounded-xl bg-red-50 border border-red-200">
            <h4 className="text-xs font-semibold text-red-900 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span>💸</span>
              <span>Real API Cost (What You Pay)</span>
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-red-700">Last 30 Days</p>
                <p className="text-xl font-bold text-red-900">${(apiCostUSD30d || 0).toFixed(4)}</p>
              </div>
              <div>
                <p className="text-xs text-red-700">All Time</p>
                <p className="text-xl font-bold text-red-900">${(apiCostUSDAllTime || 0).toFixed(4)}</p>
              </div>
            </div>
          </div>

          {/* Sales Revenue Potential */}
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
            <h4 className="text-xs font-semibold text-emerald-900 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span>💰</span>
              <span>Sales Revenue (100% Markup)</span>
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-emerald-700">Last 30 Days</p>
                <p className="text-xl font-bold text-emerald-900">${apiCostToSalesRevenue(apiCostUSD30d || 0).toFixed(2)}</p>
              </div>
              <div>
                <p className="text-xs text-emerald-700">All Time</p>
                <p className="text-xl font-bold text-emerald-900">${apiCostToSalesRevenue(apiCostUSDAllTime || 0).toFixed(2)}</p>
              </div>
            </div>
          </div>

          {/* Profit Margin */}
          <div className="p-4 rounded-xl bg-teal/10 border border-teal/30">
            <h4 className="text-xs font-semibold text-teal uppercase tracking-wider mb-3 flex items-center gap-2">
              <span>📈</span>
              <span>Profit Margin (Revenue - Cost)</span>
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-teal/70">Last 30 Days</p>
                <p className="text-xl font-bold text-teal">
                  ${(apiCostToSalesRevenue(apiCostUSD30d || 0) - (apiCostUSD30d || 0)).toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-xs text-teal/70">All Time</p>
                <p className="text-xl font-bold text-teal">
                  ${(apiCostToSalesRevenue(apiCostUSDAllTime || 0) - (apiCostUSDAllTime || 0)).toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          <p className="text-xs text-stone text-center font-medium bg-teal/10 border border-teal/30 rounded-lg p-2">
            ✅ Credits are tracked normally — you can use the app even with negative balance
          </p>
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-charcoal">Credit Balance</h3>
        <div className="flex items-center gap-2">
          <span className={`text-2xl font-bold ${totalRemaining < 0 ? 'text-red-600' : 'text-teal'}`}>
            {totalRemaining.toLocaleString()}
          </span>
          {totalRemaining < 0 && isSuperAdmin && (
            <Badge variant="default" className="bg-red-100 text-red-700 text-xs">
              Negative
            </Badge>
          )}
        </div>
      </div>

      {/* Negative Balance Explanation for Super Admins */}
      {totalRemaining < 0 && isSuperAdmin && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200">
          <p className="text-xs text-red-900">
            <strong>Note:</strong> As a super admin, you can use the app with a negative balance.
            Credits are deducted normally to track actual usage. Purchase credits to bring balance positive.
          </p>
        </div>
      )}

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
