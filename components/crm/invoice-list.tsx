'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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

const STATUS_CONFIG = {
  draft: { label: 'Draft', color: 'bg-stone-100 text-stone-700' },
  sent: { label: 'Sent', color: 'bg-blue-100 text-blue-700' },
  paid: { label: 'Paid', color: 'bg-green-100 text-green-700' },
  overdue: { label: 'Overdue', color: 'bg-red-100 text-red-700' },
  cancelled: { label: 'Cancelled', color: 'bg-stone-100 text-stone-500 line-through' },
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
      color: 'bg-stone-100 text-stone-700',
    };
    return (
      <Badge variant="default" className={config.color}>
        {config.label}
      </Badge>
    );
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-dark">Invoices</h2>
        <Button
          onClick={() => router.push('/crm/invoices/new')}
          className="bg-teal hover:bg-teal/90"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          New Invoice
        </Button>
      </div>

      {/* Status Tabs */}
      <div className="flex items-center gap-2 border-b border-stone-200">
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
                  : 'border-transparent text-stone-600 hover:text-dark'
              }`}
            >
              {tab.label}
              {count > 0 && (
                <span
                  className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                    statusFilter === tab.key
                      ? 'bg-teal/10 text-teal'
                      : 'bg-stone-100 text-stone-600'
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
        <div className="text-center py-12 text-stone-500">Loading invoices...</div>
      ) : invoices.length === 0 ? (
        <div className="text-center py-12">
          <DocumentTextIcon className="h-12 w-12 mx-auto text-stone-300 mb-4" />
          <p className="text-stone-500 mb-4">No invoices found</p>
          <Button
            onClick={() => router.push('/crm/invoices/new')}
            variant="outline"
            className="border-teal text-teal hover:bg-teal/10"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Create your first invoice
          </Button>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-stone-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-stone-50 border-b border-stone-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
                    Invoice #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
                    Company
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
                    Due Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-stone-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-bold text-dark">{invoice.invoice_number}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-700">
                      {invoice.contact_name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-700">
                      {invoice.company_name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(invoice.status)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-dark">
                      {formatCurrency(invoice.total_cents)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-700">
                      {formatDate(invoice.due_date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-500">
                      {formatDate(invoice.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/crm/invoices/${invoice.id}`)}
                          className="text-teal hover:text-teal/80"
                        >
                          View
                        </Button>
                        <a
                          href={`/api/crm/invoices/${invoice.id}/pdf`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-stone-600 hover:text-dark"
                          >
                            <ArrowDownTrayIcon className="h-4 w-4" />
                          </Button>
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
        <div className="flex items-center justify-between">
          <p className="text-sm text-stone-500">
            Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} invoices
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
            >
              Previous
            </Button>
            <span className="text-sm text-stone-700">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page + 1)}
              disabled={page >= totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
