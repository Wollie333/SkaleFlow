'use client';

import { useState, useEffect } from 'react';
import { UsersIcon, BuildingOfficeIcon, CurrencyDollarIcon, DocumentTextIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { LifecycleFunnelChart } from './lifecycle-funnel-chart';
import { RevenueSummaryCard } from './revenue-summary-card';
import { ActivityTimeline } from './activity-timeline';
import type { CrmLifecycleStage } from '@/types/database';

interface DashboardStats {
  contacts_by_lifecycle: Record<CrmLifecycleStage, number>;
  total_contacts: number;
  total_companies: number;
  open_deals_count: number;
  open_deals_value: number;
  won_deals_this_month: number;
  won_deals_value_this_month: number;
  overdue_invoices_count: number;
  revenue_this_month: number;
  revenue_last_month: number;
  recent_activity: Array<{
    id: string;
    activity_type: string;
    title: string;
    description: string | null;
    performed_by: string | null;
    created_at: string;
    users?: { full_name: string } | null;
  }>;
}

function formatZAR(cents: number): string {
  return `R${(cents / 100).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
}

interface CrmDashboardProps {
  organizationId: string;
}

export function CrmDashboard({ organizationId }: CrmDashboardProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, [organizationId]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/crm/dashboard?organizationId=${organizationId}`);
      const data = await res.json();
      setStats(data);
    } catch { /* ignore */ }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-gray-100 rounded-xl h-24" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-100 rounded-xl h-64" />
          <div className="bg-gray-100 rounded-xl h-64" />
        </div>
      </div>
    );
  }

  if (!stats) {
    return <div className="text-center py-12 text-stone">Failed to load dashboard data.</div>;
  }

  const metricCards = [
    {
      label: 'Total Contacts',
      value: stats.total_contacts.toString(),
      icon: UsersIcon,
      color: 'text-teal bg-teal/10',
    },
    {
      label: 'Companies',
      value: stats.total_companies.toString(),
      icon: BuildingOfficeIcon,
      color: 'text-blue-600 bg-blue-50',
    },
    {
      label: 'Open Pipeline',
      value: formatZAR(stats.open_deals_value),
      subtitle: `${stats.open_deals_count} deals`,
      icon: CurrencyDollarIcon,
      color: 'text-gold bg-gold/10',
    },
    {
      label: 'Won This Month',
      value: formatZAR(stats.won_deals_value_this_month),
      subtitle: `${stats.won_deals_this_month} deals`,
      icon: CurrencyDollarIcon,
      color: 'text-green-600 bg-green-50',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {metricCards.map((card) => (
          <div key={card.label} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className={`p-2 rounded-lg ${card.color}`}>
                <card.icon className="w-5 h-5" />
              </div>
            </div>
            <p className="text-sm text-stone">{card.label}</p>
            <p className="text-xl font-bold text-charcoal">{card.value}</p>
            {card.subtitle && <p className="text-xs text-stone mt-0.5">{card.subtitle}</p>}
          </div>
        ))}
      </div>

      {/* Overdue invoices warning */}
      {stats.overdue_invoices_count > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <ExclamationTriangleIcon className="w-5 h-5 text-red-500 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-red-800">
              {stats.overdue_invoices_count} overdue invoice{stats.overdue_invoices_count > 1 ? 's' : ''}
            </p>
            <p className="text-xs text-red-600">Review and follow up on outstanding payments</p>
          </div>
        </div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Lifecycle Funnel */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-charcoal mb-4">Contact Lifecycle</h3>
          <LifecycleFunnelChart data={stats.contacts_by_lifecycle} />
        </div>

        {/* Revenue Summary */}
        <div className="space-y-4">
          <RevenueSummaryCard
            revenueThisMonth={stats.revenue_this_month}
            revenueLastMonth={stats.revenue_last_month}
          />
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-2 mb-1">
              <DocumentTextIcon className="w-4 h-4 text-red-500" />
              <p className="text-sm font-medium text-charcoal">Overdue Invoices</p>
            </div>
            <p className="text-2xl font-bold text-charcoal">{stats.overdue_invoices_count}</p>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-charcoal mb-4">Recent Activity</h3>
        <ActivityTimeline activities={stats.recent_activity} />
      </div>
    </div>
  );
}
