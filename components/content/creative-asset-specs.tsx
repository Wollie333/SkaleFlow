'use client';

import { getCreativeSpec } from '@/config/creative-specs';
import type { ContentFormat } from '@/config/script-frameworks';
import { CameraIcon, PhotoIcon, FilmIcon } from '@heroicons/react/24/outline';

interface CreativeAssetSpecsProps {
  format: ContentFormat;
  platforms?: string[];
}

export function CreativeAssetSpecs({ format, platforms = [] }: CreativeAssetSpecsProps) {
  const spec = getCreativeSpec(format);
  if (!spec) return null;

  const Icon = spec.duration ? (spec.duration.includes('min') ? FilmIcon : CameraIcon) : PhotoIcon;

  return (
    <div className="bg-cream-warm rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-2 text-charcoal">
        <Icon className="w-5 h-5 text-teal" />
        <h4 className="font-medium text-sm">Creative Asset Specs</h4>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-stone text-xs">Dimensions</p>
          <p className="text-charcoal font-medium">{spec.dimensions.join(' or ')}</p>
        </div>
        <div>
          <p className="text-stone text-xs">Aspect Ratio</p>
          <p className="text-charcoal font-medium">{spec.aspectRatio.join(' or ')}</p>
        </div>
        <div>
          <p className="text-stone text-xs">File Types</p>
          <p className="text-charcoal font-medium">{spec.fileTypes.join(', ')}</p>
        </div>
        {spec.duration && (
          <div>
            <p className="text-stone text-xs">Duration</p>
            <p className="text-charcoal font-medium">{spec.duration}</p>
          </div>
        )}
      </div>

      {platforms.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-stone/10">
          <p className="text-xs text-stone font-medium">Platform Notes</p>
          {platforms.map(p => {
            const note = spec.platformNotes[p];
            if (!note) return null;
            return (
              <div key={p} className="text-xs">
                <span className="font-medium text-charcoal capitalize">{p}:</span>{' '}
                <span className="text-stone">{note}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
