'use client';

import { useState } from 'react';
import { Button, Card } from '@/components/ui';
import {
  getPlacementConfig,
  getPlacementLabel,
  getPlatformFromPlacement,
  PLATFORM_LABELS,
} from '@/config/placement-types';
import type { PlacementType } from '@/types/database';
import { XMarkIcon } from '@heroicons/react/24/outline';

export interface InstanceSpec {
  caption?: string;
  hashtags?: string[];
  title?: string;
}

interface InstanceEditFormProps {
  placementType: PlacementType;
  masterCaption: string;
  masterHashtags: string[];
  instanceSpec: InstanceSpec;
  onSave: (placementType: PlacementType, spec: InstanceSpec) => void;
  onCancel: () => void;
}

export function InstanceEditForm({
  placementType,
  masterCaption,
  masterHashtags,
  instanceSpec,
  onSave,
  onCancel,
}: InstanceEditFormProps) {
  const [caption, setCaption] = useState(instanceSpec.caption || '');
  const [hashtags, setHashtags] = useState(instanceSpec.hashtags?.join(', ') || '');
  const [title, setTitle] = useState(instanceSpec.title || '');

  const config = getPlacementConfig(placementType);
  const platform = getPlatformFromPlacement(placementType);
  const platformLabel = PLATFORM_LABELS[platform];
  const placementLabel = getPlacementLabel(placementType);
  const maxCaption = config?.maxCaptionLength || 3000;

  // Title field is only for articles, videos, and community posts
  const showTitle = [
    'linkedin_article',
    'youtube_video',
    'youtube_short',
    'youtube_community_post',
  ].includes(placementType);

  // Hide hashtags for very short formats
  const showHashtags = maxCaption > 300;

  // Build rules info
  const rules: string[] = [];
  if (config?.requiresVideo) rules.push('Requires video');
  else if (config?.requiresMedia) rules.push('Requires media');
  if (config?.aspectRatios && config.aspectRatios.length > 0) {
    rules.push(`Aspect: ${config.aspectRatios.join(', ')}`);
  }

  const handleSave = () => {
    const spec: InstanceSpec = {};
    if (caption.trim()) spec.caption = caption.trim();
    if (showTitle && title.trim()) spec.title = title.trim();
    if (showHashtags && hashtags.trim()) {
      spec.hashtags = hashtags.split(',').map(t => t.trim()).filter(Boolean);
    }
    onSave(placementType, spec);
  };

  return (
    <div className="animate-slide-in-right">
      <Card>
        {/* Header */}
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-sm font-semibold text-charcoal">
            Edit: {platformLabel} {placementLabel}
          </h3>
          <button
            onClick={onCancel}
            className="p-1 rounded-md hover:bg-stone-100 transition-colors"
          >
            <XMarkIcon className="w-4 h-4 text-stone" />
          </button>
        </div>
        <p className="text-xs text-stone mb-4">
          Override master content for this placement. Leave blank to use master.
        </p>

        <div className="space-y-4">
          {/* Title (conditional) */}
          {showTitle && (
            <div>
              <label className="text-sm font-medium text-charcoal-700 mb-1 block">Title</label>
              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Leave blank to use master topic..."
                className="w-full px-3 py-2 rounded-lg border border-stone/20 text-sm focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal"
              />
            </div>
          )}

          {/* Caption */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm font-medium text-charcoal-700">Caption</label>
              <span className="text-xs text-stone">
                {caption.length.toLocaleString()} / {maxCaption.toLocaleString()}
              </span>
            </div>
            <textarea
              value={caption}
              onChange={e => setCaption(e.target.value)}
              rows={6}
              maxLength={maxCaption}
              placeholder={masterCaption || 'Leave blank to use master caption...'}
              className="w-full px-3 py-2 rounded-lg border border-stone/20 text-sm focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal resize-none"
            />
          </div>

          {/* Hashtags (conditional) */}
          {showHashtags && (
            <div>
              <label className="text-sm font-medium text-charcoal-700 mb-1 block">Hashtags</label>
              <input
                value={hashtags}
                onChange={e => setHashtags(e.target.value)}
                placeholder={masterHashtags.join(', ') || 'Leave blank to use master hashtags...'}
                className="w-full px-3 py-2 rounded-lg border border-stone/20 text-sm focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal"
              />
            </div>
          )}

          {/* Rules info bar */}
          {rules.length > 0 && (
            <div className="bg-cream-warm rounded-lg px-3 py-2 flex items-center gap-2">
              <span className="text-xs text-stone">{rules.join(' · ')}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <Button onClick={handleSave} size="sm">
              Save Instance
            </Button>
            <Button onClick={onCancel} variant="ghost" size="sm">
              Cancel
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
