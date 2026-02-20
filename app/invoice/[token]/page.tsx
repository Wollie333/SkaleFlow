'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';

interface InvoiceData {
  id: string;
  invoice_number: string;
  issue_date: string;
  due_date: string;
  status: string;
  subtotal: number;
  tax: number;
  total: number;
  notes: string | null;
  organization: {
    name: string;
    logo_url: string | null;
  };
  contact: {
    first_name: string;
    last_name: string;
    email: string;
    company?: {
      name: string;
    };
  };
  line_items: Array<{
    id: string;
    description: string;
    quantity: number;
    unit_price: number;
    amount: number;
  }>;
}

export default function PublicInvoicePage() {
  const params = useParams();
  const token = params.token as string;

  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;

    const fetchInvoice = async () => {
      try {
        const res = await fetch(`/api/crm/invoices/share/${token}`);
        if (!res.ok) {
          if (res.status === 404) {
            setError('Invoice not found');
          } else {
            setError('Failed to load invoice');
          }
          return;
        }
        const data = await res.json();
        setInvoice(data);
      } catch (err) {
        console.error('Error fetching invoice:', err);
        setError('Failed to load invoice');
      } finally {
        setLoading(false);
      }
    };

    fetchInvoice();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-pulse bg-gray-100 rounded-xl h-96 w-full max-w-4xl mx-4" />
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Invoice Not Found</h1>
          <p className="text-gray-600">{error || 'The invoice you are looking for does not exist or has been removed.'}</p>
        </div>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-sm p-8">
          {/* Header */}
          <div className="flex justify-between items-start mb-8">
            <div>
              {invoice.organization.logo_url && (
                <img
                  src={invoice.organization.logo_url}
                  alt={invoice.organization.name}
                  className="h-12 mb-4"
                />
              )}
              <h1 className="text-3xl font-bold text-gray-900">{invoice.organization.name}</h1>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Invoice Number</p>
              <p className="text-xl font-semibold text-gray-900">{invoice.invoice_number}</p>
            </div>
          </div>

          {/* Billing Info */}
          <div className="grid grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Bill To:</h3>
              <p className="text-gray-900 font-medium">
                {invoice.contact.first_name} {invoice.contact.last_name}
              </p>
              {invoice.contact.company && (
                <p className="text-gray-600">{invoice.contact.company.name}</p>
              )}
              <p className="text-gray-600">{invoice.contact.email}</p>
            </div>
            <div className="text-right">
              <div className="mb-2">
                <p className="text-sm text-gray-600">Issue Date</p>
                <p className="text-gray-900">{formatDate(invoice.issue_date)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Due Date</p>
                <p className="text-gray-900 font-semibold">{formatDate(invoice.due_date)}</p>
              </div>
            </div>
          </div>

          {/* Line Items */}
          <div className="mb-8">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-stone/10">
                  <th className="text-left py-3 text-sm font-semibold text-gray-700">Description</th>
                  <th className="text-right py-3 text-sm font-semibold text-gray-700">Quantity</th>
                  <th className="text-right py-3 text-sm font-semibold text-gray-700">Unit Price</th>
                  <th className="text-right py-3 text-sm font-semibold text-gray-700">Amount</th>
                </tr>
              </thead>
              <tbody>
                {invoice.line_items.map((item) => (
                  <tr key={item.id} className="border-b border-stone/10">
                    <td className="py-4 text-gray-900">{item.description}</td>
                    <td className="py-4 text-right text-gray-900">{item.quantity}</td>
                    <td className="py-4 text-right text-gray-900">{formatCurrency(item.unit_price)}</td>
                    <td className="py-4 text-right text-gray-900 font-medium">{formatCurrency(item.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="flex justify-end mb-8">
            <div className="w-64">
              <div className="flex justify-between py-2">
                <span className="text-gray-600">Subtotal</span>
                <span className="text-gray-900">{formatCurrency(invoice.subtotal)}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-600">Tax</span>
                <span className="text-gray-900">{formatCurrency(invoice.tax)}</span>
              </div>
              <div className="flex justify-between py-3 border-t-2 border-stone/10">
                <span className="text-lg font-bold text-gray-900">Total</span>
                <span className="text-lg font-bold text-gray-900">{formatCurrency(invoice.total)}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {invoice.notes && (
            <div className="mb-8">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Notes</h3>
              <p className="text-gray-600 whitespace-pre-wrap">{invoice.notes}</p>
            </div>
          )}

          {/* Download Button */}
          <div className="flex justify-center">
            <a
              href={`/api/crm/invoices/share/${token}?pdf=true`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-6 py-3 bg-teal text-white rounded-lg hover:bg-teal/90 transition-colors"
            >
              <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
              Download PDF
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
