'use client';

import { useState } from 'react';
import {
  PaperAirplaneIcon,
  CheckCircleIcon,
  ShareIcon,
  ArrowDownTrayIcon,
  TrashIcon,
  ClipboardIcon,
} from '@heroicons/react/24/outline';

interface InvoiceStatusActionsProps {
  invoiceId: string;
  status: string;
  shareToken: string | null;
  onStatusChange: () => void;
}

export function InvoiceStatusActions({
  invoiceId,
  status,
  shareToken: initialShareToken,
  onStatusChange,
}: InvoiceStatusActionsProps) {
  const [loading, setLoading] = useState(false);
  const [shareToken, setShareToken] = useState(initialShareToken);
  const [copied, setCopied] = useState(false);

  const handleMarkAsSent = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/crm/invoices/${invoiceId}/send`, {
        method: 'POST',
      });
      if (response.ok) {
        onStatusChange();
      }
    } catch (error) {
      console.error('Failed to mark as sent:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsPaid = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/crm/invoices/${invoiceId}/pay`, {
        method: 'POST',
      });
      if (response.ok) {
        onStatusChange();
      }
    } catch (error) {
      console.error('Failed to mark as paid:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateShareLink = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/crm/invoices/${invoiceId}/share`, {
        method: 'POST',
      });
      if (response.ok) {
        const data = await response.json();
        setShareToken(data.shareToken);
      }
    } catch (error) {
      console.error('Failed to generate share link:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyShareLink = () => {
    if (shareToken) {
      const url = `${window.location.origin}/invoice/${shareToken}`;
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this invoice? This action cannot be undone.')) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/crm/invoices/${invoiceId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        window.location.href = '/crm/invoices';
      }
    } catch (error) {
      console.error('Failed to delete invoice:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {/* Primary action based on status */}
      {status === 'draft' && (
        <button
          onClick={handleMarkAsSent}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 bg-teal text-white rounded-lg hover:bg-teal/90 transition-colors font-medium text-sm disabled:opacity-50"
        >
          <PaperAirplaneIcon className="h-4 w-4" />
          Mark as Sent
        </button>
      )}

      {status === 'sent' && (
        <button
          onClick={handleMarkAsPaid}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm disabled:opacity-50"
        >
          <CheckCircleIcon className="h-4 w-4" />
          Mark as Paid
        </button>
      )}

      {status === 'paid' && (
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-500/15 text-green-400 rounded-lg font-medium text-sm">
          <CheckCircleIcon className="h-4 w-4" />
          Paid
        </div>
      )}

      {/* Share link — for sent/paid */}
      {(status === 'sent' || status === 'paid') && (
        <>
          {!shareToken ? (
            <button
              onClick={handleGenerateShareLink}
              disabled={loading}
              className="inline-flex items-center gap-2 px-3 py-2 border border-stone/10 text-charcoal rounded-lg hover:bg-cream/50 transition-colors text-sm disabled:opacity-50"
            >
              <ShareIcon className="h-4 w-4" />
              Share
            </button>
          ) : (
            <button
              onClick={handleCopyShareLink}
              className={`inline-flex items-center gap-2 px-3 py-2 border border-stone/10 rounded-lg transition-colors text-sm ${
                copied ? 'text-green-400 border-green-500/20' : 'text-charcoal hover:bg-cream/50'
              }`}
            >
              <ClipboardIcon className="h-4 w-4" />
              {copied ? 'Copied!' : 'Copy Link'}
            </button>
          )}
        </>
      )}

      {/* PDF download — always */}
      <a
        href={`/api/crm/invoices/${invoiceId}/pdf`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 px-3 py-2 border border-stone/10 text-charcoal rounded-lg hover:bg-cream/50 transition-colors text-sm"
      >
        <ArrowDownTrayIcon className="h-4 w-4" />
        PDF
      </a>

      {/* Delete — draft only */}
      {status === 'draft' && (
        <button
          onClick={handleDelete}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3 py-2 border border-red-500/20 text-red-400 rounded-lg hover:bg-red-500/10 transition-colors text-sm disabled:opacity-50"
        >
          <TrashIcon className="h-4 w-4" />
          Delete
        </button>
      )}
    </div>
  );
}
