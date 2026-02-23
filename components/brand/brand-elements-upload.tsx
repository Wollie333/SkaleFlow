'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import {
  ArrowUpTrayIcon,
  XMarkIcon,
  PhotoIcon,
} from '@heroicons/react/24/outline';
import type { AssetType } from './brand-assets-upload';

interface Asset {
  id: string;
  asset_type: string;
  file_url: string;
  file_name: string;
  sort_order: number;
}

interface BrandElementsUploadProps {
  organizationId: string;
  phaseId: string;
  onOutputSaved?: () => void;
}

const ELEMENT_CATEGORIES: { type: AssetType; label: string; description: string; outputKey: string }[] = [
  {
    type: 'brand_element',
    label: 'Brand Elements',
    description: 'Icons, shapes, graphic devices, patterns that make up your visual identity',
    outputKey: 'brand_elements',
  },
  {
    type: 'visual_inspiration',
    label: 'Visual Inspirations',
    description: 'Reference images from brands or designs you admire',
    outputKey: 'visual_inspirations',
  },
];

const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp'];
const MAX_SIZE = 10 * 1024 * 1024;

export function BrandElementsUpload({ organizationId, phaseId, onOutputSaved }: BrandElementsUploadProps) {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    async function fetchAssets() {
      try {
        const res = await fetch(`/api/brand/assets?organizationId=${organizationId}`);
        if (res.ok) {
          const data = await res.json();
          setAssets((data.assets || []).filter((a: Asset) =>
            a.asset_type === 'brand_element' || a.asset_type === 'visual_inspiration'
          ));
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    fetchAssets();
  }, [organizationId]);

  const syncToVariable = useCallback(async (assetType: AssetType, updatedAssets: Asset[]) => {
    const cat = ELEMENT_CATEGORIES.find(c => c.type === assetType);
    if (!cat) return;
    const urls = updatedAssets.filter(a => a.asset_type === assetType).map(a => a.file_url);
    try {
      await fetch('/api/brand/variable', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId,
          phaseId,
          outputKey: cat.outputKey,
          action: 'update',
          value: urls.length > 0 ? urls : 'none',
        }),
      });
      onOutputSaved?.();
    } catch {
      // silent
    }
  }, [organizationId, phaseId, onOutputSaved]);

  const uploadFile = async (file: File, assetType: AssetType) => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      setErrors(prev => ({ ...prev, [assetType]: 'Only PNG, JPG, SVG, and WebP allowed' }));
      return;
    }
    if (file.size > MAX_SIZE) {
      setErrors(prev => ({ ...prev, [assetType]: 'File must be under 10MB' }));
      return;
    }

    setErrors(prev => ({ ...prev, [assetType]: '' }));
    setUploading(prev => ({ ...prev, [assetType]: true }));

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('organizationId', organizationId);
      formData.append('assetType', assetType);

      const res = await fetch('/api/brand/assets', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');

      const newAssets = [...assets, data.asset];
      setAssets(newAssets);
      syncToVariable(assetType, newAssets);
    } catch (err) {
      setErrors(prev => ({ ...prev, [assetType]: err instanceof Error ? err.message : 'Upload failed' }));
    } finally {
      setUploading(prev => ({ ...prev, [assetType]: false }));
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
        const newAssets = assets.filter(a => a.id !== assetId);
        setAssets(newAssets);
        syncToVariable(assetType, newAssets);
      }
    } catch {
      setErrors(prev => ({ ...prev, [assetType]: 'Failed to delete' }));
    }
  };

  const handleDrop = useCallback((e: React.DragEvent, assetType: AssetType) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    files.forEach(f => uploadFile(f, assetType));
  }, [assets]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, assetType: AssetType) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach(f => uploadFile(f, assetType));
    }
    e.target.value = '';
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-3">
        <div className="h-16 bg-stone/10 rounded-lg" />
        <div className="h-16 bg-stone/10 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {ELEMENT_CATEGORIES.map(cat => {
        const catAssets = assets.filter(a => a.asset_type === cat.type);
        const isUploading = uploading[cat.type];
        const error = errors[cat.type];

        return (
          <div key={cat.type}>
            <h3 className="text-xs font-semibold text-charcoal mb-1">{cat.label}</h3>
            <p className="text-[10px] text-stone mb-2">{cat.description}</p>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {catAssets.map(asset => (
                <div key={asset.id} className="relative group aspect-square rounded-lg overflow-hidden border border-stone/10 bg-stone/5">
                  <img src={asset.file_url} alt={asset.file_name} className="w-full h-full object-cover" />
                  <button
                    onClick={() => deleteAsset(asset.id, cat.type)}
                    className="absolute top-1 right-1 p-1 bg-black/60 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <XMarkIcon className="w-3 h-3" />
                  </button>
                </div>
              ))}
              <UploadTile
                assetType={cat.type}
                isUploading={isUploading}
                onDrop={handleDrop}
                onClickUpload={() => fileInputRefs.current[cat.type]?.click()}
              />
            </div>
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
            <input
              ref={el => { fileInputRefs.current[cat.type] = el; }}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp"
              multiple
              onChange={e => handleFileSelect(e, cat.type)}
              className="hidden"
            />
          </div>
        );
      })}
    </div>
  );
}

function UploadTile({
  assetType,
  isUploading,
  onDrop,
  onClickUpload,
}: {
  assetType: AssetType;
  isUploading?: boolean;
  onDrop: (e: React.DragEvent, type: AssetType) => void;
  onClickUpload: () => void;
}) {
  const [isDragOver, setIsDragOver] = useState(false);

  return (
    <div
      onDrop={e => { e.preventDefault(); setIsDragOver(false); onDrop(e, assetType); }}
      onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
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
  );
}
