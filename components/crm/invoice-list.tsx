'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PlusIcon, DocumentTextIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';

interface Invoice {
  id: string;
  invoice_number: string;
  contact_id: string;
  company_id: string | null;
  status: string;
  total_cents: number;
  due_date: string | null;
  created_at: string;
  contact_name?: string;
  company_name?: string;
}

interface InvoiceListProps {
  organizationId: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  draft: { label: 'Draft', color: 'bg-stone/10 text-stone' },
  sent: { label: 'Sent', color: 'bg-blue-500/15 text-blue-400' },
  paid: { label: 'Paid', color: 'bg-green-500/15 text-green-400' },
  overdue: { label: 'Overdue', color: 'bg-red-500/15 text-red-400' },
  cancelled: { label: 'Cancelled', color: 'bg-stone/10 text-stone/60 line-through' },
};

export function InvoiceList({ organizationId }: InvoiceListProps) {
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});

  const limit = 25;

  useEffect(() => {
    fetchInvoices();
  }, [organizationId, page, statusFilter]);

  const fetchInvoices = async () => {
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

      const response = await fetch(`/api/crm/invoices?${params}`);
      if (response.ok) {
        const data = await response.json();
        setInvoices(data.invoices || []);
        setTotal(data.total || 0);
        setStatusCounts(data.statusCounts || {});
      }
    } catch (error) {
      console.error('Failed to fetch invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (cents: number) => {
    return `R${(cents / 100).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    const config = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] || {
      label: status,
      color: 'bg-stone/10 text-stone',
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-end">
        <button
          onClick={() => router.push('/crm/invoices/new')}
          className="flex items-center gap-2 px-4 py-2 bg-teal text-white rounded-lg hover:bg-teal/90 transition-colors font-medium"
        >
          <PlusIcon className="h-5 w-5" />
          New Invoice
        </button>
      </div>

      {/* Status Tabs */}
      <div className="flex items-center gap-2 border-b border-stone/10">
        {[
          { key: 'all', label: 'All' },
          { key: 'draft', label: 'Draft' },
          { key: 'sent', label: 'Sent' },
          { key: 'paid', label: 'Paid' },
          { key: 'overdue', label: 'Overdue' },
        ].map((tab) => {
          const count = tab.key === 'all' ? total : statusCounts[tab.key] || 0;
          return (
            <button
              key={tab.key}
              onClick={() => {
                setStatusFilter(tab.key);
                setPage(1);
              }}
              className={`px-4 py-2 font-medium transition-colors border-b-2 ${
                statusFilter === tab.key
                  ? 'border-teal text-teal'
                  : 'border-transparent text-stone hover:text-charcoal'
              }`}
            >
              {tab.label}
              {count > 0 && (
                <span
                  className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                    statusFilter === tab.key
                      ? 'bg-teal/10 text-teal'
                      : 'bg-cream text-stone'
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal"></div>
        </div>
      ) : invoices.length === 0 ? (
        <div className="text-center py-12">
          <DocumentTextIcon className="h-12 w-12 mx-auto text-stone/30 mb-4" />
          <p className="text-stone mb-4">No invoices found</p>
          <button
            onClick={() => router.push('/crm/invoices/new')}
            className="px-4 py-2 border border-teal text-teal rounded-lg hover:bg-teal/10 transition-colors font-medium"
          >
            Create your first invoice
          </button>
        </div>
      ) : (
        <div className="bg-cream-warm rounded-lg border border-stone/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-cream border-b border-stone/10">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-stone uppercase tracking-wider">
                    Invoice #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-stone uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-stone uppercase tracking-wider">
                    Company
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-stone uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-stone uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-stone uppercase tracking-wider">
                    Due Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-stone uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-stone uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone/10">
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-cream/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-bold text-charcoal">{invoice.invoice_number}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-stone">
                      {invoice.contact_name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-stone">
                      {invoice.company_name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(invoice.status)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-charcoal">
                      {formatCurrency(invoice.total_cents)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-stone">
                      {formatDate(invoice.due_date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-stone">
                      {formatDate(invoice.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => router.push(`/crm/invoices/${invoice.id}`)}
                          className="px-2.5 py-1 text-teal hover:bg-teal/10 rounded-md text-xs font-medium transition-colors"
                        >
                          View
                        </button>
                        <a
                          href={`/api/crm/invoices/${invoice.id}/pdf`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 text-stone hover:text-charcoal hover:bg-cream/50 rounded-md transition-colors"
                        >
                          <ArrowDownTrayIcon className="h-4 w-4" />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 bg-cream-warm rounded-lg border border-stone/10">
          <p className="text-sm text-stone">
            Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} invoices
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
              className="px-3 py-1.5 border border-stone/10 rounded-lg text-sm text-charcoal disabled:opacity-40 disabled:cursor-not-allowed hover:bg-cream/50"
            >
              Previous
            </button>
            <span className="text-sm text-stone">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(page + 1)}
              disabled={page >= totalPages}
              className="px-3 py-1.5 border border-stone/10 rounded-lg text-sm text-charcoal disabled:opacity-40 disabled:cursor-not-allowed hover:bg-cream/50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
