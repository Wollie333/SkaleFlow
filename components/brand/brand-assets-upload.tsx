'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import {
  ArrowUpTrayIcon,
  XMarkIcon,
  PhotoIcon,
} from '@heroicons/react/24/outline';

export type AssetType = 'primary_logo' | 'logo_dark' | 'logo_light' | 'logo_icon' | 'pattern' | 'mood_board';

interface Asset {
  id: string;
  asset_type: string;
  file_url: string;
  file_name: string;
  sort_order: number;
}

interface BrandAssetsUploadProps {
  organizationId: string;
  disabled?: boolean;
  onAssetsChange?: (assets: Asset[]) => void;
}

const ASSET_CATEGORIES: { type: AssetType; label: string; description: string; multi: boolean }[] = [
  { type: 'primary_logo', label: 'Primary Logo', description: 'Main brand logo', multi: false },
  { type: 'logo_dark', label: 'Logo (Dark Background)', description: 'Logo for dark backgrounds', multi: false },
  { type: 'logo_light', label: 'Logo (Light Background)', description: 'Logo for light backgrounds', multi: false },
  { type: 'logo_icon', label: 'Logo Icon / Favicon', description: 'Square icon mark', multi: false },
  { type: 'pattern', label: 'Patterns & Textures', description: 'Brand patterns, textures, or graphic elements', multi: true },
  { type: 'mood_board', label: 'Mood Board', description: 'Visual references and inspiration images (5-10)', multi: true },
];

const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp'];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

export function BrandAssetsUpload({ organizationId, disabled, onAssetsChange }: BrandAssetsUploadProps) {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // Fetch existing assets
  useEffect(() => {
    async function fetchAssets() {
      try {
        const res = await fetch(`/api/brand/assets?organizationId=${organizationId}`);
        if (res.ok) {
          const data = await res.json();
          setAssets(data.assets || []);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    fetchAssets();
  }, [organizationId]);

  const getAssetsForType = useCallback(
    (type: AssetType) => assets.filter((a) => a.asset_type === type),
    [assets]
  );

  const uploadFile = async (file: File, assetType: AssetType) => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      setErrors((prev) => ({ ...prev, [assetType]: 'Only PNG, JPG, SVG, and WebP allowed' }));
      return;
    }
    if (file.size > MAX_SIZE) {
      setErrors((prev) => ({ ...prev, [assetType]: 'File must be under 10MB' }));
      return;
    }

    setErrors((prev) => ({ ...prev, [assetType]: '' }));
    setUploading((prev) => ({ ...prev, [assetType]: true }));

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('organizationId', organizationId);
      formData.append('assetType', assetType);

      const res = await fetch('/api/brand/assets', { method: 'POST', body: formData });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Upload failed');

      const updated = [...assets.filter((a) => !(a.asset_type === assetType && !ASSET_CATEGORIES.find((c) => c.type === assetType)?.multi)), data.asset];
      // For single-slot types, replace; for multi, append
      const cat = ASSET_CATEGORIES.find((c) => c.type === assetType);
      let newAssets: Asset[];
      if (cat?.multi) {
        newAssets = [...assets, data.asset];
      } else {
        newAssets = [...assets.filter((a) => a.asset_type !== assetType), data.asset];
      }
      setAssets(newAssets);
      onAssetsChange?.(newAssets);
    } catch (err) {
      setErrors((prev) => ({ ...prev, [assetType]: err instanceof Error ? err.message : 'Upload failed' }));
    } finally {
      setUploading((prev) => ({ ...prev, [assetType]: false }));
    }
  };

  const deleteAsset = async (assetId: string, assetType: AssetType) => {
    try {
      const res = await fetch('/api/brand/assets', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assetId, organizationId }),
      });
      if (res.ok) {
        const newAssets = assets.filter((a) => a.id !== assetId);
        setAssets(newAssets);
        onAssetsChange?.(newAssets);
      }
    } catch {
      setErrors((prev) => ({ ...prev, [assetType]: 'Failed to delete' }));
    }
  };

  const handleDrop = useCallback(
    (e: React.DragEvent, assetType: AssetType) => {
      e.preventDefault();
      if (disabled) return;
      const file = e.dataTransfer.files[0];
      if (file) uploadFile(file, assetType);
    },
    [disabled, assets] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, assetType: AssetType) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      // For multi types, upload all selected files
      const cat = ASSET_CATEGORIES.find((c) => c.type === assetType);
      if (cat?.multi && files.length > 1) {
        Array.from(files).forEach((f) => uploadFile(f, assetType));
      } else {
        uploadFile(files[0], assetType);
      }
    }
    e.target.value = '';
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 bg-stone/10 rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Logo Variants Section */}
      <div>
        <h3 className="text-sm font-semibold text-charcoal mb-3">Logo Variants</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {ASSET_CATEGORIES.filter((c) => c.type.startsWith('logo') || c.type === 'primary_logo').map((cat) => {
            const typeAssets = getAssetsForType(cat.type);
            const isUploading = uploading[cat.type];
            const error = errors[cat.type];

            return (
              <div key={cat.type} className="space-y-1.5">
                <label className="text-xs font-medium text-stone">{cat.label}</label>
                {typeAssets.length > 0 ? (
                  <div className="border border-teal/20 bg-teal/5 rounded-lg p-3 flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-white border border-stone/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                      <img src={typeAssets[0].file_url} alt={cat.label} className="max-w-full max-h-full object-contain" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-charcoal truncate">{typeAssets[0].file_name}</p>
                    </div>
                    {!disabled && (
                      <button
                        onClick={() => deleteAsset(typeAssets[0].id, cat.type)}
                        className="p-1 text-stone hover:text-red-500 rounded transition-colors flex-shrink-0"
                      >
                        <XMarkIcon className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ) : (
                  <DropZone
                    assetType={cat.type}
                    description={cat.description}
                    disabled={disabled || isUploading}
                    isUploading={isUploading}
                    onDrop={handleDrop}
                    onClick={() => fileInputRefs.current[cat.type]?.click()}
                  />
                )}
                {error && <p className="text-xs text-red-500">{error}</p>}
                <input
                  ref={(el) => { fileInputRefs.current[cat.type] = el; }}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp"
                  onChange={(e) => handleFileSelect(e, cat.type)}
                  className="hidden"
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Patterns Section */}
      <div>
        <h3 className="text-sm font-semibold text-charcoal mb-1">Patterns & Textures</h3>
        <p className="text-xs text-stone mb-3">Brand patterns, textures, or graphic elements</p>
        <MultiAssetGrid
          assets={getAssetsForType('pattern')}
          assetType="pattern"
          disabled={disabled}
          isUploading={uploading['pattern']}
          error={errors['pattern']}
          onDrop={handleDrop}
          onDelete={deleteAsset}
          onClickUpload={() => fileInputRefs.current['pattern']?.click()}
        />
        <input
          ref={(el) => { fileInputRefs.current['pattern'] = el; }}
          type="file"
          accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp"
          multiple
          onChange={(e) => handleFileSelect(e, 'pattern')}
          className="hidden"
        />
      </div>

      {/* Mood Board Section */}
      <div>
        <h3 className="text-sm font-semibold text-charcoal mb-1">Mood Board</h3>
        <p className="text-xs text-stone mb-3">Upload 5-10 images that represent your brand&apos;s visual direction</p>
        <MultiAssetGrid
          assets={getAssetsForType('mood_board')}
          assetType="mood_board"
          disabled={disabled}
          isUploading={uploading['mood_board']}
          error={errors['mood_board']}
          onDrop={handleDrop}
          onDelete={deleteAsset}
          onClickUpload={() => fileInputRefs.current['mood_board']?.click()}
        />
        <input
          ref={(el) => { fileInputRefs.current['mood_board'] = el; }}
          type="file"
          accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp"
          multiple
          onChange={(e) => handleFileSelect(e, 'mood_board')}
          className="hidden"
        />
      </div>
    </div>
  );
}

function DropZone({
  assetType,
  description,
  disabled,
  isUploading,
  onDrop,
  onClick,
}: {
  assetType: AssetType;
  description: string;
  disabled?: boolean;
  isUploading?: boolean;
  onDrop: (e: React.DragEvent, type: AssetType) => void;
  onClick: () => void;
}) {
  const [isDragOver, setIsDragOver] = useState(false);

  return (
    <div
      onDrop={(e) => { e.preventDefault(); setIsDragOver(false); onDrop(e, assetType); }}
      onDragOver={(e) => { e.preventDefault(); if (!disabled) setIsDragOver(true); }}
      onDragLeave={() => setIsDragOver(false)}
      onClick={() => !disabled && onClick()}
      className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors cursor-pointer ${
        disabled
          ? 'border-stone/15 bg-stone/5 cursor-not-allowed'
          : isDragOver
            ? 'border-teal bg-teal/5'
            : 'border-stone/20 hover:border-teal/40 hover:bg-stone/5'
      }`}
    >
      {isUploading ? (
        <div className="flex items-center justify-center gap-2">
          <div className="w-4 h-4 border-2 border-teal/30 border-t-teal rounded-full animate-spin" />
          <span className="text-xs text-stone">Uploading...</span>
        </div>
      ) : (
        <div className="flex items-center justify-center gap-2">
          <ArrowUpTrayIcon className="w-4 h-4 text-stone/50" />
          <span className="text-xs text-stone">{description}</span>
        </div>
      )}
    </div>
  );
}

function MultiAssetGrid({
  assets,
  assetType,
  disabled,
  isUploading,
  error,
  onDrop,
  onDelete,
  onClickUpload,
}: {
  assets: Asset[];
  assetType: AssetType;
  disabled?: boolean;
  isUploading?: boolean;
  error?: string;
  onDrop: (e: React.DragEvent, type: AssetType) => void;
  onDelete: (id: string, type: AssetType) => void;
  onClickUpload: () => void;
}) {
  const [isDragOver, setIsDragOver] = useState(false);

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
        {assets.map((asset) => (
          <div key={asset.id} className="relative group aspect-square rounded-lg overflow-hidden border border-stone/10 bg-stone/5">
            <img src={asset.file_url} alt={asset.file_name} className="w-full h-full object-cover" />
            {!disabled && (
              <button
                onClick={() => onDelete(asset.id, assetType)}
                className="absolute top-1 right-1 p-1 bg-black/60 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <XMarkIcon className="w-3 h-3" />
              </button>
            )}
          </div>
        ))}
        {/* Add button */}
        {!disabled && (
          <div
            onDrop={(e) => { e.preventDefault(); setIsDragOver(false); onDrop(e, assetType); }}
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onClick={onClickUpload}
            className={`aspect-square rounded-lg border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-colors ${
              isDragOver
                ? 'border-teal bg-teal/5'
                : 'border-stone/20 hover:border-teal/40 hover:bg-stone/5'
            }`}
          >
            {isUploading ? (
              <div className="w-4 h-4 border-2 border-teal/30 border-t-teal rounded-full animate-spin" />
            ) : (
              <>
                <PhotoIcon className="w-5 h-5 text-stone/40 mb-1" />
                <span className="text-[10px] text-stone/60">Add</span>
              </>
            )}
          </div>
        )}
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
