'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui';
import {
  XMarkIcon,
  MagnifyingGlassIcon,
  PhotoIcon,
  FilmIcon,
  DocumentIcon,
  FolderIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';

interface MediaAsset {
  id: string;
  file_url: string;
  file_name: string;
  file_type: string;
  file_size: number;
  tags: string[];
  folder: string | null;
  created_at: string;
}

interface MediaLibraryModalProps {
  organizationId: string;
  onSelect: (assets: Array<{ url: string; fileName: string; fileType: string; fileSize: number }>) => void;
  onClose: () => void;
}

export function MediaLibraryModal({ organizationId, onSelect, onClose }: MediaLibraryModalProps) {
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [selectedAssets, setSelectedAssets] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadAssets();
  }, [organizationId, selectedFolder]);

  const loadAssets = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ organizationId });
      if (searchQuery) params.set('search', searchQuery);
      if (selectedFolder) params.set('folder', selectedFolder);

      const res = await fetch(`/api/media-library?${params}`);
      if (res.ok) {
        const data = await res.json();
        setAssets(data.assets || []);
      }
    } catch {
      // silently fail
    }
    setIsLoading(false);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadAssets();
  };

  const toggleSelect = (assetId: string) => {
    setSelectedAssets(prev => {
      const next = new Set(prev);
      if (next.has(assetId)) next.delete(assetId);
      else next.add(assetId);
      return next;
    });
  };

  const handleImport = () => {
    const selected = assets.filter(a => selectedAssets.has(a.id));
    onSelect(selected.map(a => ({
      url: a.file_url,
      fileName: a.file_name,
      fileType: a.file_type,
      fileSize: a.file_size,
    })));
    onClose();
  };

  const getIcon = (type: string) => {
    if (type.startsWith('image/')) return PhotoIcon;
    if (type.startsWith('video/')) return FilmIcon;
    return DocumentIcon;
  };

  const folders = Array.from(new Set(assets.filter(a => a.folder).map(a => a.folder!)));

  return (
    <div className="fixed inset-0 bg-dark/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[80vh] flex flex-col shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone/10">
          <h2 className="text-heading-md text-charcoal">Media Library</h2>
          <button onClick={onClose} className="p-2 hover:bg-cream-warm rounded-lg">
            <XMarkIcon className="w-5 h-5 text-stone" />
          </button>
        </div>

        <div className="px-6 py-3 border-b border-stone/5">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone/50" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search assets..."
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-stone/20 text-sm focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal"
              />
            </div>
            <Button type="submit" size="sm" variant="ghost">Search</Button>
          </form>

          {folders.length > 0 && (
            <div className="flex gap-1.5 mt-2">
              <button
                onClick={() => setSelectedFolder(null)}
                className={`px-2 py-1 rounded text-xs ${!selectedFolder ? 'bg-teal text-white' : 'bg-stone/5 text-stone'}`}
              >
                All
              </button>
              {folders.map(f => (
                <button
                  key={f}
                  onClick={() => setSelectedFolder(f)}
                  className={`px-2 py-1 rounded text-xs flex items-center gap-1 ${selectedFolder === f ? 'bg-teal text-white' : 'bg-stone/5 text-stone'}`}
                >
                  <FolderIcon className="w-3 h-3" />
                  {f}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-teal" />
            </div>
          ) : assets.length === 0 ? (
            <div className="text-center py-12">
              <PhotoIcon className="w-12 h-12 mx-auto text-stone/30 mb-2" />
              <p className="text-sm text-stone">No media assets found</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {assets.map(asset => {
                const Icon = getIcon(asset.file_type);
                const selected = selectedAssets.has(asset.id);
                const isImage = asset.file_type.startsWith('image/');

                return (
                  <button
                    key={asset.id}
                    onClick={() => toggleSelect(asset.id)}
                    className={`relative rounded-lg border overflow-hidden transition-colors ${
                      selected ? 'border-teal ring-2 ring-teal/30' : 'border-stone/10 hover:border-stone/20'
                    }`}
                  >
                    {selected && (
                      <div className="absolute top-1 right-1 w-5 h-5 bg-teal rounded-full flex items-center justify-center z-10">
                        <CheckIcon className="w-3 h-3 text-white" />
                      </div>
                    )}
                    {isImage ? (
                      <img src={asset.file_url} alt={asset.file_name} className="w-full h-24 object-cover" />
                    ) : (
                      <div className="w-full h-24 flex items-center justify-center bg-cream-warm">
                        <Icon className="w-8 h-8 text-stone/40" />
                      </div>
                    )}
                    <p className="text-[10px] text-charcoal truncate px-1.5 py-1">{asset.file_name}</p>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="border-t border-stone/10 px-6 py-4 flex items-center justify-between">
          <p className="text-sm text-stone">
            {selectedAssets.size > 0 ? `${selectedAssets.size} selected` : 'Select files'}
          </p>
          <div className="flex gap-2">
            <Button onClick={onClose} variant="ghost">Cancel</Button>
            <Button onClick={handleImport} disabled={selectedAssets.size === 0}>
              Use Selected
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
