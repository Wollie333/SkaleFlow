'use client';

import { useState, useRef, useCallback } from 'react';
import {
  PhotoIcon,
  FilmIcon,
  DocumentIcon,
  XMarkIcon,
  ArrowUpTrayIcon,
} from '@heroicons/react/24/outline';

export interface UploadedFile {
  url: string;
  fileName: string;
  fileType: string;
  fileSize: number;
}

interface MediaUploadProps {
  organizationId: string;
  contentItemId?: string;
  uploadedFiles: UploadedFile[];
  onFilesChange: (files: UploadedFile[]) => void;
  onImportFromDrive?: () => void;
  onImportFromLibrary?: () => void;
  onCreateWithCanva?: () => void;
  onImportFromCanva?: () => void;
}

export function MediaUpload({
  organizationId,
  contentItemId,
  uploadedFiles,
  onFilesChange,
  onImportFromDrive,
  onImportFromLibrary,
  onCreateWithCanva,
  onImportFromCanva,
}: MediaUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return PhotoIcon;
    if (fileType.startsWith('video/')) return FilmIcon;
    return DocumentIcon;
  };

  const handleFileUpload = useCallback(async (files: FileList | File[]) => {
    if (!organizationId) return;
    setUploadError(null);

    const fileArray = Array.from(files);
    for (const file of fileArray) {
      setIsUploading(true);
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('organizationId', organizationId);
        if (contentItemId) {
          formData.append('contentItemId', contentItemId);
        }

        const res = await fetch('/api/content/media', {
          method: 'POST',
          body: formData,
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Upload failed');

        const newFile: UploadedFile = {
          url: data.url,
          fileName: data.fileName,
          fileType: data.fileType,
          fileSize: data.fileSize,
        };
        onFilesChange([...uploadedFiles, newFile]);
      } catch (err) {
        setUploadError(err instanceof Error ? err.message : 'Upload failed');
      }
    }
    setIsUploading(false);
  }, [organizationId, contentItemId, uploadedFiles, onFilesChange]);

  const handleRemoveFile = async (url: string) => {
    if (!organizationId) return;
    try {
      await fetch('/api/content/media', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url,
          organizationId,
          contentItemId,
        }),
      });
      onFilesChange(uploadedFiles.filter(f => f.url !== url));
    } catch (err) {
      console.error('Failed to remove file:', err);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files);
    }
  }, [handleFileUpload]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileUpload(e.target.files);
    }
    e.target.value = '';
  };

  return (
    <div>
      {/* Uploaded files */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2 mb-4">
          {uploadedFiles.map((file) => {
            const FileIcon = getFileIcon(file.fileType);
            const isImage = file.fileType.startsWith('image/');
            const isVideo = file.fileType.startsWith('video/');

            return (
              <div key={file.url} className="flex items-center gap-3 p-2 bg-cream-warm rounded-lg group">
                <div className="w-12 h-12 rounded-lg bg-cream-warm border border-stone/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {isImage ? (
                    <img src={file.url} alt={file.fileName} className="w-full h-full object-cover" />
                  ) : isVideo ? (
                    <video src={file.url} className="w-full h-full object-cover" />
                  ) : (
                    <FileIcon className="w-6 h-6 text-stone/50" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-charcoal truncate">{file.fileName}</p>
                  {file.fileSize > 0 && (
                    <p className="text-xs text-stone">{formatFileSize(file.fileSize)}</p>
                  )}
                </div>
                <button
                  onClick={() => handleRemoveFile(file.url)}
                  className="p-1.5 text-stone/40 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onClick={() => !isUploading && fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
          isUploading
            ? 'border-stone/20 bg-stone/5 cursor-wait'
            : isDragOver
              ? 'border-teal bg-teal/5'
              : 'border-stone/20 hover:border-teal/50 hover:bg-stone/5'
        }`}
      >
        {isUploading ? (
          <div className="flex flex-col items-center gap-2">
            <div className="w-6 h-6 border-2 border-teal/30 border-t-teal rounded-full animate-spin" />
            <p className="text-sm text-stone">Uploading...</p>
          </div>
        ) : (
          <>
            <ArrowUpTrayIcon className={`w-8 h-8 mx-auto mb-2 ${isDragOver ? 'text-teal' : 'text-stone/40'}`} />
            <p className="text-sm font-medium text-charcoal">
              Drop files here, or <span className="text-teal">browse</span>
            </p>
            <p className="text-xs text-stone mt-1">
              Images (PNG, JPG, WebP, GIF) up to 10MB | Videos (MP4, MOV, WebM) up to 100MB | PDF up to 10MB
            </p>
          </>
        )}
      </div>

      {/* Import buttons */}
      {(onImportFromDrive || onImportFromLibrary || onCreateWithCanva || onImportFromCanva) && (
        <div className="flex flex-wrap gap-2 mt-3">
          {onImportFromLibrary && (
            <button
              onClick={onImportFromLibrary}
              className="flex-1 min-w-[140px] px-3 py-2 text-xs font-medium text-stone hover:text-charcoal bg-cream-warm hover:bg-stone/10 rounded-lg transition-colors"
            >
              Choose from Library
            </button>
          )}
          {onImportFromDrive && (
            <button
              onClick={onImportFromDrive}
              className="flex-1 min-w-[140px] px-3 py-2 text-xs font-medium text-stone hover:text-charcoal bg-cream-warm hover:bg-stone/10 rounded-lg transition-colors"
            >
              Import from Google Drive
            </button>
          )}
          {onCreateWithCanva && (
            <button
              onClick={onCreateWithCanva}
              className="flex-1 min-w-[140px] px-3 py-2 text-xs font-medium text-stone hover:text-charcoal bg-cream-warm hover:bg-stone/10 rounded-lg transition-colors"
            >
              Create with Canva
            </button>
          )}
          {onImportFromCanva && (
            <button
              onClick={onImportFromCanva}
              className="flex-1 min-w-[140px] px-3 py-2 text-xs font-medium text-stone hover:text-charcoal bg-cream-warm hover:bg-stone/10 rounded-lg transition-colors"
            >
              Import from Canva
            </button>
          )}
        </div>
      )}

      {uploadError && (
        <p className="text-xs text-red-500 mt-2">{uploadError}</p>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp,image/gif,video/mp4,video/quicktime,video/webm,application/pdf"
        onChange={handleFileSelect}
        multiple
        className="hidden"
      />
    </div>
  );
}
