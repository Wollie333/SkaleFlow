'use client';

import { cn } from '@/lib/utils';

interface BudgetConfigProps {
  budgetType: 'daily' | 'lifetime';
  budgetCents: number;
  currency: string;
  startDate: string;
  endDate: string;
  onChange: (data: {
    budgetType?: 'daily' | 'lifetime';
    budgetCents?: number;
    currency?: string;
    startDate?: string;
    endDate?: string;
  }) => void;
}

export function BudgetConfig({
  budgetType,
  budgetCents,
  currency,
  startDate,
  endDate,
  onChange,
}: BudgetConfigProps) {
  const budgetRands = budgetCents / 100;

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-charcoal">
        Budget Configuration
      </label>

      {/* Budget Type Toggle */}
      <div className="flex rounded-xl border border-stone/20 overflow-hidden">
        <button
          type="button"
          onClick={() => onChange({ budgetType: 'daily' })}
          className={cn(
            'flex-1 py-2.5 text-sm font-medium transition-all duration-200',
            budgetType === 'daily'
              ? 'bg-teal text-cream'
              : 'bg-cream-warm text-stone hover:bg-cream-warm/30'
          )}
        >
          Daily Budget
        </button>
        <button
          type="button"
          onClick={() => onChange({ budgetType: 'lifetime' })}
          className={cn(
            'flex-1 py-2.5 text-sm font-medium transition-all duration-200',
            budgetType === 'lifetime'
              ? 'bg-teal text-cream'
              : 'bg-cream-warm text-stone hover:bg-cream-warm/30'
          )}
        >
          Lifetime Budget
        </button>
      </div>

      {/* Amount Input */}
      <div>
        <label className="block text-xs font-medium text-stone mb-1.5">
          Amount ({currency})
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-stone font-medium">
            R
          </span>
          <input
            type="number"
            min={0}
            step={0.01}
            value={budgetRands || ''}
            onChange={(e) => {
              const rands = parseFloat(e.target.value) || 0;
              onChange({ budgetCents: Math.round(rands * 100) });
            }}
            placeholder="0.00"
            className={cn(
              'w-full pl-8 pr-4 py-3 rounded-xl border bg-cream-warm transition-all duration-200',
              'focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal',
              'placeholder:text-stone/60',
              'border-stone/20 hover:border-stone/40'
            )}
          />
        </div>
        <p className="text-xs text-stone mt-1">
          {budgetType === 'daily'
            ? 'Amount to spend per day'
            : 'Total amount for the campaign duration'}
        </p>
      </div>

      {/* Date Range */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-stone mb-1.5">
            Start Date
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => onChange({ startDate: e.target.value })}
            className={cn(
              'w-full px-4 py-3 rounded-xl border bg-cream-warm transition-all duration-200',
              'focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal',
              'border-stone/20 hover:border-stone/40',
              'text-charcoal'
            )}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-stone mb-1.5">
            End Date
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => onChange({ endDate: e.target.value })}
            min={startDate}
            className={cn(
              'w-full px-4 py-3 rounded-xl border bg-cream-warm transition-all duration-200',
              'focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal',
              'border-stone/20 hover:border-stone/40',
              'text-charcoal'
            )}
          />
        </div>
      </div>

      {/* Budget Summary */}
      {budgetCents > 0 && startDate && endDate && (
        <div className="bg-cream-warm/30 rounded-xl p-3 border border-gold/20">
          <p className="text-xs text-charcoal">
            <span className="font-semibold">Budget Summary:</span>{' '}
            {budgetType === 'daily' ? (
              <>
                R{budgetRands.toFixed(2)}/day{' '}
                {startDate && endDate && (
                  <>
                    for{' '}
                    {Math.max(
                      1,
                      Math.ceil(
                        (new Date(endDate).getTime() - new Date(startDate).getTime()) /
                          (1000 * 60 * 60 * 24)
                      )
                    )}{' '}
                    days = R
                    {(
                      budgetRands *
                      Math.max(
                        1,
                        Math.ceil(
                          (new Date(endDate).getTime() - new Date(startDate).getTime()) /
                            (1000 * 60 * 60 * 24)
                        )
                      )
                    ).toFixed(2)}{' '}
                    total
                  </>
                )}
              </>
            ) : (
              <>R{budgetRands.toFixed(2)} total budget</>
            )}
          </p>
        </div>
      )}
    </div>
  );
}
