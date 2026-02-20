'use client';

import { useEffect, useState, useCallback } from 'react';
import { CATEGORY_CONFIG } from '@/lib/authority/constants';
import {
  TrophyIcon,
  NewspaperIcon,
  CheckCircleIcon,
  CurrencyDollarIcon,
} from '@heroicons/react/24/outline';

interface AnalyticsData {
  total_cards: number;
  published_count: number;
  conversion_rate: number;
  total_points: number;
  earned_count: number;
  paid_count: number;
  category_breakdown: Array<{ category: string; count: number }>;
  monthly_placements: Array<{ month: string; count: number }>;
}

interface AnalyticsSummaryProps {
  organizationId: string;
}

export function AnalyticsSummary({ organizationId }: AnalyticsSummaryProps) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      // Fetch pipeline cards for analytics
      const res = await fetch(`/api/authority/pipeline?organizationId=${organizationId}`);
      if (!res.ok) return;
      const cards = await res.json() as Array<{
        published_at: string | null;
        category: string;
        authority_commercial?: Array<{ engagement_type: string }>;
      }>;

      const totalCards = cards.length;
      const publishedCards = cards.filter(c => c.published_at);
      const publishedCount = publishedCards.length;
      const conversionRate = totalCards > 0 ? Math.round((publishedCount / totalCards) * 100) : 0;

      // Score data
      const scoreRes = await fetch(`/api/authority/score?organizationId=${organizationId}`);
      const scoreData = scoreRes.ok ? await scoreRes.json() : { total_points: 0 };

      // Earned vs paid
      const earnedCount = publishedCards.filter(c => {
        const comm = c.authority_commercial;
        return !comm || !Array.isArray(comm) || comm.length === 0 || comm[0]?.engagement_type === 'earned';
      }).length;
      const paidCount = publishedCount - earnedCount;

      // Category breakdown
      const catMap: Record<string, number> = {};
      for (const card of publishedCards) {
        catMap[card.category] = (catMap[card.category] || 0) + 1;
      }
      const categoryBreakdown = Object.entries(catMap)
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => b.count - a.count);

      // Monthly placements (last 6 months)
      const monthlyPlacements: Array<{ month: string; count: number }> = [];
      const now = new Date();
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const count = publishedCards.filter(c => c.published_at && c.published_at.startsWith(monthKey)).length;
        monthlyPlacements.push({ month: monthKey, count });
      }

      setData({
        total_cards: totalCards,
        published_count: publishedCount,
        conversion_rate: conversionRate,
        total_points: scoreData.total_points || 0,
        earned_count: earnedCount,
        paid_count: paidCount,
        category_breakdown: categoryBreakdown,
        monthly_placements: monthlyPlacements,
      });
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return <div className="animate-pulse h-64 bg-cream-warm/30 rounded-xl" />;
  }

  if (!data) return null;

  const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          icon={<NewspaperIcon className="w-5 h-5 text-teal" />}
          label="Total Opportunities"
          value={data.total_cards}
        />
        <MetricCard
          icon={<CheckCircleIcon className="w-5 h-5 text-green-500" />}
          label="Published"
          value={data.published_count}
          suffix={`(${data.conversion_rate}%)`}
        />
        <MetricCard
          icon={<TrophyIcon className="w-5 h-5 text-gold" />}
          label="Authority Points"
          value={data.total_points}
        />
        <MetricCard
          icon={<CurrencyDollarIcon className="w-5 h-5 text-indigo-500" />}
          label="Earned / Paid"
          value={`${data.earned_count} / ${data.paid_count}`}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Monthly Placements Chart */}
        <div className="bg-cream-warm rounded-xl border border-stone/10 p-4">
          <h3 className="text-sm font-serif font-semibold text-charcoal mb-3">Monthly Placements</h3>
          <div className="flex items-end gap-2 h-32">
            {data.monthly_placements.map(m => {
              const max = Math.max(...data.monthly_placements.map(x => x.count), 1);
              const height = (m.count / max) * 100;
              const monthNum = parseInt(m.month.split('-')[1]) - 1;
              return (
                <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[9px] text-stone">{m.count || ''}</span>
                  <div
                    className="w-full bg-teal/80 rounded-t transition-all"
                    style={{ height: `${Math.max(height, 4)}%` }}
                  />
                  <span className="text-[9px] text-stone">{monthLabels[monthNum]}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="bg-cream-warm rounded-xl border border-stone/10 p-4">
          <h3 className="text-sm font-serif font-semibold text-charcoal mb-3">By Category</h3>
          {data.category_breakdown.length === 0 ? (
            <p className="text-xs text-stone text-center py-8">No published placements yet</p>
          ) : (
            <div className="space-y-2">
              {data.category_breakdown.map(({ category, count }) => {
                const max = Math.max(...data.category_breakdown.map(x => x.count), 1);
                const label = CATEGORY_CONFIG[category as keyof typeof CATEGORY_CONFIG]?.label || category;
                return (
                  <div key={category}>
                    <div className="flex justify-between text-xs mb-0.5">
                      <span className="text-charcoal">{label}</span>
                      <span className="text-stone">{count}</span>
                    </div>
                    <div className="h-1.5 bg-cream-warm rounded-full overflow-hidden">
                      <div
                        className="h-full bg-teal rounded-full"
                        style={{ width: `${(count / max) * 100}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MetricCard({ icon, label, value, suffix }: { icon: React.ReactNode; label: string; value: number | string; suffix?: string }) {
  return (
    <div className="bg-cream-warm rounded-xl border border-stone/10 p-4">
      <div className="flex items-center gap-2 mb-2">
        <div className="p-1.5 bg-cream-warm/50 rounded-lg">{icon}</div>
      </div>
      <p className="text-[10px] text-stone uppercase tracking-wider">{label}</p>
      <p className="text-lg font-bold text-charcoal">
        {typeof value === 'number' ? value.toLocaleString() : value}
        {suffix && <span className="text-xs text-stone font-normal ml-1">{suffix}</span>}
      </p>
    </div>
  );
}
