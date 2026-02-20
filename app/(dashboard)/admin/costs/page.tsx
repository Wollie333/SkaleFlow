'use client';

import { useState, useEffect, useCallback } from 'react';
import { PageHeader } from '@/components/ui';
import { CurrencyDollarIcon } from '@heroicons/react/24/outline';
import { AIProviderConnections } from '@/components/admin/ai-provider-connections';

interface AdminModel {
  id: string;
  name: string;
  provider: string;
  isFree: boolean;
  isEnabled: boolean;
}

interface Summary {
  totalApiCostUSD: number;
  totalApiCostZAR: number;
  totalCreditsCharged: number;
  totalRevenueZAR: number;
  profitZAR: number;
  profitMargin: number;
  totalRequests: number;
  freeModelRequests: number;
}

interface OrgRow {
  orgId: string;
  orgName: string;
  tierName: string;
  totalCreditsUsed: number;
  totalRequests: number;
  apiCostUSD: number;
  monthlyAllocation: number;
}

interface ModelRow {
  model: string;
  provider: string;
  isFree: boolean;
  requests: number;
  inputTokens: number;
  outputTokens: number;
  creditsCharged: number;
  apiCostUSD: number;
}

interface FeatureRow {
  feature: string;
  requests: number;
  creditsCharged: number;
  apiCostUSD: number;
}

interface TopupRevenue {
  totalZAR: number;
  count: number;
}

interface CostData {
  summary: Summary;
  byOrganization: OrgRow[];
  byModel: ModelRow[];
  byFeature: FeatureRow[];
  topupRevenue: TopupRevenue;
}

type Period = '7d' | '30d' | '90d' | 'all';

const PERIODS: { value: Period; label: string }[] = [
  { value: '7d', label: '7 Days' },
  { value: '30d', label: '30 Days' },
  { value: '90d', label: '90 Days' },
  { value: 'all', label: 'All Time' },
];

function formatUSD(n: number): string {
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatZAR(n: number): string {
  return 'R' + n.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatNumber(n: number): string {
  return n.toLocaleString('en-ZA');
}

function formatTokens(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return n.toString();
}

const FEATURE_LABELS: Record<string, string> = {
  brand_chat: 'Brand Engine',
  brand_engine: 'Brand Engine',
  brand_import: 'Brand Import',
  content_generation: 'Content Generation',
  logo_generation: 'Logo Generation',
  ad_generation: 'Ad Generation',
};

export default function AdminCostsPage() {
  const [data, setData] = useState<CostData | null>(null);
  const [period, setPeriod] = useState<Period>('30d');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [orgSort, setOrgSort] = useState<{ key: keyof OrgRow; desc: boolean }>({ key: 'totalCreditsUsed', desc: true });
  const [adminModels, setAdminModels] = useState<AdminModel[]>([]);
  const [togglingModel, setTogglingModel] = useState<string | null>(null);

  const fetchData = useCallback(async (p: Period) => {
    setIsLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/costs?period=${p}`);
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || 'Failed to load cost data');
        return;
      }
      setData(json);
    } catch {
      setError('Failed to load cost data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(period);
  }, [period, fetchData]);

  // Fetch model toggle states
  useEffect(() => {
    async function fetchModels() {
      try {
        const res = await fetch('/api/admin/models');
        if (res.ok) {
          const json = await res.json();
          setAdminModels(json.models || []);
        }
      } catch {
        // silent
      }
    }
    fetchModels();
  }, []);

  async function handleToggleModel(modelId: string, isEnabled: boolean) {
    setTogglingModel(modelId);
    try {
      const res = await fetch('/api/admin/models', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modelId, isEnabled }),
      });
      if (res.ok) {
        setAdminModels(prev =>
          prev.map(m => m.id === modelId ? { ...m, isEnabled } : m)
        );
      }
    } catch {
      // silent
    } finally {
      setTogglingModel(null);
    }
  }

  const handlePeriodChange = (p: Period) => {
    setPeriod(p);
  };

  const sortedOrgs = data?.byOrganization ? [...data.byOrganization].sort((a, b) => {
    const aVal = a[orgSort.key];
    const bVal = b[orgSort.key];
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return orgSort.desc ? bVal.localeCompare(aVal) : aVal.localeCompare(bVal);
    }
    return orgSort.desc ? (bVal as number) - (aVal as number) : (aVal as number) - (bVal as number);
  }) : [];

  const handleOrgSort = (key: keyof OrgRow) => {
    setOrgSort(prev => ({
      key,
      desc: prev.key === key ? !prev.desc : true,
    }));
  };

  const SortIcon = ({ columnKey }: { columnKey: keyof OrgRow }) => {
    if (orgSort.key !== columnKey) return null;
    return <span className="ml-1">{orgSort.desc ? '\u2193' : '\u2191'}</span>;
  };

  if (isLoading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-stone">Loading cost data...</div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="p-6">
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
          {error}
          <button
            onClick={() => fetchData(period)}
            className="ml-3 underline hover:no-underline"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const s = data?.summary;
  const topup = data?.topupRevenue;

  return (
    <div>
      <PageHeader
        icon={CurrencyDollarIcon}
        title="Cost & Profitability"
        subtitle="Monitor API costs, credits charged, and platform profitability"
        breadcrumbs={[{ label: 'Admin' }, { label: 'Costs' }]}
        action={
          <div className="flex items-center gap-1 bg-cream-warm rounded-lg border border-stone/10 p-1">
            {PERIODS.map((p) => (
              <button
                key={p.value}
                onClick={() => handlePeriodChange(p.value)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  period === p.value
                    ? 'bg-teal text-white'
                    : 'text-stone hover:text-charcoal hover:bg-cream-warm'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        }
        className="mb-8"
      />

      {isLoading && (
        <div className="mb-4 text-sm text-stone">Refreshing...</div>
      )}

      {/* Summary Cards */}
      {s && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* API Cost */}
          <div className="bg-cream-warm rounded-xl border border-teal/[0.08] shadow-[0_2px_12px_rgba(15,31,29,0.03)] p-5">
            <p className="text-xs font-semibold text-stone uppercase tracking-wider mb-1">API Cost</p>
            <p className="text-2xl font-bold text-charcoal">{formatUSD(s.totalApiCostUSD)}</p>
            <p className="text-sm text-stone mt-1">{formatZAR(s.totalApiCostZAR)}</p>
          </div>

          {/* Credits Charged */}
          <div className="bg-cream-warm rounded-xl border border-teal/[0.08] shadow-[0_2px_12px_rgba(15,31,29,0.03)] p-5">
            <p className="text-xs font-semibold text-stone uppercase tracking-wider mb-1">Credits Charged</p>
            <p className="text-2xl font-bold text-charcoal">{formatNumber(s.totalCreditsCharged)}</p>
            <p className="text-sm text-stone mt-1">
              {formatNumber(s.totalRequests)} requests ({formatNumber(s.freeModelRequests)} free)
            </p>
          </div>

          {/* Revenue */}
          <div className="bg-cream-warm rounded-xl border border-teal/[0.08] shadow-[0_2px_12px_rgba(15,31,29,0.03)] p-5">
            <p className="text-xs font-semibold text-stone uppercase tracking-wider mb-1">Revenue (Credits)</p>
            <p className="text-2xl font-bold text-charcoal">{formatZAR(s.totalRevenueZAR)}</p>
            {topup && topup.count > 0 && (
              <p className="text-sm text-stone mt-1">
                + {formatZAR(topup.totalZAR)} top-ups ({topup.count})
              </p>
            )}
          </div>

          {/* Profit */}
          <div className="bg-cream-warm rounded-xl border border-teal/[0.08] shadow-[0_2px_12px_rgba(15,31,29,0.03)] p-5">
            <p className="text-xs font-semibold text-stone uppercase tracking-wider mb-1">Profit</p>
            <p className={`text-2xl font-bold ${s.profitZAR >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {formatZAR(s.profitZAR)}
            </p>
            <p className={`text-sm mt-1 font-medium ${s.profitMargin >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {s.profitMargin >= 0 ? '+' : ''}{s.profitMargin}% margin
            </p>
          </div>
        </div>
      )}

      {/* AI Provider Connections */}
      <div className="mb-8">
        <AIProviderConnections />
      </div>

      {/* Model Controls — toggle on/off */}
      {adminModels.length > 0 && (
        <div className="mb-8">
          <h2 className="font-serif text-xl font-bold text-charcoal mb-4">
            Model Controls
          </h2>
          <div className="bg-cream-warm rounded-xl border border-teal/[0.08] shadow-[0_2px_12px_rgba(15,31,29,0.03)] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-cream">
                    <th className="text-left px-6 py-4 text-xs font-semibold text-stone uppercase tracking-wider">Model</th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-stone uppercase tracking-wider">Provider</th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-stone uppercase tracking-wider">Type</th>
                    <th className="text-right px-6 py-4 text-xs font-semibold text-stone uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {adminModels.map((m) => (
                    <tr key={m.id} className="border-b border-cream/50 last:border-0">
                      <td className="px-6 py-4 font-medium text-charcoal">{m.name}</td>
                      <td className="px-6 py-4 text-stone capitalize">{m.provider}</td>
                      <td className="px-6 py-4">
                        {m.isFree ? (
                          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600">Free</span>
                        ) : (
                          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-teal/10 text-teal">Paid</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleToggleModel(m.id, !m.isEnabled)}
                          disabled={togglingModel === m.id}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-teal/30 ${
                            m.isEnabled ? 'bg-teal' : 'bg-stone/20'
                          } ${togglingModel === m.id ? 'opacity-50' : ''}`}
                        >
                          <span
                            className={`inline-block h-4 w-4 rounded-full bg-cream-warm shadow-sm transition-transform ${
                              m.isEnabled ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-6 py-3 bg-cream-warm/30 border-t border-cream">
              <p className="text-xs text-stone">Disabled models are hidden from all users across the platform.</p>
            </div>
          </div>
        </div>
      )}

      {/* Organization Breakdown */}
      {sortedOrgs.length > 0 && (
        <div className="mb-8">
          <h2 className="font-serif text-xl font-bold text-charcoal mb-4">
            By Organization
          </h2>
          <div className="bg-cream-warm rounded-xl border border-teal/[0.08] shadow-[0_2px_12px_rgba(15,31,29,0.03)] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-cream">
                    <th
                      className="text-left px-6 py-4 text-xs font-semibold text-stone uppercase tracking-wider cursor-pointer hover:text-charcoal"
                      onClick={() => handleOrgSort('orgName')}
                    >
                      Organization<SortIcon columnKey="orgName" />
                    </th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-stone uppercase tracking-wider">
                      Tier
                    </th>
                    <th
                      className="text-right px-6 py-4 text-xs font-semibold text-stone uppercase tracking-wider cursor-pointer hover:text-charcoal"
                      onClick={() => handleOrgSort('totalCreditsUsed')}
                    >
                      Credits Used<SortIcon columnKey="totalCreditsUsed" />
                    </th>
                    <th
                      className="text-right px-6 py-4 text-xs font-semibold text-stone uppercase tracking-wider cursor-pointer hover:text-charcoal"
                      onClick={() => handleOrgSort('monthlyAllocation')}
                    >
                      Monthly Alloc.<SortIcon columnKey="monthlyAllocation" />
                    </th>
                    <th
                      className="text-right px-6 py-4 text-xs font-semibold text-stone uppercase tracking-wider cursor-pointer hover:text-charcoal"
                      onClick={() => handleOrgSort('apiCostUSD')}
                    >
                      API Cost (USD)<SortIcon columnKey="apiCostUSD" />
                    </th>
                    <th
                      className="text-right px-6 py-4 text-xs font-semibold text-stone uppercase tracking-wider cursor-pointer hover:text-charcoal"
                      onClick={() => handleOrgSort('totalRequests')}
                    >
                      Requests<SortIcon columnKey="totalRequests" />
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedOrgs.map((org) => (
                    <tr key={org.orgId} className="border-b border-cream/50 last:border-0">
                      <td className="px-6 py-4 font-medium text-charcoal">{org.orgName}</td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-teal/10 text-teal">
                          {org.tierName}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-stone">{formatNumber(org.totalCreditsUsed)}</td>
                      <td className="px-6 py-4 text-right text-stone">{formatNumber(org.monthlyAllocation)}</td>
                      <td className="px-6 py-4 text-right text-stone">{formatUSD(org.apiCostUSD)}</td>
                      <td className="px-6 py-4 text-right text-stone">{formatNumber(org.totalRequests)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Model Breakdown */}
      {data?.byModel && data.byModel.length > 0 && (
        <div className="mb-8">
          <h2 className="font-serif text-xl font-bold text-charcoal mb-4">
            By Model
          </h2>
          <div className="bg-cream-warm rounded-xl border border-teal/[0.08] shadow-[0_2px_12px_rgba(15,31,29,0.03)] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-cream">
                    <th className="text-left px-6 py-4 text-xs font-semibold text-stone uppercase tracking-wider">Model</th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-stone uppercase tracking-wider">Provider</th>
                    <th className="text-right px-6 py-4 text-xs font-semibold text-stone uppercase tracking-wider">Requests</th>
                    <th className="text-right px-6 py-4 text-xs font-semibold text-stone uppercase tracking-wider">Input Tokens</th>
                    <th className="text-right px-6 py-4 text-xs font-semibold text-stone uppercase tracking-wider">Output Tokens</th>
                    <th className="text-right px-6 py-4 text-xs font-semibold text-stone uppercase tracking-wider">Credits</th>
                    <th className="text-right px-6 py-4 text-xs font-semibold text-stone uppercase tracking-wider">API Cost (USD)</th>
                  </tr>
                </thead>
                <tbody>
                  {data.byModel.map((m) => (
                    <tr key={m.model} className="border-b border-cream/50 last:border-0">
                      <td className="px-6 py-4">
                        <span className="font-medium text-charcoal">{m.model}</span>
                        {m.isFree && (
                          <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600">
                            Free
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-stone capitalize">{m.provider}</td>
                      <td className="px-6 py-4 text-right text-stone">{formatNumber(m.requests)}</td>
                      <td className="px-6 py-4 text-right text-stone">{formatTokens(m.inputTokens)}</td>
                      <td className="px-6 py-4 text-right text-stone">{formatTokens(m.outputTokens)}</td>
                      <td className="px-6 py-4 text-right text-stone">{formatNumber(m.creditsCharged)}</td>
                      <td className="px-6 py-4 text-right text-stone">{formatUSD(m.apiCostUSD)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Feature Breakdown */}
      {data?.byFeature && data.byFeature.length > 0 && (
        <div className="mb-8">
          <h2 className="font-serif text-xl font-bold text-charcoal mb-4">
            By Feature
          </h2>
          <div className="bg-cream-warm rounded-xl border border-teal/[0.08] shadow-[0_2px_12px_rgba(15,31,29,0.03)] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-cream">
                    <th className="text-left px-6 py-4 text-xs font-semibold text-stone uppercase tracking-wider">Feature</th>
                    <th className="text-right px-6 py-4 text-xs font-semibold text-stone uppercase tracking-wider">Requests</th>
                    <th className="text-right px-6 py-4 text-xs font-semibold text-stone uppercase tracking-wider">Credits</th>
                    <th className="text-right px-6 py-4 text-xs font-semibold text-stone uppercase tracking-wider">API Cost (USD)</th>
                  </tr>
                </thead>
                <tbody>
                  {data.byFeature.map((f) => (
                    <tr key={f.feature} className="border-b border-cream/50 last:border-0">
                      <td className="px-6 py-4 font-medium text-charcoal">
                        {FEATURE_LABELS[f.feature] || f.feature}
                      </td>
                      <td className="px-6 py-4 text-right text-stone">{formatNumber(f.requests)}</td>
                      <td className="px-6 py-4 text-right text-stone">{formatNumber(f.creditsCharged)}</td>
                      <td className="px-6 py-4 text-right text-stone">{formatUSD(f.apiCostUSD)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Empty state */}
      {s && s.totalRequests === 0 && (
        <div className="bg-cream-warm rounded-xl border border-teal/[0.08] p-8 text-center text-stone">
          No AI usage data found for this period.
        </div>
      )}
    </div>
  );
}
