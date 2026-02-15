'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
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
    <div className="flex items-center gap-3">
      {/* Draft Status Actions */}
      {status === 'draft' && (
        <>
          <Button
            onClick={handleMarkAsSent}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <PaperAirplaneIcon className="h-5 w-5 mr-2" />
            Mark as Sent
          </Button>
          <Button
            onClick={handleDelete}
            disabled={loading}
            variant="outline"
            className="border-red-600 text-red-600 hover:bg-red-50"
          >
            <TrashIcon className="h-5 w-5 mr-2" />
            Delete
          </Button>
        </>
      )}

      {/* Sent Status Actions */}
      {status === 'sent' && (
        <>
          <Button
            onClick={handleMarkAsPaid}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <CheckCircleIcon className="h-5 w-5 mr-2" />
            Mark as Paid
          </Button>
        </>
      )}

      {/* Paid Status - Show Badge */}
      {status === 'paid' && (
        <div className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-md font-medium">
          <CheckCircleIcon className="h-5 w-5" />
          Paid
        </div>
      )}

      {/* Share Link - Available for Sent and Paid */}
      {(status === 'sent' || status === 'paid') && (
        <>
          {!shareToken ? (
            <Button
              onClick={handleGenerateShareLink}
              disabled={loading}
              variant="outline"
              className="border-teal text-teal hover:bg-teal/10"
            >
              <ShareIcon className="h-5 w-5 mr-2" />
              Share Link
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                onClick={handleCopyShareLink}
                variant="outline"
                className={`border-teal hover:bg-teal/10 ${
                  copied ? 'text-green-600 border-green-600' : 'text-teal'
                }`}
              >
                <ClipboardIcon className="h-5 w-5 mr-2" />
                {copied ? 'Copied!' : 'Copy Share Link'}
              </Button>
            </div>
          )}
        </>
      )}

      {/* PDF Download - Available for All Statuses */}
      <a
        href={`/api/crm/invoices/${invoiceId}/pdf`}
        target="_blank"
        rel="noopener noreferrer"
      >
        <Button
          variant="outline"
          className="border-stone-300 text-stone-700 hover:bg-stone-50"
        >
          <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
          PDF
        </Button>
      </a>
    </div>
  );
}
