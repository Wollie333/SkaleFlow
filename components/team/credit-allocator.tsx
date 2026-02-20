'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui';
import {
  CurrencyDollarIcon,
  ArrowPathIcon,
  PlusIcon,
  MinusIcon,
  UserIcon,
} from '@heroicons/react/24/outline';

interface OrgBalance {
  monthlyRemaining: number;
  topupRemaining: number;
  totalRemaining: number;
}

interface CreditAllocation {
  id: string;
  user_id: string;
  feature: string;
  credits_allocated: number;
  credits_remaining: number;
  users?: { full_name: string | null; email: string } | null;
}

interface TeamMember {
  userId: string;
  name: string;
  email: string;
}

interface CreditAllocatorProps {
  orgBalance: OrgBalance;
  allocations: CreditAllocation[];
  onAllocate: (userId: string, feature: string, amount: number) => Promise<void>;
  onReclaim: (userId: string, feature: string, amount: number) => Promise<void>;
  members: TeamMember[];
}

const FEATURE_LABELS: Record<string, string> = {
  brand_engine: 'Brand Engine',
  content_engine: 'Content Engine',
  pipeline: 'Pipeline',
  ad_campaigns: 'Ad Campaigns',
};

const FEATURES = ['brand_engine', 'content_engine', 'pipeline', 'ad_campaigns'];

export function CreditAllocator({
  orgBalance,
  allocations,
  onAllocate,
  onReclaim,
  members,
}: CreditAllocatorProps) {
  const [allocatingRow, setAllocatingRow] = useState<string | null>(null);
  const [reclaimingRow, setReclaimingRow] = useState<string | null>(null);
  const [allocateAmount, setAllocateAmount] = useState<number>(100);
  const [reclaimAmount, setReclaimAmount] = useState<number>(100);
  const [processing, setProcessing] = useState(false);

  // Quick allocate state
  const [quickMember, setQuickMember] = useState<string>('');
  const [quickFeature, setQuickFeature] = useState<string>('');
  const [quickAmount, setQuickAmount] = useState<number>(500);
  const [quickProcessing, setQuickProcessing] = useState(false);

  const handleAllocate = async (userId: string, feature: string) => {
    if (allocateAmount <= 0) return;
    setProcessing(true);
    try {
      await onAllocate(userId, feature, allocateAmount);
      setAllocatingRow(null);
      setAllocateAmount(100);
    } finally {
      setProcessing(false);
    }
  };

  const handleReclaim = async (userId: string, feature: string) => {
    if (reclaimAmount <= 0) return;
    setProcessing(true);
    try {
      await onReclaim(userId, feature, reclaimAmount);
      setReclaimingRow(null);
      setReclaimAmount(100);
    } finally {
      setProcessing(false);
    }
  };

  const handleQuickAllocate = async () => {
    if (!quickMember || !quickFeature || quickAmount <= 0) return;
    setQuickProcessing(true);
    try {
      await onAllocate(quickMember, quickFeature, quickAmount);
      setQuickMember('');
      setQuickFeature('');
      setQuickAmount(500);
    } finally {
      setQuickProcessing(false);
    }
  };

  const totalAllocated = allocations.reduce((sum, a) => sum + a.credits_allocated, 0);

  return (
    <div className="space-y-6">
      {/* Org Balance Summary */}
      <div className="bg-cream-warm rounded-xl border border-teal/[0.08] shadow-[0_2px_12px_rgba(15,31,29,0.03)] p-6">
        <div className="flex items-center gap-2 mb-4">
          <CurrencyDollarIcon className="w-5 h-5 text-teal" />
          <h3 className="text-sm font-semibold text-charcoal">Organisation Credit Pool</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-stone mb-0.5">Total Available</p>
            <p className="text-xl font-bold text-teal">{orgBalance.totalRemaining.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-stone mb-0.5">Monthly Remaining</p>
            <p className="text-xl font-bold text-charcoal">{orgBalance.monthlyRemaining.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-stone mb-0.5">Top-up Remaining</p>
            <p className="text-xl font-bold text-charcoal">{orgBalance.topupRemaining.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-stone mb-0.5">Allocated to Team</p>
            <p className="text-xl font-bold text-gold">{totalAllocated.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Quick Allocate */}
      <div className="bg-cream-warm rounded-xl border border-teal/[0.08] shadow-[0_2px_12px_rgba(15,31,29,0.03)] p-6">
        <h3 className="text-sm font-semibold text-charcoal mb-4">Quick Allocate</h3>
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[160px]">
            <label className="text-xs font-medium text-stone mb-1 block">Member</label>
            <select
              value={quickMember}
              onChange={(e) => setQuickMember(e.target.value)}
              className="w-full px-3 py-2 border border-stone/20 rounded-lg text-sm text-charcoal bg-cream-warm focus:outline-none focus:ring-2 focus:ring-teal/30"
            >
              <option value="">Select member...</option>
              {members.map((m) => (
                <option key={m.userId} value={m.userId}>
                  {m.name || m.email}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1 min-w-[140px]">
            <label className="text-xs font-medium text-stone mb-1 block">Feature</label>
            <select
              value={quickFeature}
              onChange={(e) => setQuickFeature(e.target.value)}
              className="w-full px-3 py-2 border border-stone/20 rounded-lg text-sm text-charcoal bg-cream-warm focus:outline-none focus:ring-2 focus:ring-teal/30"
            >
              <option value="">Select feature...</option>
              {FEATURES.map((f) => (
                <option key={f} value={f}>
                  {FEATURE_LABELS[f]}
                </option>
              ))}
            </select>
          </div>

          <div className="w-32">
            <label className="text-xs font-medium text-stone mb-1 block">Credits</label>
            <input
              type="number"
              value={quickAmount}
              onChange={(e) => setQuickAmount(Number(e.target.value))}
              min={1}
              className="w-full px-3 py-2 border border-stone/20 rounded-lg text-sm text-charcoal focus:outline-none focus:ring-2 focus:ring-teal/30"
            />
          </div>

          <Button
            onClick={handleQuickAllocate}
            disabled={!quickMember || !quickFeature || quickAmount <= 0 || quickProcessing}
            isLoading={quickProcessing}
            size="md"
          >
            <PlusIcon className="w-4 h-4" />
            Allocate
          </Button>
        </div>
      </div>

      {/* Allocations Table */}
      <div className="bg-cream-warm rounded-xl border border-teal/[0.08] shadow-[0_2px_12px_rgba(15,31,29,0.03)] overflow-hidden">
        <div className="px-6 py-4 border-b border-stone/10">
          <h3 className="text-sm font-semibold text-charcoal">Credit Allocations</h3>
          <p className="text-xs text-stone mt-0.5">Manage per-member credit allocations by feature</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-stone/10">
                <th className="text-left text-xs font-semibold text-stone uppercase tracking-wider px-6 py-3">
                  Member
                </th>
                <th className="text-left text-xs font-semibold text-stone uppercase tracking-wider px-4 py-3">
                  Feature
                </th>
                <th className="text-right text-xs font-semibold text-stone uppercase tracking-wider px-4 py-3">
                  Allocated
                </th>
                <th className="text-right text-xs font-semibold text-stone uppercase tracking-wider px-4 py-3">
                  Remaining
                </th>
                <th className="text-right text-xs font-semibold text-stone uppercase tracking-wider px-4 py-3">
                  Used
                </th>
                <th className="text-right text-xs font-semibold text-stone uppercase tracking-wider px-6 py-3">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {allocations.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <UserIcon className="w-8 h-8 text-stone/30 mx-auto mb-2" />
                    <p className="text-sm text-stone">No credit allocations yet</p>
                    <p className="text-xs text-stone/60 mt-0.5">Use Quick Allocate above to assign credits</p>
                  </td>
                </tr>
              )}

              {allocations.map((alloc) => {
                const rowId = `${alloc.user_id}-${alloc.feature}`;
                const used = alloc.credits_allocated - alloc.credits_remaining;
                const usagePercent =
                  alloc.credits_allocated > 0
                    ? Math.round((used / alloc.credits_allocated) * 100)
                    : 0;
                const displayName =
                  alloc.users?.full_name || alloc.users?.email || alloc.user_id;
                const isAllocating = allocatingRow === rowId;
                const isReclaiming = reclaimingRow === rowId;

                return (
                  <tr
                    key={alloc.id}
                    className="border-b border-stone/5 hover:bg-cream/30 transition-colors"
                  >
                    <td className="px-6 py-3">
                      <p className="text-sm font-medium text-charcoal">{displayName}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-teal/10 text-teal">
                        {FEATURE_LABELS[alloc.feature] || alloc.feature}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-sm font-medium text-charcoal">
                        {alloc.credits_allocated.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-sm font-medium text-teal">
                        {alloc.credits_remaining.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-2">
                        <span className="text-sm text-stone">{used.toLocaleString()}</span>
                        <div className="w-16 bg-stone/10 rounded-full h-1.5">
                          <div
                            className={cn(
                              'h-1.5 rounded-full transition-all',
                              usagePercent > 80 ? 'bg-red-400' : usagePercent > 50 ? 'bg-gold' : 'bg-teal'
                            )}
                            style={{ width: `${Math.min(usagePercent, 100)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        {isAllocating ? (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              value={allocateAmount}
                              onChange={(e) => setAllocateAmount(Number(e.target.value))}
                              min={1}
                              className="w-20 px-2 py-1 border border-stone/20 rounded text-xs text-charcoal focus:outline-none focus:ring-2 focus:ring-teal/30"
                              autoFocus
                            />
                            <button
                              onClick={() => handleAllocate(alloc.user_id, alloc.feature)}
                              disabled={processing}
                              className="px-2 py-1 text-xs font-medium text-white bg-teal hover:bg-teal/90 rounded disabled:opacity-50 transition-colors"
                            >
                              {processing ? '...' : 'Add'}
                            </button>
                            <button
                              onClick={() => setAllocatingRow(null)}
                              className="px-2 py-1 text-xs font-medium text-stone hover:text-charcoal transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : isReclaiming ? (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              value={reclaimAmount}
                              onChange={(e) => setReclaimAmount(Number(e.target.value))}
                              min={1}
                              max={alloc.credits_remaining}
                              className="w-20 px-2 py-1 border border-stone/20 rounded text-xs text-charcoal focus:outline-none focus:ring-2 focus:ring-teal/30"
                              autoFocus
                            />
                            <button
                              onClick={() => handleReclaim(alloc.user_id, alloc.feature)}
                              disabled={processing}
                              className="px-2 py-1 text-xs font-medium text-white bg-gold hover:bg-gold/90 rounded disabled:opacity-50 transition-colors"
                            >
                              {processing ? '...' : 'Reclaim'}
                            </button>
                            <button
                              onClick={() => setReclaimingRow(null)}
                              className="px-2 py-1 text-xs font-medium text-stone hover:text-charcoal transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <>
                            <button
                              onClick={() => {
                                setAllocatingRow(rowId);
                                setReclaimingRow(null);
                              }}
                              className="p-1.5 rounded-lg text-teal hover:bg-teal/5 transition-colors"
                              title="Allocate more credits"
                            >
                              <PlusIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setReclaimingRow(rowId);
                                setAllocatingRow(null);
                                setReclaimAmount(Math.min(100, alloc.credits_remaining));
                              }}
                              disabled={alloc.credits_remaining <= 0}
                              className="p-1.5 rounded-lg text-gold hover:bg-gold/5 transition-colors disabled:opacity-30"
                              title="Reclaim unused credits"
                            >
                              <MinusIcon className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
