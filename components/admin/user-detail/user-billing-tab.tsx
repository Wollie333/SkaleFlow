'use client';

import { Button } from '@/components/ui';
import {
  PlayIcon,
  PauseIcon,
  XMarkIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';

interface SubscriptionTier {
  id: string;
  name: string;
  slug: string;
  sort_order: number;
}

interface SubscriptionData {
  id: string;
  status: string;
  tier_id: string;
  tier: {
    id: string;
    name: string;
    slug: string;
    monthly_credits: number;
  } | null;
}

interface CreditData {
  monthly_balance: number;
  topup_balance: number;
  total_balance: number;
  period_start: string;
  period_end: string;
}

interface Transaction {
  id: string;
  transaction_type: string;
  credits_amount: number;
  description: string;
  created_at: string;
}

interface Invoice {
  id: string;
  invoice_number: string;
  type: string;
  status: string;
  subtotal: number;
  tax_amount: number;
  total: number;
  currency: string;
  created_at: string;
}

interface UserBillingTabProps {
  subscription: SubscriptionData | null;
  credits: CreditData | null;
  transactions: Transaction[];
  invoices: Invoice[];
  tiers: SubscriptionTier[];
  onPauseSubscription: () => void;
  onCancelSubscription: () => void;
  onReactivateSubscription: () => void;
  onChangeTier: (tierId: string) => void;
  actionLoading: boolean;
  tierLoading: boolean;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-ZA', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatCurrency(amount: number, currency = 'ZAR') {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount / 100);
}

const statusBadge: Record<string, { label: string; classes: string }> = {
  active: { label: 'Active', classes: 'bg-emerald-50 text-emerald-600' },
  trial: { label: 'Trial', classes: 'bg-blue-50 text-blue-600' },
  paused: { label: 'Paused', classes: 'bg-amber-50 text-amber-600' },
  cancelled: { label: 'Cancelled', classes: 'bg-red-50 text-red-600' },
  expired: { label: 'Expired', classes: 'bg-stone/10 text-stone' },
};

const txTypeBadge: Record<string, { label: string; classes: string }> = {
  monthly_allocation: { label: 'Monthly', classes: 'bg-blue-50 text-blue-600' },
  ai_usage_deduction: { label: 'AI Usage', classes: 'bg-amber-50 text-amber-600' },
  topup_purchase: { label: 'Top-Up', classes: 'bg-emerald-50 text-emerald-600' },
  admin_adjustment: { label: 'Adjustment', classes: 'bg-purple-50 text-purple-600' },
  monthly_reset: { label: 'Reset', classes: 'bg-stone/10 text-stone' },
};

const invoiceStatusBadge: Record<string, { label: string; classes: string }> = {
  paid: { label: 'Paid', classes: 'bg-emerald-50 text-emerald-600' },
  pending: { label: 'Pending', classes: 'bg-amber-50 text-amber-600' },
  overdue: { label: 'Overdue', classes: 'bg-red-50 text-red-600' },
  cancelled: { label: 'Cancelled', classes: 'bg-stone/10 text-stone' },
};

export function UserBillingTab({
  subscription,
  credits,
  transactions,
  invoices,
  tiers,
  onPauseSubscription,
  onCancelSubscription,
  onReactivateSubscription,
  onChangeTier,
  actionLoading,
  tierLoading,
}: UserBillingTabProps) {
  const subStatus = subscription?.status || 'none';
  const badge = statusBadge[subStatus] || { label: subStatus, classes: 'bg-stone/10 text-stone' };

  return (
    <div className="space-y-6">
      {/* Subscription Management */}
      <div className="bg-white rounded-xl border border-teal/[0.08] shadow-[0_2px_12px_rgba(15,31,29,0.03)] p-5">
        <h3 className="font-serif text-lg font-bold text-charcoal mb-4">Subscription</h3>

        {subscription ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg font-bold text-charcoal">
                    {subscription.tier?.name || 'No Tier'}
                  </span>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${badge.classes}`}>
                    {badge.label}
                  </span>
                </div>
                {subscription.tier && (
                  <p className="text-sm text-stone">
                    {subscription.tier.monthly_credits.toLocaleString('en-ZA')} credits/month
                  </p>
                )}
              </div>

              {/* Tier change dropdown */}
              <select
                value={subscription.tier_id || ''}
                onChange={(e) => onChangeTier(e.target.value)}
                disabled={tierLoading}
                className="text-sm border border-cream rounded-lg px-2.5 py-2 bg-white text-charcoal focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal disabled:opacity-50 cursor-pointer"
              >
                <option value="">No tier</option>
                {tiers.map(tier => (
                  <option key={tier.id} value={tier.id}>{tier.name}</option>
                ))}
              </select>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 pt-3 border-t border-cream">
              {(subStatus === 'active' || subStatus === 'trial') && (
                <>
                  <Button
                    onClick={onPauseSubscription}
                    disabled={actionLoading}
                    className="bg-amber-50 hover:bg-amber-100 text-amber-600 text-sm px-4 py-2 flex items-center gap-1.5"
                  >
                    <PauseIcon className="w-4 h-4" />
                    Pause
                  </Button>
                  <Button
                    onClick={onCancelSubscription}
                    disabled={actionLoading}
                    className="bg-red-50 hover:bg-red-100 text-red-600 text-sm px-4 py-2 flex items-center gap-1.5"
                  >
                    <XMarkIcon className="w-4 h-4" />
                    Cancel
                  </Button>
                </>
              )}
              {subStatus === 'paused' && (
                <>
                  <Button
                    onClick={onReactivateSubscription}
                    disabled={actionLoading}
                    className="bg-teal hover:bg-teal-light text-white text-sm px-4 py-2 flex items-center gap-1.5"
                  >
                    <PlayIcon className="w-4 h-4" />
                    Reactivate
                  </Button>
                  <Button
                    onClick={onCancelSubscription}
                    disabled={actionLoading}
                    className="bg-red-50 hover:bg-red-100 text-red-600 text-sm px-4 py-2 flex items-center gap-1.5"
                  >
                    <XMarkIcon className="w-4 h-4" />
                    Cancel
                  </Button>
                </>
              )}
              {subStatus === 'cancelled' && (
                <Button
                  onClick={onReactivateSubscription}
                  disabled={actionLoading}
                  className="bg-teal hover:bg-teal-light text-white text-sm px-4 py-2 flex items-center gap-1.5"
                >
                  <PlayIcon className="w-4 h-4" />
                  Reactivate
                </Button>
              )}
            </div>
          </div>
        ) : (
          <p className="text-sm text-stone">No subscription</p>
        )}
      </div>

      {/* Credit Balance */}
      {credits && (
        <div>
          <h3 className="font-serif text-lg font-bold text-charcoal mb-4">Credit Balance</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl border border-teal/[0.08] shadow-[0_2px_12px_rgba(15,31,29,0.03)] p-5">
              <p className="text-xs font-semibold text-stone uppercase tracking-wider mb-1">Monthly</p>
              <p className="text-2xl font-bold text-charcoal">{credits.monthly_balance.toLocaleString('en-ZA')}</p>
              {credits.period_end && (
                <p className="text-xs text-stone mt-1">Resets {formatDate(credits.period_end)}</p>
              )}
            </div>
            <div className="bg-white rounded-xl border border-teal/[0.08] shadow-[0_2px_12px_rgba(15,31,29,0.03)] p-5">
              <p className="text-xs font-semibold text-stone uppercase tracking-wider mb-1">Top-up</p>
              <p className="text-2xl font-bold text-charcoal">{credits.topup_balance.toLocaleString('en-ZA')}</p>
              <p className="text-xs text-stone mt-1">Never expires</p>
            </div>
            <div className="bg-white rounded-xl border border-teal/[0.08] shadow-[0_2px_12px_rgba(15,31,29,0.03)] p-5">
              <p className="text-xs font-semibold text-stone uppercase tracking-wider mb-1">Total Available</p>
              <p className="text-2xl font-bold text-teal">{credits.total_balance.toLocaleString('en-ZA')}</p>
            </div>
          </div>
        </div>
      )}

      {/* Transaction History */}
      <div className="bg-white rounded-xl border border-teal/[0.08] shadow-[0_2px_12px_rgba(15,31,29,0.03)] overflow-hidden">
        <div className="px-5 py-4 border-b border-cream">
          <h3 className="font-serif text-lg font-bold text-charcoal">Transaction History</h3>
        </div>

        {transactions.length === 0 ? (
          <div className="p-8 text-center text-stone text-sm">No transactions</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-cream">
                <th className="text-left px-5 py-3 text-xs font-semibold text-stone uppercase tracking-wider">Type</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-stone uppercase tracking-wider">Description</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-stone uppercase tracking-wider">Credits</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-stone uppercase tracking-wider">Date</th>
              </tr>
            </thead>
            <tbody>
              {transactions.slice(0, 20).map((tx) => {
                const txBadge = txTypeBadge[tx.transaction_type] || { label: tx.transaction_type, classes: 'bg-stone/10 text-stone' };
                const isPositive = tx.credits_amount > 0;

                return (
                  <tr key={tx.id} className="border-b border-cream/50 last:border-0">
                    <td className="px-5 py-3">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${txBadge.classes}`}>
                        {txBadge.label}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-sm text-charcoal truncate max-w-[250px]">
                      {tx.description}
                    </td>
                    <td className={`px-5 py-3 text-sm font-medium text-right ${isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
                      {isPositive ? '+' : ''}{tx.credits_amount.toLocaleString('en-ZA')}
                    </td>
                    <td className="px-5 py-3 text-sm text-stone text-right">{formatDate(tx.created_at)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Invoices */}
      <div className="bg-white rounded-xl border border-teal/[0.08] shadow-[0_2px_12px_rgba(15,31,29,0.03)] overflow-hidden">
        <div className="px-5 py-4 border-b border-cream">
          <h3 className="font-serif text-lg font-bold text-charcoal">Invoices</h3>
        </div>

        {invoices.length === 0 ? (
          <div className="p-8 text-center text-stone text-sm">No invoices</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-cream">
                <th className="text-left px-5 py-3 text-xs font-semibold text-stone uppercase tracking-wider">Invoice #</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-stone uppercase tracking-wider">Type</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-stone uppercase tracking-wider">Status</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-stone uppercase tracking-wider">Total</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-stone uppercase tracking-wider">Date</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-stone uppercase tracking-wider"></th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice) => {
                const invBadge = invoiceStatusBadge[invoice.status] || { label: invoice.status, classes: 'bg-stone/10 text-stone' };

                return (
                  <tr key={invoice.id} className="border-b border-cream/50 last:border-0">
                    <td className="px-5 py-3 text-sm text-charcoal font-medium">{invoice.invoice_number}</td>
                    <td className="px-5 py-3 text-sm text-stone capitalize">{invoice.type.replace('_', ' ')}</td>
                    <td className="px-5 py-3">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${invBadge.classes}`}>
                        {invBadge.label}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-sm text-charcoal font-medium text-right">
                      {formatCurrency(invoice.total, invoice.currency)}
                    </td>
                    <td className="px-5 py-3 text-sm text-stone text-right">{formatDate(invoice.created_at)}</td>
                    <td className="px-5 py-3 text-right">
                      <a
                        href={`/api/billing/invoices/${invoice.id}/pdf`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-medium text-teal hover:text-teal-light flex items-center gap-1 justify-end"
                      >
                        <DocumentTextIcon className="w-3.5 h-3.5" />
                        PDF
                      </a>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
