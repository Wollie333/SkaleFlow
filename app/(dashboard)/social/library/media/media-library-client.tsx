'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { cn } from '@/lib/utils';
import {
  PhotoIcon,
  VideoCameraIcon,
  CloudArrowUpIcon,
  TrashIcon,
  ClipboardDocumentIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

interface MediaFile {
  id: string;
  name: string;
  url: string;
  size: number;
  type: string;
  createdAt: string;
}

interface MediaLibraryClientProps {
  organizationId: string;
}

function formatFileSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${bytes} B`;
}

export function MediaLibraryClient({ organizationId }: MediaLibraryClientProps) {
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'image' | 'video'>('all');
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchFiles = useCallback(async () => {
    try {
      const res = await fetch('/api/social/media');
      if (res.ok) {
        const data = await res.json();
        setFiles(data.files || []);
      }
    } catch (err) {
      console.error('Error fetching media:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const handleUpload = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;

    setUploading(true);
    const uploadPromises = Array.from(fileList).map(async (file) => {
      const formData = new FormData();
      formData.append('file', file);

      try {
        const res = await fetch('/api/social/media', {
          method: 'POST',
          body: formData,
        });
        if (!res.ok) {
          const err = await res.json();
          alert(`Failed to upload ${file.name}: ${err.error}`);
          return null;
        }
        return (await res.json()).file;
      } catch {
        alert(`Failed to upload ${file.name}`);
        return null;
      }
    });

    await Promise.all(uploadPromises);
    setUploading(false);
    fetchFiles();
  };

  const handleDelete = async (fileName: string) => {
    if (!confirm('Delete this file?')) return;

    try {
      const res = await fetch('/api/social/media', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName }),
      });
      if (res.ok) {
        setFiles((prev) => prev.filter((f) => f.name !== fileName));
      }
    } catch (err) {
      console.error('Error deleting file:', err);
    }
  };

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleUpload(e.dataTransfer.files);
  };

  // Filter files
  const filteredFiles = files.filter((f) => {
    const matchesSearch = searchQuery === '' || f.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === 'all' || (filter === 'image' ? f.type.startsWith('image/') : f.type.startsWith('video/'));
    return matchesSearch && matchesFilter;
  });

  const isImage = (type: string) => type.startsWith('image/');

  return (
    <div className="p-6 md:p-8 space-y-6">
      <PageHeader
        title="Media Library"
        subtitle="Upload and manage images and videos for social media posts"
      />

      {/* Upload Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={cn(
          'border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer',
          dragOver
            ? 'border-teal bg-teal/5'
            : 'border-stone/20 hover:border-teal/40 bg-cream-warm'
        )}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/mp4,video/quicktime"
          multiple
          onChange={(e) => handleUpload(e.target.files)}
          className="hidden"
        />
        <CloudArrowUpIcon className={cn('w-12 h-12 mx-auto mb-3', dragOver ? 'text-teal' : 'text-stone/30')} />
        <p className="text-sm font-medium text-charcoal mb-1">
          {uploading ? 'Uploading...' : 'Drop files here or click to upload'}
        </p>
        <p className="text-xs text-stone">JPG, PNG, GIF, WebP, MP4 (max 10MB)</p>
        {uploading && (
          <div className="mt-3">
            <div className="w-32 h-1.5 mx-auto bg-stone/10 rounded-full overflow-hidden">
              <div className="h-full bg-teal rounded-full animate-pulse w-2/3" />
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full sm:w-72">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone/40" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search files..."
            className="w-full pl-10 pr-4 py-2.5 bg-cream-warm border border-stone/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2">
          {[
            { value: 'all' as const, label: 'All' },
            { value: 'image' as const, label: 'Images' },
            { value: 'video' as const, label: 'Videos' },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setFilter(tab.value)}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                filter === tab.value
                  ? 'bg-teal text-white'
                  : 'bg-cream-warm border border-stone/10 text-stone hover:text-charcoal'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* File Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-cream-warm rounded-xl border border-stone/10 p-4">
          <p className="text-sm text-stone mb-1">Total Files</p>
          <p className="text-2xl font-bold text-charcoal">{files.length}</p>
        </div>
        <div className="bg-cream-warm rounded-xl border border-stone/10 p-4">
          <p className="text-sm text-stone mb-1">Images</p>
          <p className="text-2xl font-bold text-charcoal">{files.filter((f) => isImage(f.type)).length}</p>
        </div>
        <div className="bg-cream-warm rounded-xl border border-stone/10 p-4">
          <p className="text-sm text-stone mb-1">Videos</p>
          <p className="text-2xl font-bold text-charcoal">{files.filter((f) => f.type.startsWith('video/')).length}</p>
        </div>
      </div>

      {/* File Grid */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-cream-warm rounded-xl border border-stone/10 aspect-square animate-pulse" />
          ))}
        </div>
      ) : filteredFiles.length === 0 ? (
        <div className="bg-cream-warm rounded-xl border border-stone/10 p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-teal/10 rounded-full flex items-center justify-center">
            <PhotoIcon className="w-8 h-8 text-teal" />
          </div>
          <h3 className="text-lg font-semibold text-charcoal mb-2">
            {files.length === 0 ? 'No media files yet' : 'No files match your search'}
          </h3>
          <p className="text-sm text-stone">
            {files.length === 0 ? 'Upload images and videos to use in your social media posts' : 'Try adjusting your search or filters'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredFiles.map((file) => (
            <div
              key={file.name}
              className="bg-cream-warm rounded-xl border border-stone/10 overflow-hidden group hover:border-teal/30 transition-colors"
            >
              {/* Preview */}
              <div className="aspect-square relative bg-stone/5 overflow-hidden">
                {isImage(file.type) ? (
                  <img src={file.url} alt={file.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <VideoCameraIcon className="w-12 h-12 text-stone/30" />
                  </div>
                )}
                {/* Overlay Actions */}
                <div className="absolute inset-0 bg-charcoal/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    onClick={() => handleCopyUrl(file.url)}
                    className={cn(
                      'p-2 rounded-lg text-white transition-colors',
                      copiedUrl === file.url ? 'bg-green-600' : 'bg-white/20 hover:bg-white/30'
                    )}
                    title="Copy URL"
                  >
                    <ClipboardDocumentIcon className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(file.name)}
                    className="p-2 bg-white/20 hover:bg-red-600 rounded-lg text-white transition-colors"
                    title="Delete"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Info */}
              <div className="p-3">
                <p className="text-xs font-medium text-charcoal truncate" title={file.name}>{file.name}</p>
                <p className="text-[10px] text-stone">{formatFileSize(file.size)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
