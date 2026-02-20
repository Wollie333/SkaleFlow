'use client';

import { useState, useEffect } from 'react';

interface Deal {
  id: string;
  title: string;
  value_cents: number;
  probability: number;
  expected_close_date: string | null;
  status: 'open' | 'won' | 'lost';
  crm_contacts?: {
    first_name: string;
    last_name: string;
  };
}

interface DealListProps {
  organizationId: string;
  onCreateClick: () => void;
  initialContactId?: string;
}

type StatusFilter = 'all' | 'open' | 'won' | 'lost';

export default function DealList({ organizationId, onCreateClick, initialContactId }: DealListProps) {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const limit = 25;
  const totalPages = Math.ceil(total / limit);

  useEffect(() => {
    fetchDeals();
  }, [page, statusFilter, organizationId, initialContactId]);

  async function fetchDeals() {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        organizationId,
        page: page.toString(),
        limit: limit.toString(),
      });

      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }

      if (initialContactId) {
        params.append('contactId', initialContactId);
      }

      const res = await fetch(`/api/crm/deals?${params}`);
      if (!res.ok) throw new Error('Failed to fetch deals');

      const data = await res.json();
      setDeals(data.deals || []);
      setTotal(data.total || 0);
    } catch (error) {
      console.error('Error fetching deals:', error);
      setDeals([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }

  function handleDealClick(dealId: string) {
    alert(`Deal ${dealId} clicked - detail view coming soon`);
  }

  function getStatusBadgeColor(status: string) {
    switch (status) {
      case 'open':
        return 'bg-blue-500/15 text-blue-400 border-blue-500/20';
      case 'won':
        return 'bg-green-500/15 text-green-400 border-green-500/20';
      case 'lost':
        return 'bg-red-500/15 text-red-400 border-red-500/20';
      default:
        return 'bg-stone/10 text-stone border-stone/20';
    }
  }

  function formatCurrency(cents: number): string {
    return `R${(cents / 100).toFixed(2)}`;
  }

  function formatDate(dateString: string | null): string {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  const filterButtons: { key: StatusFilter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'open', label: 'Open' },
    { key: 'won', label: 'Won' },
    { key: 'lost', label: 'Lost' },
  ];

  return (
    <div className="space-y-4">
      {/* Filter Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {filterButtons.map((btn) => (
            <button
              key={btn.key}
              onClick={() => setStatusFilter(btn.key)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                statusFilter === btn.key
                  ? 'bg-teal text-white'
                  : 'bg-cream text-charcoal hover:bg-cream-warm'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>

        <button
          onClick={onCreateClick}
          className="px-4 py-2 bg-teal text-white rounded-lg hover:bg-teal/90 transition-colors font-medium"
        >
          Add Deal
        </button>
      </div>

      {/* Table */}
      <div className="bg-cream-warm rounded-lg border border-stone/10 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal"></div>
          </div>
        ) : deals.length === 0 ? (
          <div className="text-center py-12 text-stone">
            No deals found. Click "Add Deal" to create your first deal.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-cream border-b border-stone/10">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-stone uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-stone uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-stone uppercase tracking-wider">
                    Value
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-stone uppercase tracking-wider">
                    Probability
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-stone uppercase tracking-wider">
                    Expected Close
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-stone uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone/10">
                {deals.map((deal) => (
                  <tr
                    key={deal.id}
                    onClick={() => handleDealClick(deal.id)}
                    className="hover:bg-cream/50 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-charcoal">{deal.title}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-stone">
                        {deal.crm_contacts
                          ? `${deal.crm_contacts.first_name} ${deal.crm_contacts.last_name}`
                          : '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-charcoal">
                        {formatCurrency(deal.value_cents)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-stone">{deal.probability}%</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-stone">
                        {formatDate(deal.expected_close_date)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusBadgeColor(
                          deal.status
                        )}`}
                      >
                        {deal.status.charAt(0).toUpperCase() + deal.status.slice(1)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="px-6 py-4 bg-cream border-t border-stone/10 flex items-center justify-between">
            <div className="text-sm text-stone">
              Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total}{' '}
              deals
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className="px-3 py-1.5 border border-stone/10 rounded-lg text-sm text-charcoal disabled:opacity-40 disabled:cursor-not-allowed hover:bg-cream/50"
              >
                Previous
              </button>
              <div className="text-sm text-stone">
                Page {page} of {totalPages}
              </div>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page === totalPages}
                className="px-3 py-1.5 border border-stone/10 rounded-lg text-sm text-charcoal disabled:opacity-40 disabled:cursor-not-allowed hover:bg-cream/50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
