'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui';
import {
  XMarkIcon,
  MagnifyingGlassIcon,
  FolderIcon,
  DocumentIcon,
  PhotoIcon,
  FilmIcon,
  ArrowLeftIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  thumbnailLink: string | null;
  size: string | null;
  modifiedTime: string | null;
  iconLink: string | null;
}

interface DriveFilePickerProps {
  organizationId: string;
  contentItemId?: string;
  onImport: (files: Array<{ url: string; fileName: string; fileType: string; fileSize: number }>) => void;
  onClose: () => void;
}

export function DriveFilePicker({ organizationId, contentItemId, onImport, onClose }: DriveFilePickerProps) {
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [folderStack, setFolderStack] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [isImporting, setIsImporting] = useState(false);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);

  const currentFolderId = folderStack.length > 0 ? folderStack[folderStack.length - 1].id : undefined;

  const loadFiles = useCallback(async (options?: { append?: boolean; pageToken?: string }) => {
    if (!options?.append) setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set('query', searchQuery);
      if (currentFolderId) params.set('folderId', currentFolderId);
      if (options?.pageToken) params.set('pageToken', options.pageToken);
      params.set('pageSize', '30');

      const res = await fetch(`/api/integrations/google-drive/files?${params}`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to load files');
      }

      const data = await res.json();
      if (options?.append) {
        setFiles(prev => [...prev, ...data.files]);
      } else {
        setFiles(data.files);
      }
      setNextPageToken(data.nextPageToken);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load files');
    }

    setIsLoading(false);
  }, [searchQuery, currentFolderId]);

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  const handleFolderOpen = (file: DriveFile) => {
    setFolderStack(prev => [...prev, { id: file.id, name: file.name }]);
    setSelectedFiles(new Set());
  };

  const handleGoBack = () => {
    setFolderStack(prev => prev.slice(0, -1));
    setSelectedFiles(new Set());
  };

  const toggleSelect = (fileId: string) => {
    setSelectedFiles(prev => {
      const next = new Set(prev);
      if (next.has(fileId)) {
        next.delete(fileId);
      } else {
        next.add(fileId);
      }
      return next;
    });
  };

  const handleImport = async () => {
    const filesToImport = files.filter(f => selectedFiles.has(f.id) && !f.mimeType.includes('folder'));
    if (filesToImport.length === 0) return;

    setIsImporting(true);
    const imported: Array<{ url: string; fileName: string; fileType: string; fileSize: number }> = [];

    for (const file of filesToImport) {
      try {
        const res = await fetch('/api/integrations/google-drive/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileId: file.id,
            mimeType: file.mimeType,
            organizationId,
            contentItemId,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          imported.push(data);
        }
      } catch (err) {
        console.error(`Failed to import ${file.name}:`, err);
      }
    }

    if (imported.length > 0) {
      onImport(imported);
    }
    setIsImporting(false);
    onClose();
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadFiles();
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType === 'application/vnd.google-apps.folder') return FolderIcon;
    if (mimeType.startsWith('image/') || mimeType.includes('drawing')) return PhotoIcon;
    if (mimeType.startsWith('video/')) return FilmIcon;
    return DocumentIcon;
  };

  const formatSize = (size: string | null): string => {
    if (!size) return '';
    const bytes = parseInt(size, 10);
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const isFolder = (mimeType: string) => mimeType === 'application/vnd.google-apps.folder';

  return (
    <div className="fixed inset-0 bg-dark/50 flex items-center justify-center z-50">
      <div className="bg-cream-warm rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone/10">
          <h2 className="text-heading-md text-charcoal">Import from Google Drive</h2>
          <button onClick={onClose} className="p-2 hover:bg-cream rounded-lg transition-colors">
            <XMarkIcon className="w-5 h-5 text-stone" />
          </button>
        </div>

        {/* Search + breadcrumbs */}
        <div className="px-6 py-3 border-b border-stone/5 space-y-2">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone/50" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search files..."
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-stone/20 text-sm focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal"
              />
            </div>
            <Button type="submit" size="sm" variant="ghost">Search</Button>
          </form>

          {folderStack.length > 0 && (
            <div className="flex items-center gap-1 text-xs text-stone">
              <button onClick={() => { setFolderStack([]); setSelectedFiles(new Set()); }} className="hover:text-charcoal">
                My Drive
              </button>
              {folderStack.map((folder, idx) => (
                <span key={folder.id} className="flex items-center gap-1">
                  <span>/</span>
                  <button
                    onClick={() => { setFolderStack(prev => prev.slice(0, idx + 1)); setSelectedFiles(new Set()); }}
                    className="hover:text-charcoal"
                  >
                    {folder.name}
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* File grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-teal" />
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-sm text-red-600">{error}</p>
              <Button onClick={() => loadFiles()} size="sm" variant="ghost" className="mt-3">
                Retry
              </Button>
            </div>
          ) : files.length === 0 ? (
            <div className="text-center py-12">
              <DocumentIcon className="w-12 h-12 mx-auto text-stone/30 mb-2" />
              <p className="text-sm text-stone">No files found</p>
            </div>
          ) : (
            <>
              {folderStack.length > 0 && (
                <button
                  onClick={handleGoBack}
                  className="flex items-center gap-2 px-3 py-2 mb-2 text-sm text-stone hover:text-charcoal hover:bg-cream rounded-lg transition-colors w-full"
                >
                  <ArrowLeftIcon className="w-4 h-4" />
                  Back
                </button>
              )}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {files.map(file => {
                  const FileIcon = getFileIcon(file.mimeType);
                  const folder = isFolder(file.mimeType);
                  const selected = selectedFiles.has(file.id);

                  return (
                    <button
                      key={file.id}
                      onClick={() => folder ? handleFolderOpen(file) : toggleSelect(file.id)}
                      className={`relative flex flex-col items-center p-3 rounded-lg border text-center transition-colors ${
                        selected
                          ? 'border-teal bg-teal/5'
                          : 'border-stone/10 hover:border-stone/20 hover:bg-cream'
                      }`}
                    >
                      {selected && (
                        <div className="absolute top-2 right-2 w-5 h-5 bg-teal rounded-full flex items-center justify-center">
                          <CheckIcon className="w-3 h-3 text-white" />
                        </div>
                      )}
                      {file.thumbnailLink && !folder ? (
                        <img
                          src={file.thumbnailLink}
                          alt={file.name}
                          className="w-16 h-16 object-cover rounded-lg mb-2"
                        />
                      ) : (
                        <FileIcon className={`w-10 h-10 mb-2 ${folder ? 'text-amber-500' : 'text-stone/40'}`} />
                      )}
                      <p className="text-xs font-medium text-charcoal truncate w-full">{file.name}</p>
                      {!folder && file.size && (
                        <p className="text-xs text-stone/60">{formatSize(file.size)}</p>
                      )}
                    </button>
                  );
                })}
              </div>

              {nextPageToken && (
                <div className="text-center mt-4">
                  <Button
                    onClick={() => loadFiles({ append: true, pageToken: nextPageToken })}
                    variant="ghost"
                    size="sm"
                  >
                    Load More
                  </Button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-stone/10 px-6 py-4 flex items-center justify-between">
          <p className="text-sm text-stone">
            {selectedFiles.size > 0 ? `${selectedFiles.size} file${selectedFiles.size > 1 ? 's' : ''} selected` : 'Select files to import'}
          </p>
          <div className="flex gap-2">
            <Button onClick={onClose} variant="ghost">Cancel</Button>
            <Button
              onClick={handleImport}
              disabled={selectedFiles.size === 0 || isImporting}
              isLoading={isImporting}
            >
              Import Selected
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
