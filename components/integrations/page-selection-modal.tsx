'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button, Input } from '@/components/ui';
import { XMarkIcon, CheckCircleIcon, MagnifyingGlassIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import type { SocialPlatform } from '@/types/database';
import { PLATFORM_CONFIG } from '@/lib/social/types';

interface AvailablePage {
  id: string;
  name: string;
  category: string | null;
  isConnected: boolean;
}

interface SearchResult {
  id: string;
  name: string;
  category: string | null;
  hasToken: boolean;
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

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchPageData, setSearchPageData] = useState<Array<{ id: string; name: string; access_token: string; category: string | null }>>([]);

  const config = PLATFORM_CONFIG[platform];

  useEffect(() => {
    if (!isOpen) return;

    async function fetchPages() {
      setIsLoading(true);
      setError(null);
      setSearchQuery('');
      setSearchResults([]);
      setSearchError(null);
      try {
        const res = await fetch(`/api/integrations/social/connections/available-pages?platform=${platform}`, {
          cache: 'no-store',
        });
        const data = await res.json();

        if (!res.ok) {
          const errorMsg = data.hint ? `${data.error}\n\n${data.hint}` : (data.error || 'Failed to load pages');
          setError(errorMsg);
          setConnectionId(data.connectionId || null);
          setPages(data.pages || []);
          return;
        }

        setConnectionId(data.connectionId);
        const fetchedPages = data.pages || [];
        setPages(fetchedPages);

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

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) return;

    setIsSearching(true);
    setSearchError(null);
    setSearchResults([]);
    try {
      const res = await fetch(`/api/integrations/social/connections/lookup-page?platform=${platform}&q=${encodeURIComponent(searchQuery.trim())}`);
      const data = await res.json();

      if (!res.ok) {
        setSearchError(data.error || 'Search failed');
        return;
      }

      // Filter out pages already in the main list
      const existingIds = new Set(pages.map(p => p.id));
      const newResults = (data.pages || []).filter((p: SearchResult) => !existingIds.has(p.id));
      setSearchResults(newResults);
      setSearchPageData(data._pageData || []);

      if (newResults.length === 0 && (data.pages || []).length > 0) {
        setSearchError('All matching pages are already shown above.');
      } else if (newResults.length === 0) {
        setSearchError(`No pages found for "${searchQuery}". Try the exact page name or Facebook page URL.`);
      }
    } catch (err) {
      console.error('Search failed:', err);
      setSearchError('Search failed. Please try again.');
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery, platform, pages]);

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

  const handleConnectSearchResult = async (result: SearchResult) => {
    if (!connectionId || !result.hasToken) return;

    // Find the full page data with access_token
    const fullPageData = searchPageData.find(p => p.id === result.id);
    if (!fullPageData || !fullPageData.access_token) {
      setSearchError(`Cannot connect "${result.name}" — you don't have admin access to this page.`);
      return;
    }

    setIsSaving(true);
    try {
      // Directly add the page via the add-page-direct endpoint
      const res = await fetch('/api/integrations/social/connections/add-page-direct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          connectionId,
          page: {
            id: fullPageData.id,
            name: fullPageData.name,
            access_token: fullPageData.access_token,
            category: fullPageData.category,
          },
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setSearchError(data.error || 'Failed to connect page');
        return;
      }

      // Move to main list as connected
      setPages(prev => [...prev, { id: result.id, name: result.name, category: result.category, isConnected: true }]);
      setSearchResults(prev => prev.filter(r => r.id !== result.id));
      setSelectedPageIds(prev => new Set([...prev, result.id]));
      onPagesAdded();
    } catch {
      setSearchError('Failed to connect page');
    } finally {
      setIsSaving(false);
    }
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

  const showSearch = platform === 'facebook' && !isLoading;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-dark/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-stone/10 flex-shrink-0">
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
        <div className="p-6 overflow-y-auto flex-1">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-teal" />
              <p className="ml-3 text-sm text-stone">Loading {config.name} pages...</p>
            </div>
          ) : (
            <>
              {/* Available pages list */}
              {pages.length > 0 && (
                <div className="space-y-2 mb-4">
                  <p className="text-xs font-medium text-stone uppercase tracking-wide">Available Pages ({pages.length})</p>
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
              )}

              {/* No pages message */}
              {pages.length === 0 && error && !showSearch && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg mb-4">
                  <p className="text-sm font-semibold text-amber-800 mb-2">Unable to Load Pages</p>
                  <p className="text-sm text-amber-700 whitespace-pre-line">{error}</p>
                </div>
              )}

              {/* Search section for Facebook */}
              {showSearch && (
                <div className="border-t border-stone/10 pt-4">
                  <p className="text-xs font-medium text-stone uppercase tracking-wide mb-2">
                    {pages.length > 0 ? "Don't see your page? Search for it" : 'Search for your page'}
                  </p>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Input
                        placeholder="Page name or Facebook URL..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                      />
                    </div>
                    <Button
                      onClick={handleSearch}
                      isLoading={isSearching}
                      disabled={!searchQuery.trim() || searchQuery.trim().length < 2}
                      className="flex-shrink-0"
                    >
                      <MagnifyingGlassIcon className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Search results */}
                  {searchResults.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {searchResults.map(result => (
                        <div
                          key={result.id}
                          className="flex items-center justify-between p-3 bg-cream-warm rounded-xl border border-transparent"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-charcoal text-sm truncate">{result.name}</p>
                            {result.category && (
                              <p className="text-xs text-stone">{result.category}</p>
                            )}
                          </div>
                          {result.hasToken ? (
                            <Button
                              onClick={() => handleConnectSearchResult(result)}
                              isLoading={isSaving}
                              className="text-xs ml-2 flex-shrink-0"
                            >
                              Connect
                            </Button>
                          ) : (
                            <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                              <ExclamationTriangleIcon className="w-3.5 h-3.5 text-amber-500" />
                              <span className="text-xs text-amber-600">No admin access</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {searchError && (
                    <p className="mt-2 text-xs text-amber-600">{searchError}</p>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {!isLoading && pages.length > 0 && (
          <div className="border-t border-stone/10 flex-shrink-0">
            <div className="flex items-center justify-end gap-3 p-6">
              <Button variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={handleSave} isLoading={isSaving}>
                Connect Selected
              </Button>
            </div>
          </div>
        )}

        {/* Close button when no pages and only search */}
        {!isLoading && pages.length === 0 && showSearch && (
          <div className="border-t border-stone/10 flex-shrink-0">
            <div className="flex items-center justify-end gap-3 p-6">
              <Button variant="ghost" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
