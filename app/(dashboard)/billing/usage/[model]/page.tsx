'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, PageHeader } from '@/components/ui';
import { ArrowLeftIcon, CpuChipIcon } from '@heroicons/react/24/outline';

interface UserRow {
  userId: string;
  userName: string;
  requests: number;
  creditsCharged: number;
  inputTokens: number;
  outputTokens: number;
}

interface LogEntry {
  id: string;
  feature: string;
  userName: string;
  inputTokens: number;
  outputTokens: number;
  creditsCharged: number;
  isFree: boolean;
  createdAt: string;
}

interface UsageData {
  summary: { totalRequests: number; totalCredits: number; freeRequests: number };
  byUser: UserRow[];
  byFeature: Array<{ feature: string; requests: number; creditsCharged: number }>;
  recentLogs: LogEntry[];
}

type Period = '7d' | '30d' | '90d' | 'all';

const PERIODS: { value: Period; label: string }[] = [
  { value: '7d', label: '7 Days' },
  { value: '30d', label: '30 Days' },
  { value: '90d', label: '90 Days' },
  { value: 'all', label: 'All Time' },
];

const FEATURE_LABELS: Record<string, string> = {
  brand_chat: 'Brand Engine',
  brand_engine: 'Brand Engine',
  brand_import: 'Brand Import',
  content_generation: 'Content Generation',
  logo_generation: 'Logo Generation',
  ad_generation: 'Ad Generation',
};

function formatTokens(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return n.toString();
}

function formatNumber(n: number): string {
  return n.toLocaleString('en-ZA');
}

export default function ModelUsagePage() {
  const params = useParams();
  const router = useRouter();
  const modelKey = decodeURIComponent(params.model as string);

  const supabase = createClient();
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [data, setData] = useState<UsageData | null>(null);
  const [period, setPeriod] = useState<Period>('30d');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadOrg() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: membership } = await supabase
        .from('org_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .single();
      if (membership) setOrganizationId(membership.organization_id);
    }
    loadOrg();
  }, []);

  useEffect(() => {
    if (!organizationId) return;
    async function fetchUsage() {
      setIsLoading(true);
      try {
        const res = await fetch(
          `/api/billing/usage?organizationId=${organizationId}&period=${period}&model=${encodeURIComponent(modelKey)}`
        );
        if (res.ok) {
          setData(await res.json());
        }
      } catch {
        // silent
      } finally {
        setIsLoading(false);
      }
    }
    fetchUsage();
  }, [organizationId, period, modelKey]);

  const s = data?.summary;

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <button
        onClick={() => router.push('/billing')}
        className="flex items-center gap-1.5 text-sm text-stone hover:text-charcoal mb-4 transition-colors"
      >
        <ArrowLeftIcon className="w-4 h-4" />
        Back to Billing
      </button>

      <PageHeader
        title={modelKey.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
        subtitle="Detailed usage breakdown for this model"
        className="mb-6"
      />

      {/* Period Filter */}
      <div className="flex items-center gap-1 mb-6 bg-cream-warm rounded-lg border border-stone/10 p-1 w-fit">
        {PERIODS.map((p) => (
          <button
            key={p.value}
            onClick={() => setPeriod(p.value)}
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

      {isLoading && !data ? (
        <div className="animate-pulse space-y-4">
          <div className="h-24 bg-stone/10 rounded-xl" />
          <div className="h-60 bg-stone/10 rounded-xl" />
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          {s && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              <div className="bg-cream-warm rounded-xl border border-stone/10 p-5">
                <p className="text-xs font-semibold text-stone uppercase tracking-wider mb-1">Total Requests</p>
                <p className="text-2xl font-bold text-charcoal">{formatNumber(s.totalRequests)}</p>
                {s.freeRequests > 0 && (
                  <p className="text-sm text-stone mt-1">{formatNumber(s.freeRequests)} free</p>
                )}
              </div>
              <div className="bg-cream-warm rounded-xl border border-stone/10 p-5">
                <p className="text-xs font-semibold text-stone uppercase tracking-wider mb-1">Credits Used</p>
                <p className="text-2xl font-bold text-charcoal">{formatNumber(s.totalCredits)}</p>
              </div>
              <div className="bg-cream-warm rounded-xl border border-stone/10 p-5">
                <p className="text-xs font-semibold text-stone uppercase tracking-wider mb-1">Unique Users</p>
                <p className="text-2xl font-bold text-charcoal">{formatNumber(data?.byUser?.length || 0)}</p>
              </div>
            </div>
          )}

          {/* By User */}
          {data?.byUser && data.byUser.length > 0 && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-charcoal mb-3">By User</h2>
              <Card className="overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="bg-cream-warm text-left">
                      <th className="px-5 py-3 text-xs font-semibold text-stone uppercase tracking-wider">User</th>
                      <th className="px-5 py-3 text-xs font-semibold text-stone uppercase tracking-wider text-right">Requests</th>
                      <th className="px-5 py-3 text-xs font-semibold text-stone uppercase tracking-wider text-right">Input Tokens</th>
                      <th className="px-5 py-3 text-xs font-semibold text-stone uppercase tracking-wider text-right">Output Tokens</th>
                      <th className="px-5 py-3 text-xs font-semibold text-stone uppercase tracking-wider text-right">Credits</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone/5">
                    {data.byUser.map((u) => (
                      <tr key={u.userId} className="hover:bg-cream-warm/50">
                        <td className="px-5 py-3 text-sm font-medium text-charcoal">{u.userName}</td>
                        <td className="px-5 py-3 text-sm text-stone text-right">{formatNumber(u.requests)}</td>
                        <td className="px-5 py-3 text-sm text-stone text-right">{formatTokens(u.inputTokens)}</td>
                        <td className="px-5 py-3 text-sm text-stone text-right">{formatTokens(u.outputTokens)}</td>
                        <td className="px-5 py-3 text-sm text-stone text-right">{formatNumber(u.creditsCharged)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            </div>
          )}

          {/* By Feature */}
          {data?.byFeature && data.byFeature.length > 0 && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-charcoal mb-3">By Feature</h2>
              <Card className="overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="bg-cream-warm text-left">
                      <th className="px-5 py-3 text-xs font-semibold text-stone uppercase tracking-wider">Feature</th>
                      <th className="px-5 py-3 text-xs font-semibold text-stone uppercase tracking-wider text-right">Requests</th>
                      <th className="px-5 py-3 text-xs font-semibold text-stone uppercase tracking-wider text-right">Credits</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone/5">
                    {data.byFeature.map((f) => (
                      <tr key={f.feature} className="hover:bg-cream-warm/50">
                        <td className="px-5 py-3 text-sm font-medium text-charcoal">
                          {FEATURE_LABELS[f.feature] || f.feature}
                        </td>
                        <td className="px-5 py-3 text-sm text-stone text-right">{formatNumber(f.requests)}</td>
                        <td className="px-5 py-3 text-sm text-stone text-right">{formatNumber(f.creditsCharged)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            </div>
          )}

          {/* Recent Request Log */}
          {data?.recentLogs && data.recentLogs.length > 0 && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-charcoal mb-3">Recent Requests</h2>
              <Card className="overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="bg-cream-warm text-left">
                      <th className="px-5 py-3 text-xs font-semibold text-stone uppercase tracking-wider">Time</th>
                      <th className="px-5 py-3 text-xs font-semibold text-stone uppercase tracking-wider">User</th>
                      <th className="px-5 py-3 text-xs font-semibold text-stone uppercase tracking-wider">Feature</th>
                      <th className="px-5 py-3 text-xs font-semibold text-stone uppercase tracking-wider text-right">Input</th>
                      <th className="px-5 py-3 text-xs font-semibold text-stone uppercase tracking-wider text-right">Output</th>
                      <th className="px-5 py-3 text-xs font-semibold text-stone uppercase tracking-wider text-right">Credits</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone/5">
                    {data.recentLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-cream-warm/50">
                        <td className="px-5 py-3 text-xs text-stone">
                          {new Date(log.createdAt).toLocaleString('en-ZA', {
                            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                          })}
                        </td>
                        <td className="px-5 py-3 text-sm text-charcoal">{log.userName}</td>
                        <td className="px-5 py-3">
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-teal/10 text-teal">
                            {FEATURE_LABELS[log.feature] || log.feature}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-xs text-stone text-right font-mono">{formatTokens(log.inputTokens)}</td>
                        <td className="px-5 py-3 text-xs text-stone text-right font-mono">{formatTokens(log.outputTokens)}</td>
                        <td className="px-5 py-3 text-sm text-right font-medium text-charcoal">
                          {log.isFree ? (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600">Free</span>
                          ) : (
                            formatNumber(log.creditsCharged)
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            </div>
          )}

          {/* Empty state */}
          {s && s.totalRequests === 0 && (
            <div className="bg-cream-warm rounded-xl border border-stone/10 p-12 text-center">
              <CpuChipIcon className="w-12 h-12 text-stone/30 mx-auto mb-3" />
              <p className="text-stone">No usage data for this model in the selected period.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
