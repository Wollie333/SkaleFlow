'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

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
    // TODO: Open deal detail panel or modal
    alert(`Deal ${dealId} clicked - detail view coming soon`);
  }

  function getStatusBadgeColor(status: string) {
    switch (status) {
      case 'open':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'won':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'lost':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-stone-100 text-stone-800 border-stone-200';
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

  return (
    <div className="space-y-4">
      {/* Filter Bar */}
      <div className="flex items-center justify-between gap-4 bg-white p-4 rounded-lg border border-stone-200">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === 'all'
                ? 'bg-dark text-white'
                : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setStatusFilter('open')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === 'open'
                ? 'bg-blue-500 text-white'
                : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
            }`}
          >
            Open
          </button>
          <button
            onClick={() => setStatusFilter('won')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === 'won'
                ? 'bg-green-500 text-white'
                : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
            }`}
          >
            Won
          </button>
          <button
            onClick={() => setStatusFilter('lost')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === 'lost'
                ? 'bg-red-500 text-white'
                : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
            }`}
          >
            Lost
          </button>
        </div>

        <Button onClick={onCreateClick} className="bg-teal text-white hover:bg-teal/90">
          Add Deal
        </Button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-stone-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-stone-500">Loading deals...</div>
        ) : deals.length === 0 ? (
          <div className="p-8 text-center text-stone-500">
            No deals found. Click "Add Deal" to create your first deal.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-stone-50 border-b border-stone-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-stone-700 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-stone-700 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-stone-700 uppercase tracking-wider">
                    Value
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-stone-700 uppercase tracking-wider">
                    Probability
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-stone-700 uppercase tracking-wider">
                    Expected Close
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-stone-700 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {deals.map((deal) => (
                  <tr
                    key={deal.id}
                    onClick={() => handleDealClick(deal.id)}
                    className="hover:bg-stone-50 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-dark">{deal.title}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-stone-700">
                        {deal.crm_contacts
                          ? `${deal.crm_contacts.first_name} ${deal.crm_contacts.last_name}`
                          : '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-dark">
                        {formatCurrency(deal.value_cents)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-stone-700">{deal.probability}%</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-stone-700">
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
          <div className="px-6 py-4 bg-stone-50 border-t border-stone-200 flex items-center justify-between">
            <div className="text-sm text-stone-600">
              Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total}{' '}
              deals
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className="px-3 py-1 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                variant="outline"
              >
                Previous
              </Button>
              <div className="text-sm text-stone-600">
                Page {page} of {totalPages}
              </div>
              <Button
                onClick={() => setPage(page + 1)}
                disabled={page === totalPages}
                className="px-3 py-1 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                variant="outline"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
