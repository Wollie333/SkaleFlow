'use client';

import { useState, useRef, useCallback } from 'react';
import {
  ArrowUpTrayIcon,
  SparklesIcon,
  XMarkIcon,
  PhotoIcon,
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui';

interface LogoUploadProps {
  organizationId: string;
  currentLogoUrl?: string | null;
  onLogoUploaded: (url: string) => void;
  disabled?: boolean;
}

export function LogoUpload({ organizationId, currentLogoUrl, onLogoUploaded, disabled }: LogoUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentLogoUrl || null);
  const [error, setError] = useState<string | null>(null);
  const [generatePrompt, setGeneratePrompt] = useState('');
  const [showGenerateInput, setShowGenerateInput] = useState(false);
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp'];
  const MAX_SIZE = 5 * 1024 * 1024; // 5MB

  const validateFile = useCallback((file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return 'Only PNG, JPG, SVG, and WebP files are allowed';
    }
    if (file.size > MAX_SIZE) {
      return 'File must be under 5MB';
    }
    return null;
  }, []);

  const uploadFile = async (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('organizationId', organizationId);

      const response = await fetch('/api/organizations/logo', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      setPreviewUrl(data.logoUrl);
      onLogoUploaded(data.logoUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (disabled || isUploading) return;
    const file = e.dataTransfer.files[0];
    if (file) uploadFile(file);
  }, [disabled, isUploading]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
    e.target.value = '';
  };

  const handleGenerateLogo = async () => {
    if (!generatePrompt.trim()) return;

    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/brand/generate-logo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId,
          prompt: generatePrompt,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Generation failed');
      }

      setGeneratedUrl(data.imageUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Logo generation failed');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveGenerated = async () => {
    if (!generatedUrl) return;

    setIsUploading(true);
    setError(null);

    try {
      // Server already uploaded the generated image to Supabase storage
      // and returned a permanent URL — just use it directly
      const isAlreadyStored = generatedUrl.includes('supabase') || generatedUrl.includes('org-logos');

      if (isAlreadyStored) {
        // Image is already in storage — just set it
        setPreviewUrl(generatedUrl);
        setGeneratedUrl(null);
        setShowGenerateInput(false);
        onLogoUploaded(generatedUrl);
      } else {
        // Fallback: temporary URL (shouldn't happen with updated API, but just in case)
        // Download server-side by re-uploading via the logo upload endpoint
        const imageResponse = await fetch(generatedUrl);
        const blob = await imageResponse.blob();
        const file = new File([blob], 'generated-logo.png', { type: 'image/png' });

        const formData = new FormData();
        formData.append('file', file);
        formData.append('organizationId', organizationId);

        const response = await fetch('/api/organizations/logo', {
          method: 'POST',
          body: formData,
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Save failed');
        }

        setPreviewUrl(data.logoUrl);
        setGeneratedUrl(null);
        setShowGenerateInput(false);
        onLogoUploaded(data.logoUrl);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save generated logo');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = () => {
    setPreviewUrl(null);
    setGeneratedUrl(null);
    setError(null);
  };

  // Show uploaded/existing logo
  if (previewUrl && !generatedUrl) {
    return (
      <div className="border border-teal/30 bg-teal/5 rounded-lg p-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-lg bg-cream-warm border border-stone/10 flex items-center justify-center overflow-hidden flex-shrink-0">
            <img src={previewUrl} alt="Logo" className="max-w-full max-h-full object-contain" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-charcoal">Logo uploaded</p>
            <p className="text-xs text-stone mt-0.5">Your logo is saved and will appear in your brand playbook</p>
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

  // Show generated logo preview for approval
  if (generatedUrl) {
    return (
      <div className="border border-teal/30 bg-teal/5 rounded-lg p-4 space-y-3">
        <p className="text-sm font-medium text-charcoal">AI Generated Logo</p>
        <div className="w-32 h-32 mx-auto rounded-lg bg-cream-warm border border-stone/10 flex items-center justify-center overflow-hidden">
          <img src={generatedUrl} alt="Generated logo" className="max-w-full max-h-full object-contain" />
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleSaveGenerated}
            disabled={isUploading}
            className="flex-1 bg-teal hover:bg-teal/90 text-cream text-sm"
          >
            {isUploading ? 'Saving...' : 'Use this logo'}
          </Button>
          <Button
            onClick={() => { setGeneratedUrl(null); handleGenerateLogo(); }}
            disabled={isGenerating}
            variant="secondary"
            className="text-sm"
          >
            Regenerate
          </Button>
          <Button
            onClick={() => { setGeneratedUrl(null); setShowGenerateInput(false); }}
            variant="ghost"
            className="text-sm"
          >
            Cancel
          </Button>
        </div>
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
    );
  }

  // Show AI generate input
  if (showGenerateInput) {
    return (
      <div className="border border-stone/20 rounded-lg p-4 space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <SparklesIcon className="w-4 h-4 text-teal" />
          <p className="text-sm font-medium text-charcoal">Generate Logo with AI</p>
        </div>
        <textarea
          value={generatePrompt}
          onChange={(e) => setGeneratePrompt(e.target.value)}
          placeholder="Describe the logo you want... e.g., 'A modern shield icon with interconnected nodes, representing strength and network'"
          className="w-full text-sm border border-stone/20 rounded-lg p-3 resize-none focus:outline-none focus:ring-2 focus:ring-teal/30"
          rows={2}
          disabled={isGenerating}
        />
        <div className="flex gap-2">
          <Button
            onClick={handleGenerateLogo}
            disabled={isGenerating || !generatePrompt.trim()}
            className="bg-teal hover:bg-teal/90 text-cream text-sm"
          >
            <SparklesIcon className="w-4 h-4 mr-1" />
            {isGenerating ? 'Generating...' : 'Generate'}
          </Button>
          <Button
            onClick={() => setShowGenerateInput(false)}
            variant="ghost"
            className="text-sm"
            disabled={isGenerating}
          >
            Back to upload
          </Button>
        </div>
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
    );
  }

  // Default: drop zone + generate button
  return (
    <div className="space-y-2">
      <div
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); if (!disabled) setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onClick={() => !disabled && !isUploading && inputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-5 text-center transition-colors cursor-pointer ${
          disabled || isUploading
            ? 'border-stone/20 bg-stone/5 cursor-not-allowed'
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
            <PhotoIcon className={`w-8 h-8 mx-auto mb-2 ${isDragOver ? 'text-teal' : 'text-stone/50'}`} />
            <p className="text-sm font-medium text-charcoal">
              Drop your logo here, or <span className="text-teal">browse</span>
            </p>
            <p className="text-xs text-stone mt-1">
              PNG, JPG, SVG, or WebP — max 5MB
            </p>
          </>
        )}
      </div>

      <button
        onClick={() => setShowGenerateInput(true)}
        disabled={disabled || isUploading}
        className="w-full flex items-center justify-center gap-2 text-sm text-teal hover:text-teal/80 py-2 transition-colors disabled:opacity-50"
      >
        <SparklesIcon className="w-4 h-4" />
        Or generate a logo with AI
      </button>

      {error && <p className="text-xs text-red-500">{error}</p>}

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
}
