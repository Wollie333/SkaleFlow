'use client';

import { BanknotesIcon, CheckCircleIcon, ClockIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface FinancialSummaryBarProps {
  totalCommitted: number;
  totalPaid: number;
  totalPending: number;
  totalOverdue: number;
  currency?: string;
}

export function FinancialSummaryBar({
  totalCommitted,
  totalPaid,
  totalPending,
  totalOverdue,
  currency = 'ZAR',
}: FinancialSummaryBarProps) {
  const format = (value: number) =>
    `R ${value.toLocaleString('en-ZA', { minimumFractionDigits: 0 })}`;

  if (totalCommitted === 0 && totalPaid === 0 && totalPending === 0 && totalOverdue === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-6 px-4 py-3 bg-cream-warm border border-stone/10 rounded-xl shadow-sm mb-4">
      <div className="flex items-center gap-2">
        <BanknotesIcon className="w-4 h-4 text-charcoal" />
        <div>
          <p className="text-[10px] text-stone uppercase tracking-wider font-semibold">Committed</p>
          <p className="text-sm font-semibold text-charcoal">{format(totalCommitted)}</p>
        </div>
      </div>

      <div className="w-px h-8 bg-stone/15" />

      <div className="flex items-center gap-2">
        <CheckCircleIcon className="w-4 h-4 text-green-500" />
        <div>
          <p className="text-[10px] text-stone uppercase tracking-wider font-semibold">Paid</p>
          <p className="text-sm font-semibold text-green-600">{format(totalPaid)}</p>
        </div>
      </div>

      <div className="w-px h-8 bg-stone/15" />

      <div className="flex items-center gap-2">
        <ClockIcon className="w-4 h-4 text-amber-500" />
        <div>
          <p className="text-[10px] text-stone uppercase tracking-wider font-semibold">Pending</p>
          <p className="text-sm font-semibold text-amber-600">{format(totalPending)}</p>
        </div>
      </div>

      {totalOverdue > 0 && (
        <>
          <div className="w-px h-8 bg-stone/15" />
          <div className="flex items-center gap-2">
            <ExclamationTriangleIcon className="w-4 h-4 text-red-500" />
            <div>
              <p className="text-[10px] text-stone uppercase tracking-wider font-semibold">Overdue</p>
              <p className="text-sm font-semibold text-red-600">{format(totalOverdue)}</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
