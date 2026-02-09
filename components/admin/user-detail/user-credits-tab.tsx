'use client';

interface FeatureUsage {
  feature: string;
  label: string;
  credits_charged: number;
  request_count: number;
}

interface CreditBalance {
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
  description: string | null;
  created_at: string;
}

interface UserCreditsTabProps {
  credits: CreditBalance | null;
  creditsByFeature: FeatureUsage[];
  transactions: Transaction[];
  monthlyAllocation: number;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-ZA', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

const TX_TYPE_LABELS: Record<string, { label: string; color: string }> = {
  monthly_allocation: { label: 'Monthly Allocation', color: 'bg-teal/10 text-teal' },
  monthly_reset: { label: 'Monthly Reset', color: 'bg-stone/10 text-stone' },
  topup_purchase: { label: 'Top-Up Purchase', color: 'bg-gold/10 text-gold' },
  ai_usage_deduction: { label: 'AI Usage', color: 'bg-charcoal/10 text-charcoal' },
  refund: { label: 'Refund', color: 'bg-teal/10 text-teal' },
  admin_adjustment: { label: 'Adjustment', color: 'bg-stone/10 text-stone' },
};

export function UserCreditsTab({
  credits,
  creditsByFeature,
  transactions,
  monthlyAllocation,
}: UserCreditsTabProps) {
  const totalCreditsUsed = creditsByFeature.reduce((sum, f) => sum + f.credits_charged, 0);
  const totalRequests = creditsByFeature.reduce((sum, f) => sum + f.request_count, 0);

  return (
    <div className="space-y-6">
      {/* Credit Balance Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-teal/[0.08] shadow-[0_2px_12px_rgba(15,31,29,0.03)] p-5">
          <p className="text-xs font-semibold text-stone uppercase tracking-wider mb-1">Monthly Balance</p>
          <p className="text-2xl font-bold text-charcoal">
            {credits ? credits.monthly_balance.toLocaleString('en-ZA') : '—'}
          </p>
          <p className="text-sm text-stone mt-1">
            of {monthlyAllocation.toLocaleString('en-ZA')} allocated
          </p>
        </div>

        <div className="bg-white rounded-xl border border-teal/[0.08] shadow-[0_2px_12px_rgba(15,31,29,0.03)] p-5">
          <p className="text-xs font-semibold text-stone uppercase tracking-wider mb-1">Top-Up Balance</p>
          <p className="text-2xl font-bold text-charcoal">
            {credits ? credits.topup_balance.toLocaleString('en-ZA') : '—'}
          </p>
          <p className="text-sm text-stone mt-1">Never expires</p>
        </div>

        <div className="bg-white rounded-xl border border-teal/[0.08] shadow-[0_2px_12px_rgba(15,31,29,0.03)] p-5">
          <p className="text-xs font-semibold text-stone uppercase tracking-wider mb-1">Total Used</p>
          <p className="text-2xl font-bold text-charcoal">{totalCreditsUsed.toLocaleString('en-ZA')}</p>
          <p className="text-sm text-stone mt-1">
            {totalRequests.toLocaleString('en-ZA')} AI requests
          </p>
        </div>
      </div>

      {/* Feature Breakdown */}
      <div className="bg-white rounded-xl border border-teal/[0.08] shadow-[0_2px_12px_rgba(15,31,29,0.03)] overflow-hidden">
        <div className="px-5 py-4 border-b border-cream">
          <h3 className="font-serif text-lg font-bold text-charcoal">Usage by Feature</h3>
        </div>
        {creditsByFeature.length === 0 ? (
          <div className="p-8 text-center text-stone text-sm">No usage recorded yet</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-cream">
                <th className="text-left px-5 py-3 text-xs font-semibold text-stone uppercase tracking-wider">Feature</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-stone uppercase tracking-wider">Credits</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-stone uppercase tracking-wider">Requests</th>
              </tr>
            </thead>
            <tbody>
              {creditsByFeature.map((f) => (
                <tr key={f.feature} className="border-b border-cream/50 last:border-0">
                  <td className="px-5 py-3 text-sm font-medium text-charcoal">{f.label}</td>
                  <td className="px-5 py-3 text-sm text-stone text-right">{f.credits_charged.toLocaleString('en-ZA')}</td>
                  <td className="px-5 py-3 text-sm text-stone text-right">{f.request_count.toLocaleString('en-ZA')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-xl border border-teal/[0.08] shadow-[0_2px_12px_rgba(15,31,29,0.03)] overflow-hidden">
        <div className="px-5 py-4 border-b border-cream">
          <h3 className="font-serif text-lg font-bold text-charcoal">Recent Transactions</h3>
        </div>
        {transactions.length === 0 ? (
          <div className="p-8 text-center text-stone text-sm">No transactions yet</div>
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
              {transactions.map((tx) => {
                const typeInfo = TX_TYPE_LABELS[tx.transaction_type] || { label: tx.transaction_type, color: 'bg-stone/10 text-stone' };
                return (
                  <tr key={tx.id} className="border-b border-cream/50 last:border-0">
                    <td className="px-5 py-3">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${typeInfo.color}`}>
                        {typeInfo.label}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-sm text-stone truncate max-w-[200px]">
                      {tx.description || '—'}
                    </td>
                    <td className={`px-5 py-3 text-sm font-medium text-right ${
                      tx.credits_amount > 0 ? 'text-emerald-600' : 'text-charcoal'
                    }`}>
                      {tx.credits_amount > 0 ? '+' : ''}{tx.credits_amount.toLocaleString('en-ZA')}
                    </td>
                    <td className="px-5 py-3 text-sm text-stone text-right">{formatDate(tx.created_at)}</td>
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
