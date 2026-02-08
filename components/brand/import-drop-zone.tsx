'use client';

import { useCallback, useState, useRef } from 'react';
import { ArrowUpTrayIcon, DocumentTextIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface ImportDropZoneProps {
  file: File | null;
  onFileSelect: (file: File | null) => void;
  disabled?: boolean;
}

const ACCEPTED_TYPES = [
  'application/pdf',
  'text/markdown',
  'text/x-markdown',
  'text/plain',
];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

export function ImportDropZone({ file, onFileSelect, disabled }: ImportDropZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateFile = useCallback((f: File): string | null => {
    const ext = f.name.toLowerCase().split('.').pop();
    if (ext !== 'pdf' && ext !== 'md') {
      return 'Only .pdf and .md files are accepted';
    }
    if (f.size > MAX_SIZE) {
      return 'File must be under 10MB';
    }
    return null;
  }, []);

  const handleFile = useCallback(
    (f: File) => {
      const err = validateFile(f);
      if (err) {
        setValidationError(err);
        return;
      }
      setValidationError(null);
      onFileSelect(f);
    },
    [validateFile, onFileSelect]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      if (disabled) return;

      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile) {
        handleFile(droppedFile);
      }
    },
    [disabled, handleFile]
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (!disabled) setIsDragOver(true);
    },
    [disabled]
  );

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selected = e.target.files?.[0];
      if (selected) {
        handleFile(selected);
      }
    },
    [handleFile]
  );

  const handleRemove = useCallback(() => {
    onFileSelect(null);
    setValidationError(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  }, [onFileSelect]);

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // File selected state
  if (file) {
    return (
      <div className="border border-teal/30 bg-teal/5 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <DocumentTextIcon className="w-8 h-8 text-teal flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-charcoal truncate">{file.name}</p>
            <p className="text-xs text-stone">{formatSize(file.size)}</p>
          </div>
          {!disabled && (
            <button
              onClick={handleRemove}
              className="p-1.5 text-stone hover:text-charcoal hover:bg-stone/10 rounded-lg transition-colors"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    );
  }

  // Drop zone state
  return (
    <div>
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !disabled && inputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
          disabled
            ? 'border-stone/20 bg-stone/5 cursor-not-allowed'
            : isDragOver
              ? 'border-teal bg-teal/5'
              : 'border-stone/20 hover:border-teal/50 hover:bg-stone/5'
        }`}
      >
        <ArrowUpTrayIcon className={`w-8 h-8 mx-auto mb-3 ${isDragOver ? 'text-teal' : 'text-stone'}`} />
        <p className="text-sm font-medium text-charcoal">
          Drop your file here, or <span className="text-teal">browse</span>
        </p>
        <p className="text-xs text-stone mt-1">
          PDF or Markdown, up to 10MB
        </p>
      </div>

      {validationError && (
        <p className="text-xs text-red-500 mt-2">{validationError}</p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.md"
        onChange={handleInputChange}
        className="hidden"
      />
    </div>
  );
}
