'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, Button, Badge, PageHeader } from '@/components/ui';
import { CreditBalanceCard } from '@/components/billing/credit-balance-card';
import { InvoiceTemplate } from '@/components/billing/invoice-template';
import { useCreditBalance } from '@/hooks/useCreditBalance';
import { ArrowDownTrayIcon, EyeIcon, XMarkIcon, CreditCardIcon } from '@heroicons/react/24/outline';

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
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [orgName, setOrgName] = useState('');
  const [packs, setPacks] = useState<TopupPack[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [txPage, setTxPage] = useState(1);
  const [txTotalPages, setTxTotalPages] = useState(1);
  const [activeTab, setActiveTab] = useState<'transactions' | 'invoices'>('transactions');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isCheckingOut, setIsCheckingOut] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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

  useEffect(() => {
    if (!organizationId) return;
    loadTransactions();
    loadInvoices();
  }, [organizationId, txPage]);

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

      {/* Tabs: Transactions / Invoices */}
      <div className="mb-4 flex gap-4 border-b border-stone/10">
        <button
          onClick={() => setActiveTab('transactions')}
          className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'transactions'
              ? 'border-teal text-teal'
              : 'border-transparent text-stone hover:text-charcoal'
          }`}
        >
          Transaction History
        </button>
        <button
          onClick={() => setActiveTab('invoices')}
          className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'invoices'
              ? 'border-teal text-teal'
              : 'border-transparent text-stone hover:text-charcoal'
          }`}
        >
          Invoices
        </button>
      </div>

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
                        inv.status === 'failed' ? 'bg-red-100 text-red-600' :
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

      {/* Invoice Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto relative">
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
