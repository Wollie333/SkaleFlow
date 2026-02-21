'use client';

import { useState } from 'react';

interface Deal {
  id: string;
  title: string;
  status: string;
  value_cents: number;
  probability: number;
  expected_close_date: string | null;
  stage_id: string | null;
  pipeline_id: string | null;
  created_at: string;
}

interface CallDealsPanelProps {
  deals: Deal[];
  linkedDealId: string | null;
  contactId: string | null;
  roomCode: string;
}

function formatZAR(cents: number): string {
  return (cents / 100).toLocaleString('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
  });
}

function statusBadgeClass(status: string): string {
  switch (status) {
    case 'open':
      return 'bg-teal/15 text-teal';
    case 'won':
      return 'bg-green-500/15 text-green-500';
    case 'lost':
      return 'bg-red-500/15 text-red-500';
    default:
      return 'bg-stone/10 text-stone';
  }
}

export function CallDealsPanel({
  deals: initialDeals,
  linkedDealId,
  contactId,
  roomCode,
}: CallDealsPanelProps) {
  const [deals, setDeals] = useState<Deal[]>(initialDeals);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [value, setValue] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!contactId) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
        <div className="w-12 h-12 rounded-full bg-stone/10 flex items-center justify-center mb-3">
          <svg
            className="w-6 h-6 text-stone"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
        </div>
        <p className="text-stone text-sm">
          No contact linked to this call. Link a contact to manage deals.
        </p>
      </div>
    );
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setSubmitting(true);
    setError(null);

    try {
      const valueCents = value ? Math.round(parseFloat(value) * 100) : 0;
      const res = await fetch(`/api/calls/${roomCode}/deals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), valueCents }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to create deal');
      }

      const { deal: newDeal } = await res.json();
      setDeals((prev) => [...prev, newDeal]);
      setTitle('');
      setValue('');
      setShowForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-stone/10 flex items-center justify-between">
        <div>
          <h3 className="text-charcoal font-medium text-sm">Deals</h3>
          <p className="text-stone text-xs mt-0.5">
            {deals.length} deal{deals.length !== 1 ? 's' : ''} linked to this
            contact
          </p>
        </div>
        <button
          onClick={() => setShowForm((prev) => !prev)}
          className="bg-teal text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-teal/90 transition-colors"
        >
          {showForm ? 'Cancel' : 'Create Deal'}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {/* Inline create form */}
        {showForm && (
          <form
            onSubmit={handleCreate}
            className="rounded-xl border border-stone/10 p-5 bg-cream-warm space-y-3"
          >
            <div>
              <label className="text-charcoal text-xs font-medium block mb-1">
                Deal Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Annual subscription"
                required
                className="w-full border border-stone/20 rounded-lg px-3 py-2 text-sm bg-white text-charcoal placeholder:text-stone/50 focus:outline-none focus:border-teal/50"
              />
            </div>
            <div>
              <label className="text-charcoal text-xs font-medium block mb-1">
                Value (ZAR)
              </label>
              <input
                type="number"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="0.00"
                min="0"
                step="0.01"
                className="w-full border border-stone/20 rounded-lg px-3 py-2 text-sm bg-white text-charcoal placeholder:text-stone/50 focus:outline-none focus:border-teal/50"
              />
            </div>
            {error && (
              <p className="text-red-500 text-xs">{error}</p>
            )}
            <button
              type="submit"
              disabled={submitting || !title.trim()}
              className="w-full bg-teal text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-teal/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Creating...' : 'Create Deal'}
            </button>
          </form>
        )}

        {/* Deal cards */}
        {deals.length === 0 && !showForm ? (
          <div className="text-center py-8">
            <p className="text-stone text-sm">No deals yet</p>
            <p className="text-stone/60 text-xs mt-1">
              Create a deal to track this opportunity
            </p>
          </div>
        ) : (
          deals.map((deal) => (
            <div
              key={deal.id}
              className="rounded-xl border border-stone/10 p-5 bg-cream-warm"
            >
              <div className="flex items-start justify-between gap-3">
                <h4 className="text-charcoal text-sm font-medium leading-tight">
                  {deal.title}
                </h4>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium capitalize whitespace-nowrap ${statusBadgeClass(deal.status)}`}
                >
                  {deal.status}
                </span>
              </div>

              <div className="mt-3 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-stone text-xs">Value</span>
                  <span className="text-charcoal text-sm font-semibold">
                    {formatZAR(deal.value_cents)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-stone text-xs">Probability</span>
                  <span className="text-charcoal text-sm font-medium">
                    {deal.probability}%
                  </span>
                </div>
                {deal.expected_close_date && (
                  <div className="flex items-center justify-between">
                    <span className="text-stone text-xs">Expected Close</span>
                    <span className="text-charcoal text-sm">
                      {new Date(deal.expected_close_date).toLocaleDateString(
                        'en-ZA',
                        {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        }
                      )}
                    </span>
                  </div>
                )}
              </div>

              {deal.id === linkedDealId && (
                <div className="mt-3">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-gold/15 text-gold">
                    <svg
                      className="w-3 h-3"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                      />
                    </svg>
                    Linked to this call
                  </span>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
