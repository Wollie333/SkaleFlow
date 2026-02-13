'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui';
import { XMarkIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import type { SocialPlatform } from '@/types/database';
import { PLATFORM_CONFIG } from '@/lib/social/types';

interface AvailablePage {
  id: string;
  name: string;
  category: string | null;
  isConnected: boolean;
}

interface PageSelectionModalProps {
  platform: SocialPlatform;
  isOpen: boolean;
  onClose: () => void;
  onPagesAdded: () => void;
}

export function PageSelectionModal({ platform, isOpen, onClose, onPagesAdded }: PageSelectionModalProps) {
  const [pages, setPages] = useState<AvailablePage[]>([]);
  const [connectionId, setConnectionId] = useState<string | null>(null);
  const [selectedPageIds, setSelectedPageIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const config = PLATFORM_CONFIG[platform];

  useEffect(() => {
    if (!isOpen) return;

    async function fetchPages() {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/integrations/social/connections/available-pages?platform=${platform}`, {
          cache: 'no-store',
        });
        const data = await res.json();

        if (!res.ok) {
          const errorMsg = data.hint ? `${data.error}\n\n${data.hint}` : (data.error || 'Failed to load pages');
          setError(errorMsg);
          // Still try to use any pages returned in the error response
          setConnectionId(data.connectionId || null);
          setPages(data.pages || []);
          return;
        }

        setConnectionId(data.connectionId);
        const fetchedPages = data.pages || [];
        setPages(fetchedPages);

        // Only set error if there are truly no pages
        if (fetchedPages.length === 0) {
          const errorMsg = data.error || data.hint || `No ${config.name} pages found.`;
          setError(errorMsg);
        }

        // Pre-select already-connected pages
        const connected = new Set<string>();
        for (const p of fetchedPages) {
          if (p.isConnected) connected.add(p.id);
        }
        setSelectedPageIds(connected);
      } catch (err) {
        console.error('Failed to fetch pages:', err);
        setError('Failed to load pages. Check the browser console for details.');
      } finally {
        setIsLoading(false);
      }
    }

    fetchPages();
  }, [isOpen, platform, config.name]);

  const togglePage = (pageId: string) => {
    setSelectedPageIds(prev => {
      const next = new Set(prev);
      if (next.has(pageId)) {
        next.delete(pageId);
      } else {
        next.add(pageId);
      }
      return next;
    });
  };

  const handleSave = async () => {
    if (!connectionId) return;

    // Only add pages that aren't already connected
    const newPageIds = Array.from(selectedPageIds).filter(
      id => !pages.find(p => p.id === id && p.isConnected)
    );

    if (newPageIds.length === 0) {
      onClose();
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch('/api/integrations/social/connections/add-page', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connectionId, pageIds: newPageIds }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to add pages');
        return;
      }

      onPagesAdded();
      onClose();
    } catch {
      setError('Failed to add pages');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-dark/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-stone/10">
          <h2 className="text-heading-md text-charcoal">
            Select {config.name} Pages
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-cream-warm transition-colors"
          >
            <XMarkIcon className="w-5 h-5 text-stone" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-teal" />
              <p className="ml-3 text-sm text-stone">Loading {config.name} pages...</p>
            </div>
          ) : pages.length > 0 ? (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {pages.map(page => (
                <label
                  key={page.id}
                  className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors ${
                    selectedPageIds.has(page.id)
                      ? 'bg-teal/10 border border-teal/20'
                      : 'bg-cream-warm border border-transparent hover:border-stone/20'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedPageIds.has(page.id)}
                    onChange={() => togglePage(page.id)}
                    className="h-4 w-4 rounded border-stone/30 text-teal focus:ring-teal"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-charcoal text-sm truncate">{page.name}</p>
                    {page.category && (
                      <p className="text-xs text-stone">{page.category}</p>
                    )}
                  </div>
                  {page.isConnected && (
                    <CheckCircleIcon className="w-4 h-4 text-teal flex-shrink-0" />
                  )}
                </label>
              ))}
            </div>
          ) : error ? (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm font-semibold text-amber-800 mb-2">Unable to Load Pages</p>
              <p className="text-sm text-amber-700 whitespace-pre-line">{error}</p>
              {platform === 'facebook' && (
                <div className="mt-4 p-3 bg-white rounded border border-amber-200">
                  <p className="text-xs font-semibold text-charcoal mb-2">How to create a Facebook Page:</p>
                  <ol className="text-xs text-stone space-y-1 ml-4 list-decimal">
                    <li>Go to <a href="https://www.facebook.com/pages/create" target="_blank" rel="noopener noreferrer" className="text-teal hover:underline">facebook.com/pages/create</a></li>
                    <li>Choose a Page type (Business, Community, etc.)</li>
                    <li>Fill in your Page details and create it</li>
                    <li>Come back here and reconnect your Facebook account</li>
                  </ol>
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm font-semibold text-amber-800 mb-2">No Pages Found</p>
              <p className="text-sm text-amber-700">
                No pages found for this account. Make sure you have admin access to pages on {config.name}.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        {!isLoading && pages.length > 0 && (
          <div className="flex items-center justify-end gap-3 p-6 border-t border-stone/10">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave} isLoading={isSaving}>
              Connect Selected
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
