'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui';
import {
  XMarkIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  ArrowDownTrayIcon,
  PhotoIcon,
} from '@heroicons/react/24/outline';

interface CanvaDesign {
  id: string;
  title: string;
  thumbnail?: {
    url: string;
    width: number;
    height: number;
  };
  urls: {
    edit_url: string;
    view_url: string;
  };
  created_at: string;
  updated_at: string;
}

interface CanvaDesignPickerProps {
  onImport: (designId: string) => Promise<void>;
  onClose: () => void;
}

export function CanvaDesignPicker({ onImport, onClose }: CanvaDesignPickerProps) {
  const [designs, setDesigns] = useState<CanvaDesign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [continuation, setContinuation] = useState<string | undefined>();
  const [importingId, setImportingId] = useState<string | null>(null);

  const fetchDesigns = useCallback(async (query?: string, cont?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (query) params.set('query', query);
      if (cont) params.set('continuation', cont);

      const res = await fetch(`/api/canva/designs?${params.toString()}`);
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Failed to load designs');

      if (cont) {
        setDesigns(prev => [...prev, ...(data.designs || [])]);
      } else {
        setDesigns(data.designs || []);
      }
      setContinuation(data.continuation);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load designs');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDesigns();
  }, [fetchDesigns]);

  const handleSearch = () => {
    setContinuation(undefined);
    fetchDesigns(searchQuery || undefined);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  const handleImport = async (designId: string) => {
    setImportingId(designId);
    try {
      await onImport(designId);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setImportingId(null);
    }
  };

  const handleLoadMore = () => {
    if (continuation) {
      fetchDesigns(searchQuery || undefined, continuation);
    }
  };

  return (
    <div className="fixed inset-0 bg-dark/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-stone/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
              <PhotoIcon className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-heading-lg text-charcoal">Import from Canva</h2>
              <p className="text-sm text-stone">Select a design to import</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-stone hover:text-charcoal hover:bg-stone/10 rounded-lg transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Search bar */}
        <div className="flex gap-2 p-4 border-b border-stone/10">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone" />
            <input
              type="text"
              placeholder="Search designs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full pl-9 pr-3 py-2 text-sm border border-stone/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal"
            />
          </div>
          <Button size="sm" variant="ghost" onClick={handleSearch}>
            Search
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setSearchQuery('');
              setContinuation(undefined);
              fetchDesigns();
            }}
          >
            <ArrowPathIcon className="w-4 h-4" />
          </Button>
        </div>

        {/* Design grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {error && (
            <div className="text-center py-8">
              <p className="text-sm text-red-500">{error}</p>
              <Button size="sm" variant="ghost" onClick={() => fetchDesigns()} className="mt-2">
                Retry
              </Button>
            </div>
          )}

          {!error && designs.length === 0 && !isLoading && (
            <div className="text-center py-12">
              <PhotoIcon className="w-12 h-12 mx-auto text-stone/30 mb-3" />
              <p className="text-sm text-stone">No designs found</p>
              <p className="text-xs text-stone/60 mt-1">Create a design in Canva first, then import it here</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            {designs.map((design) => (
              <button
                key={design.id}
                onClick={() => handleImport(design.id)}
                disabled={importingId !== null}
                className="group relative bg-cream-warm rounded-xl overflow-hidden text-left transition-all hover:ring-2 hover:ring-teal/40 disabled:opacity-50"
              >
                {/* Thumbnail */}
                <div className="aspect-video bg-stone/5 flex items-center justify-center">
                  {design.thumbnail?.url ? (
                    <img
                      src={design.thumbnail.url}
                      alt={design.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <PhotoIcon className="w-10 h-10 text-stone/20" />
                  )}

                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-dark/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    {importingId === design.id ? (
                      <div className="flex items-center gap-2 text-white">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span className="text-sm font-medium">Importing...</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-white">
                        <ArrowDownTrayIcon className="w-5 h-5" />
                        <span className="text-sm font-medium">Import Design</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Info */}
                <div className="p-3">
                  <p className="text-sm font-medium text-charcoal truncate">{design.title || 'Untitled'}</p>
                  <p className="text-xs text-stone mt-0.5">
                    {new Date(design.updated_at).toLocaleDateString()}
                  </p>
                </div>
              </button>
            ))}
          </div>

          {/* Loading state */}
          {isLoading && (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-teal/30 border-t-teal rounded-full animate-spin" />
            </div>
          )}

          {/* Load more */}
          {continuation && !isLoading && (
            <div className="text-center pt-4">
              <Button size="sm" variant="ghost" onClick={handleLoadMore}>
                Load more designs
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
