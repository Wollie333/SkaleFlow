'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, Button, Badge, PageHeader } from '@/components/ui';
import { CreditBalanceCard } from '@/components/billing/credit-balance-card';
import { InvoiceTemplate } from '@/components/billing/invoice-template';
import { useCreditBalance } from '@/hooks/useCreditBalance';
import { ArrowDownTrayIcon, EyeIcon, XMarkIcon, CreditCardIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

interface TopupPack {
  id: string;
  name: string;
  slug: string;
  credits: number;
  price_cents: number;
  description: string | null;
}

interface Transaction {
  id: string;
  transaction_type: string;
  credits_amount: number;
  credits_before: number;
  credits_after: number;
  source: string | null;
  description: string | null;
  created_at: string;
}

interface Invoice {
  id: string;
  invoice_number: string;
  invoice_type: string;
  status: string;
  subtotal_cents: number;
  vat_cents: number;
  total_cents: number;
  line_items: Array<{ description: string; quantity: number; unit_price_cents: number; total_cents: number }>;
  billing_name: string | null;
  billing_email: string | null;
  credits_granted: number;
  created_at: string;
  paystack_reference: string | null;
}

interface ModelUsageRow {
  modelKey: string;
  modelName: string;
  provider: string;
  isFree: boolean;
  requests: number;
  inputTokens: number;
  outputTokens: number;
  creditsCharged: number;
}

interface FeatureUsageRow {
  feature: string;
  requests: number;
  creditsCharged: number;
}

interface UsageData {
  summary: { totalRequests: number; totalCredits: number; freeRequests: number };
  byModel: ModelUsageRow[];
  byFeature: FeatureUsageRow[];
}

type UsagePeriod = '7d' | '30d' | '90d' | 'all';

const USAGE_PERIODS: { value: UsagePeriod; label: string }[] = [
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

function formatZAR(cents: number): string {
  return `R${(cents / 100).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
}

const TRANSACTION_TYPE_LABELS: Record<string, { label: string; color: string }> = {
  monthly_allocation: { label: 'Monthly Allocation', color: 'bg-teal/10 text-teal' },
  monthly_reset: { label: 'Monthly Reset', color: 'bg-stone/10 text-stone' },
  topup_purchase: { label: 'Top-Up Purchase', color: 'bg-gold/10 text-gold' },
  ai_usage_deduction: { label: 'AI Usage', color: 'bg-charcoal/10 text-charcoal' },
  refund: { label: 'Refund', color: 'bg-teal/10 text-teal' },
  admin_adjustment: { label: 'Adjustment', color: 'bg-stone/10 text-stone' },
};

export default function BillingPage() {
  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab') as 'usage' | 'transactions' | 'invoices' | 'admin' | null;

  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [orgName, setOrgName] = useState('');
  const [packs, setPacks] = useState<TopupPack[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [txPage, setTxPage] = useState(1);
  const [txTotalPages, setTxTotalPages] = useState(1);
  const [activeTab, setActiveTab] = useState<'usage' | 'transactions' | 'invoices' | 'admin'>(tabParam || 'usage');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isCheckingOut, setIsCheckingOut] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [usageData, setUsageData] = useState<UsageData | null>(null);
  const [usagePeriod, setUsagePeriod] = useState<UsagePeriod>('30d');
  const [usageLoading, setUsageLoading] = useState(false);

  const { balance, refetch: refetchBalance } = useCreditBalance(organizationId);

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: membership } = await supabase
        .from('org_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .single();

      if (!membership) return;
      setOrganizationId(membership.organization_id);

      const { data: org } = await supabase
        .from('organizations')
        .select('name')
        .eq('id', membership.organization_id)
        .single();

      setOrgName(org?.name || '');

      // Load topup packs
      const { data: packsData } = await supabase
        .from('credit_topup_packs')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

      setPacks(packsData || []);
      setIsLoading(false);
    }

    loadData();
  }, []);

  // Sync activeTab with URL parameter
  useEffect(() => {
    if (tabParam && ['usage', 'transactions', 'invoices', 'admin'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  useEffect(() => {
    if (!organizationId) return;
    loadTransactions();
    loadInvoices();
  }, [organizationId, txPage]);

  const handleTabChange = (tab: 'usage' | 'transactions' | 'invoices' | 'admin') => {
    setActiveTab(tab);
    const params = new URLSearchParams(searchParams.toString());
    if (tab === 'usage') {
      params.delete('tab');
    } else {
      params.set('tab', tab);
    }
    const queryString = params.toString();
    router.push(queryString ? `/billing?${queryString}` : '/billing', { scroll: false });
  };

  async function loadTransactions() {
    if (!organizationId) return;
    const res = await fetch(`/api/billing/transactions?organizationId=${organizationId}&page=${txPage}`);
    if (res.ok) {
      const data = await res.json();
      setTransactions(data.transactions);
      setTxTotalPages(data.totalPages);
    }
  }

  async function loadInvoices() {
    if (!organizationId) return;
    const res = await fetch(`/api/billing/invoices?organizationId=${organizationId}`);
    if (res.ok) {
      const data = await res.json();
      setInvoices(data.invoices);
    }
  }

  useEffect(() => {
    if (!organizationId) return;
    async function fetchUsage() {
      setUsageLoading(true);
      try {
        const res = await fetch(`/api/billing/usage?organizationId=${organizationId}&period=${usagePeriod}`);
        if (res.ok) {
          setUsageData(await res.json());
        }
      } catch {
        // silent
      } finally {
        setUsageLoading(false);
      }
    }
    fetchUsage();
  }, [organizationId, usagePeriod]);

  async function handleBuyPack(packSlug: string) {
    if (!organizationId) return;
    setIsCheckingOut(packSlug);

    try {
      const res = await fetch('/api/billing/topup/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packSlug, organizationId }),
      });

      if (res.ok) {
        const { authorizationUrl } = await res.json();
        window.location.href = authorizationUrl;
      } else {
        const { error } = await res.json();
        alert(error || 'Failed to start checkout');
      }
    } catch {
      alert('Failed to start checkout');
    } finally {
      setIsCheckingOut(null);
    }
  }

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-stone/10 rounded w-48" />
          <div className="h-40 bg-stone/10 rounded" />
          <div className="h-60 bg-stone/10 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <PageHeader
        icon={CreditCardIcon}
        title="Billing"
        subtitle="Manage your subscription and credits"
        className="mb-6"
      />

      {/* Credit Balance */}
      {balance && (
        <div className="mb-8">
          <CreditBalanceCard
            monthlyRemaining={balance.monthlyRemaining}
            monthlyTotal={balance.monthlyTotal}
            topupRemaining={balance.topupRemaining}
            periodEnd={balance.periodEnd}
            isSuperAdmin={balance.isSuperAdmin}
            apiCostUSD30d={balance.apiCostUSD30d}
            apiCostUSDAllTime={balance.apiCostUSDAllTime}
            systemTotalCredits={balance.systemTotalCredits}
            systemTotalCostUSD={balance.systemTotalCostUSD}
          />
        </div>
      )}

      {/* Top-Up Packs */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-charcoal mb-4">Top-Up Packs</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {packs.map((pack) => (
            <Card key={pack.id} className="p-5 flex flex-col">
              <h3 className="font-semibold text-charcoal">{pack.name}</h3>
              <p className="text-sm text-stone mt-1 flex-1">{pack.description}</p>
              <div className="mt-4">
                <p className="text-2xl font-bold text-teal">{pack.credits.toLocaleString()}</p>
                <p className="text-xs text-stone">credits</p>
              </div>
              <div className="mt-2 mb-4">
                <p className="text-lg font-semibold text-charcoal">{formatZAR(pack.price_cents)}</p>
              </div>
              <Button
                onClick={() => handleBuyPack(pack.slug)}
                disabled={isCheckingOut === pack.slug}
                className="w-full"
              >
                {isCheckingOut === pack.slug ? 'Loading...' : 'Buy Now'}
              </Button>
            </Card>
          ))}
        </div>
      </div>

      {/* Tabs: Usage / Transactions / Invoices / Admin */}
      <div className="mb-4 flex gap-4 border-b border-stone/10 overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
        <button
          onClick={() => handleTabChange('usage')}
          className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex-shrink-0 ${
            activeTab === 'usage'
              ? 'border-teal text-teal'
              : 'border-transparent text-stone hover:text-charcoal'
          }`}
        >
          AI Usage
        </button>
        <button
          onClick={() => handleTabChange('transactions')}
          className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex-shrink-0 ${
            activeTab === 'transactions'
              ? 'border-teal text-teal'
              : 'border-transparent text-stone hover:text-charcoal'
          }`}
        >
          Transaction History
        </button>
        <button
          onClick={() => handleTabChange('invoices')}
          className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex-shrink-0 ${
            activeTab === 'invoices'
              ? 'border-teal text-teal'
              : 'border-transparent text-stone hover:text-charcoal'
          }`}
        >
          Invoices
        </button>
        {balance?.isSuperAdmin && (
          <button
            onClick={() => handleTabChange('admin')}
            className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex-shrink-0 ${
              activeTab === 'admin'
                ? 'border-gold text-gold'
                : 'border-transparent text-stone hover:text-charcoal'
            }`}
          >
            🔐 Platform Management
          </button>
        )}
      </div>

      {activeTab === 'usage' && (
        <div className="space-y-6">
          {/* Period Filter */}
          <div className="flex items-center gap-1 bg-cream-warm rounded-lg border border-stone/10 p-1 w-fit">
            {USAGE_PERIODS.map((p) => (
              <button
                key={p.value}
                onClick={() => setUsagePeriod(p.value)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  usagePeriod === p.value
                    ? 'bg-teal text-white'
                    : 'text-stone hover:text-charcoal hover:bg-cream-warm'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Summary */}
          {usageData?.summary && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-cream-warm rounded-xl border border-stone/10 p-5">
                <p className="text-xs font-semibold text-stone uppercase tracking-wider mb-1">Total Requests</p>
                <p className="text-2xl font-bold text-charcoal">{usageData.summary.totalRequests.toLocaleString()}</p>
                {usageData.summary.freeRequests > 0 && (
                  <p className="text-sm text-stone mt-1">{usageData.summary.freeRequests.toLocaleString()} free</p>
                )}
              </div>
              <div className="bg-cream-warm rounded-xl border border-stone/10 p-5">
                <p className="text-xs font-semibold text-stone uppercase tracking-wider mb-1">Credits Used</p>
                <p className="text-2xl font-bold text-charcoal">{usageData.summary.totalCredits.toLocaleString()}</p>
              </div>
              <div className="bg-cream-warm rounded-xl border border-stone/10 p-5">
                <p className="text-xs font-semibold text-stone uppercase tracking-wider mb-1">Models Used</p>
                <p className="text-2xl font-bold text-charcoal">{usageData.byModel?.length || 0}</p>
              </div>
            </div>
          )}

          {/* By Model — clickable rows */}
          {usageData?.byModel && usageData.byModel.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-charcoal mb-3 uppercase tracking-wider">By Model</h3>
              <Card className="overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="bg-cream-warm text-left">
                      <th className="px-5 py-3 text-xs font-semibold text-stone uppercase tracking-wider">Model</th>
                      <th className="px-5 py-3 text-xs font-semibold text-stone uppercase tracking-wider">Provider</th>
                      <th className="px-5 py-3 text-xs font-semibold text-stone uppercase tracking-wider text-right">Requests</th>
                      <th className="px-5 py-3 text-xs font-semibold text-stone uppercase tracking-wider text-right">Tokens</th>
                      <th className="px-5 py-3 text-xs font-semibold text-stone uppercase tracking-wider text-right">Credits</th>
                      <th className="px-5 py-3 w-8"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone/5">
                    {usageData.byModel.map((m) => (
                      <tr
                        key={m.modelKey}
                        onClick={() => router.push(`/billing/usage/${encodeURIComponent(m.modelKey)}`)}
                        className="hover:bg-teal/5 cursor-pointer transition-colors group"
                      >
                        <td className="px-5 py-3.5">
                          <span className="text-sm font-medium text-charcoal group-hover:text-teal transition-colors">{m.modelName}</span>
                          {m.isFree && (
                            <span className="ml-2 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600">
                              Free
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-sm text-stone capitalize">{m.provider}</td>
                        <td className="px-5 py-3.5 text-sm text-stone text-right">{m.requests.toLocaleString()}</td>
                        <td className="px-5 py-3.5 text-sm text-stone text-right">
                          {formatTokens(m.inputTokens + m.outputTokens)}
                        </td>
                        <td className="px-5 py-3.5 text-sm font-medium text-charcoal text-right">
                          {m.isFree ? (
                            <span className="text-xs text-emerald-600">Free</span>
                          ) : (
                            m.creditsCharged.toLocaleString()
                          )}
                        </td>
                        <td className="px-3 py-3.5">
                          <ChevronRightIcon className="w-4 h-4 text-stone/40 group-hover:text-teal transition-colors" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            </div>
          )}

          {/* By Feature */}
          {usageData?.byFeature && usageData.byFeature.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-charcoal mb-3 uppercase tracking-wider">By Feature</h3>
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
                    {usageData.byFeature.map((f) => (
                      <tr key={f.feature} className="hover:bg-cream-warm/50">
                        <td className="px-5 py-3 text-sm font-medium text-charcoal">
                          {FEATURE_LABELS[f.feature] || f.feature}
                        </td>
                        <td className="px-5 py-3 text-sm text-stone text-right">{f.requests.toLocaleString()}</td>
                        <td className="px-5 py-3 text-sm font-medium text-charcoal text-right">{f.creditsCharged.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            </div>
          )}

          {/* Empty state */}
          {usageData?.summary?.totalRequests === 0 && !usageLoading && (
            <Card className="p-12 text-center">
              <p className="text-stone">No AI usage data for this period.</p>
            </Card>
          )}

          {usageLoading && !usageData && (
            <div className="animate-pulse space-y-4">
              <div className="h-24 bg-stone/10 rounded-xl" />
              <div className="h-48 bg-stone/10 rounded-xl" />
            </div>
          )}
        </div>
      )}

      {activeTab === 'transactions' && (
        <Card className="overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-cream-warm text-left">
                <th className="px-4 py-3 text-xs font-semibold text-stone uppercase tracking-wider">Date</th>
                <th className="px-4 py-3 text-xs font-semibold text-stone uppercase tracking-wider">Type</th>
                <th className="px-4 py-3 text-xs font-semibold text-stone uppercase tracking-wider">Description</th>
                <th className="px-4 py-3 text-xs font-semibold text-stone uppercase tracking-wider text-right">Credits</th>
                <th className="px-4 py-3 text-xs font-semibold text-stone uppercase tracking-wider text-right">Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone/5">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-stone">
                    No transactions yet
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => {
                  const typeInfo = TRANSACTION_TYPE_LABELS[tx.transaction_type] || { label: tx.transaction_type, color: 'bg-stone/10 text-stone' };
                  return (
                    <tr key={tx.id} className="hover:bg-cream-warm/50">
                      <td className="px-4 py-3 text-sm text-charcoal">
                        {new Date(tx.created_at).toLocaleDateString('en-ZA', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${typeInfo.color}`}>
                          {typeInfo.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-stone">{tx.description || tx.source || 'â€”'}</td>
                      <td className={`px-4 py-3 text-sm font-medium text-right ${
                        tx.credits_amount > 0 ? 'text-teal' : 'text-charcoal'
                      }`}>
                        {tx.credits_amount > 0 ? '+' : ''}{tx.credits_amount.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-charcoal">
                        {tx.credits_after.toLocaleString()}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

          {/* Pagination */}
          {txTotalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-stone/10">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setTxPage(p => Math.max(1, p - 1))}
                disabled={txPage <= 1}
              >
                Previous
              </Button>
              <span className="text-sm text-stone">Page {txPage} of {txTotalPages}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setTxPage(p => Math.min(txTotalPages, p + 1))}
                disabled={txPage >= txTotalPages}
              >
                Next
              </Button>
            </div>
          )}
        </Card>
      )}

      {activeTab === 'invoices' && (
        <>
        {invoices.length > 0 && (
          <div className="mb-4 flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (organizationId) {
                  window.location.href = `/api/billing/invoices/bulk-pdf?organizationId=${organizationId}`;
                }
              }}
            >
              <ArrowDownTrayIcon className="w-4 h-4 mr-1.5 inline-block" />
              Download All as ZIP
            </Button>
          </div>
        )}
        <Card className="overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-cream-warm text-left">
                <th className="px-4 py-3 text-xs font-semibold text-stone uppercase tracking-wider">Invoice #</th>
                <th className="px-4 py-3 text-xs font-semibold text-stone uppercase tracking-wider">Date</th>
                <th className="px-4 py-3 text-xs font-semibold text-stone uppercase tracking-wider">Type</th>
                <th className="px-4 py-3 text-xs font-semibold text-stone uppercase tracking-wider text-right">Amount</th>
                <th className="px-4 py-3 text-xs font-semibold text-stone uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-xs font-semibold text-stone uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone/5">
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-stone">
                    No invoices yet
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-cream-warm/50">
                    <td className="px-4 py-3 text-sm font-medium text-charcoal">{inv.invoice_number}</td>
                    <td className="px-4 py-3 text-sm text-charcoal">
                      {new Date(inv.created_at).toLocaleDateString('en-ZA', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-medium px-2 py-1 rounded-full bg-stone/10 text-stone capitalize">
                        {inv.invoice_type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-charcoal text-right">
                      {formatZAR(inv.total_cents)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full capitalize ${
                        inv.status === 'paid' ? 'bg-teal/10 text-teal' :
                        inv.status === 'failed' ? 'bg-red-500/10 text-red-600' :
                        'bg-stone/10 text-stone'
                      }`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedInvoice(inv)}
                          className="p-1.5 hover:bg-cream-warm rounded-lg transition-colors"
                          title="View"
                        >
                          <EyeIcon className="w-4 h-4 text-stone" />
                        </button>
                        <a
                          href={`/api/billing/invoices/${inv.id}/pdf`}
                          className="p-1.5 hover:bg-cream-warm rounded-lg transition-colors"
                          title="Download PDF"
                        >
                          <ArrowDownTrayIcon className="w-4 h-4 text-stone" />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </Card>
        </>
      )}

      {activeTab === 'admin' && balance?.isSuperAdmin && (
        <div className="space-y-6">
          {/* Platform Overview */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-charcoal mb-4 flex items-center gap-2">
              <span>📊</span>
              <span>Platform Overview</span>
            </h3>

            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-gradient-to-br from-red-50 to-red-100 border border-red-200">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold text-red-900">💸 Real API Costs</h4>
                  <Badge variant="default" className="bg-cream-warm/50">What You Pay</Badge>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
                  <div>
                    <p className="text-xs text-red-400">Last 30 Days</p>
                    <p className="text-2xl font-bold text-red-900">${(balance.apiCostUSD30d || 0).toFixed(4)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-red-400">All Time</p>
                    <p className="text-2xl font-bold text-red-900">${(balance.apiCostUSDAllTime || 0).toFixed(4)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-red-400">Avg Per Day</p>
                    <p className="text-2xl font-bold text-red-900">
                      ${((balance.apiCostUSD30d || 0) / 30).toFixed(4)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-red-400">Projected/Month</p>
                    <p className="text-2xl font-bold text-red-900">
                      ${((balance.apiCostUSD30d || 0) * 1).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold text-emerald-900">💰 Sales Revenue Potential</h4>
                  <Badge variant="default" className="bg-cream-warm/50">100% Markup</Badge>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
                  <div>
                    <p className="text-xs text-emerald-700">Last 30 Days</p>
                    <p className="text-2xl font-bold text-emerald-900">
                      ${((balance.apiCostUSD30d || 0) * 2).toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-emerald-700">All Time</p>
                    <p className="text-2xl font-bold text-emerald-900">
                      ${((balance.apiCostUSDAllTime || 0) * 2).toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-emerald-700">Avg Per Day</p>
                    <p className="text-2xl font-bold text-emerald-900">
                      ${(((balance.apiCostUSD30d || 0) / 30) * 2).toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-emerald-700">Projected/Month</p>
                    <p className="text-2xl font-bold text-emerald-900">
                      ${((balance.apiCostUSD30d || 0) * 2).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-gradient-to-br from-gold/20 to-gold/30 border border-gold/40">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold text-charcoal">📈 Profit Margin</h4>
                  <Badge variant="default" className="bg-cream-warm/50">Revenue - Cost</Badge>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
                  <div>
                    <p className="text-xs text-stone">Last 30 Days</p>
                    <p className="text-2xl font-bold text-charcoal">
                      ${(balance.apiCostUSD30d || 0).toFixed(2)}
                    </p>
                    <p className="text-xs text-teal font-semibold mt-1">+100%</p>
                  </div>
                  <div>
                    <p className="text-xs text-stone">All Time</p>
                    <p className="text-2xl font-bold text-charcoal">
                      ${(balance.apiCostUSDAllTime || 0).toFixed(2)}
                    </p>
                    <p className="text-xs text-teal font-semibold mt-1">+100%</p>
                  </div>
                  <div>
                    <p className="text-xs text-stone">Avg Per Day</p>
                    <p className="text-2xl font-bold text-charcoal">
                      ${((balance.apiCostUSD30d || 0) / 30).toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-stone">Projected/Month</p>
                    <p className="text-2xl font-bold text-charcoal">
                      ${(balance.apiCostUSD30d || 0).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 rounded-lg bg-amber-50 border border-amber-200">
              <div className="flex items-start gap-3">
                <span className="text-2xl">💡</span>
                <div className="flex-1">
                  <h5 className="text-sm font-semibold text-amber-900 mb-1">Markup Strategy</h5>
                  <p className="text-xs text-amber-800 leading-relaxed">
                    All credit costs include a <strong>100% markup</strong> (2x multiplier) over actual API costs.
                    This means for every $1.00 spent on API calls, users pay $2.00 in credits.
                    Your profit margin is exactly 50% of revenue (or 100% of cost).
                  </p>
                  <p className="text-xs text-amber-800 mt-2 leading-relaxed">
                    <strong>Example:</strong> If a user spends 1,800 credits ($1.00), the actual API cost is $0.50, leaving $0.50 profit.
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Credit Management Controls */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-charcoal mb-4 flex items-center gap-2">
              <span>⚙️</span>
              <span>Credit Management</span>
            </h3>

            <div className="space-y-4">
              <div className="p-4 rounded-lg border border-stone/15">
                <h4 className="text-sm font-semibold text-charcoal mb-2">Super Admin Privileges</h4>
                <div className="space-y-2 text-sm text-stone">
                  <div className="flex items-center gap-2">
                    <Badge variant="default" className="bg-teal text-white">Active</Badge>
                    <span>Unlimited AI usage (credits not deducted)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="default" className="bg-teal text-white">Tracking</Badge>
                    <span>Real API costs tracked for financial reporting</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="default" className="bg-teal text-white">Access</Badge>
                    <span>Full visibility of cost vs revenue metrics</span>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-lg border border-stone/15">
                <h4 className="text-sm font-semibold text-charcoal mb-2">Platform Configuration</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-cream-warm rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-charcoal">Markup Multiplier</p>
                      <p className="text-xs text-stone">Applied to all API costs</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-teal">2.0x</p>
                      <p className="text-xs text-stone">100% markup</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-cream-warm rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-charcoal">Exchange Rate</p>
                      <p className="text-xs text-stone">ZAR per USD</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-teal">R18.00</p>
                      <p className="text-xs text-stone">1 credit = R0.01</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-cream-warm rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-charcoal">Credit Calculation</p>
                      <p className="text-xs text-stone">Formula</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-mono text-charcoal">cost_usd × 18 × 2 × 100</p>
                      <p className="text-xs text-stone">Rounded up to nearest credit</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                <div className="flex items-start gap-3">
                  <span className="text-xl">ℹ️</span>
                  <div className="flex-1">
                    <h5 className="text-sm font-semibold text-blue-900 mb-1">Quick Reference</h5>
                    <div className="text-xs text-blue-400 space-y-1">
                      <p>• <strong>1 credit</strong> = 1 ZAR cent = $0.000556 (sales price)</p>
                      <p>• <strong>1,800 credits</strong> = R18.00 = $1.00 (sales price)</p>
                      <p>• <strong>Actual API cost</strong> = sales price ÷ 2</p>
                      <p>• <strong>Your profit</strong> = sales price - API cost = 50% of revenue</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Quick Actions */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-charcoal mb-4 flex items-center gap-2">
              <span>⚡</span>
              <span>Quick Actions</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Button
                variant="outline"
                className="h-auto py-4 flex flex-col items-start gap-2"
                onClick={() => router.push('/admin/organizations')}
              >
                <span className="text-lg">🏢</span>
                <div className="text-left">
                  <p className="font-semibold">Manage Organizations</p>
                  <p className="text-xs text-stone">View all orgs & credit balances</p>
                </div>
              </Button>
              <Button
                variant="outline"
                className="h-auto py-4 flex flex-col items-start gap-2"
                onClick={() => handleTabChange('usage')}
              >
                <span className="text-lg">📊</span>
                <div className="text-left">
                  <p className="font-semibold">View Usage Analytics</p>
                  <p className="text-xs text-stone">Detailed API usage breakdown</p>
                </div>
              </Button>
              <Button
                variant="outline"
                className="h-auto py-4 flex flex-col items-start gap-2"
                onClick={() => handleTabChange('transactions')}
              >
                <span className="text-lg">💳</span>
                <div className="text-left">
                  <p className="font-semibold">Transaction History</p>
                  <p className="text-xs text-stone">All credit transactions</p>
                </div>
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Invoice Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-cream-warm rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto relative">
            <button
              onClick={() => setSelectedInvoice(null)}
              className="absolute top-4 right-4 p-1 hover:bg-stone/10 rounded-lg"
            >
              <XMarkIcon className="w-5 h-5 text-stone" />
            </button>
            <InvoiceTemplate invoice={selectedInvoice} orgName={orgName} />
          </div>
        </div>
      )}
    </div>
  );
}
