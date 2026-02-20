'use client';

import { useState } from 'react';
import { ArrowLeftIcon, PrinterIcon, LinkIcon, ArrowDownTrayIcon, CheckIcon } from '@heroicons/react/24/outline';

interface PlaybookToolbarProps {
  isPublicView?: boolean;
  shareUrl?: string;
  organizationId?: string;
  sidebarOffset?: boolean;
}

export function PlaybookToolbar({ isPublicView, shareUrl, organizationId, sidebarOffset }: PlaybookToolbarProps) {
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const handleCopyLink = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = shareUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadHtml = async () => {
    if (!organizationId) return;
    setDownloading(true);
    try {
      const response = await fetch(`/api/brand/playbook/export?organizationId=${organizationId}`);
      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const disposition = response.headers.get('Content-Disposition') || '';
      const filenameMatch = disposition.match(/filename="?([^"]+)"?/);
      const filename = filenameMatch ? filenameMatch[1] : 'brand-playbook.html';

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('HTML export failed:', err);
    }
    setDownloading(false);
  };

  return (
    <div className={`playbook-toolbar fixed top-0 ${sidebarOffset ? 'left-60' : 'left-0'} right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-stone/10 print:hidden print:!left-0`}>
      <div className="max-w-[900px] mx-auto px-6 py-3 flex items-center justify-between">
        {/* Left: Back button (auth view only) */}
        {!isPublicView ? (
          <button
            onClick={() => window.close()}
            className="flex items-center gap-2 text-sm text-stone hover:text-charcoal transition-colors"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Back to Brand Engine
          </button>
        ) : (
          <div />
        )}

        {/* Right: Action buttons */}
        <div className="flex items-center gap-3">
          {/* Copy Share Link (auth view only) */}
          {!isPublicView && shareUrl && (
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-charcoal hover:text-charcoal rounded-lg hover:bg-gray-100 transition-colors"
            >
              {copied ? (
                <>
                  <CheckIcon className="w-4 h-4 text-green-600" />
                  <span className="text-green-600">Copied!</span>
                </>
              ) : (
                <>
                  <LinkIcon className="w-4 h-4" />
                  Copy Share Link
                </>
              )}
            </button>
          )}

          {/* Download HTML (auth view only) */}
          {!isPublicView && organizationId && (
            <button
              onClick={handleDownloadHtml}
              disabled={downloading}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-charcoal hover:text-charcoal rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
            >
              <ArrowDownTrayIcon className="w-4 h-4" />
              {downloading ? 'Exporting...' : 'Download HTML'}
            </button>
          )}

          {/* Save as PDF (both views) */}
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors"
            style={{ backgroundColor: 'var(--playbook-primary, #1E6B63)' }}
          >
            <PrinterIcon className="w-4 h-4" />
            Save as PDF
          </button>
        </div>
      </div>
    </div>
  );
}
