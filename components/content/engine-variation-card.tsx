'use client';

import { useState } from 'react';
import { Card, Badge, Textarea } from '@/components/ui';
import { MediaUpload, type UploadedFile } from './media-upload';
import { SocialPreviewTabs } from './social-preview';
import { cn } from '@/lib/utils';
import { FORMAT_LABELS, type ContentFormat } from '@/config/script-frameworks';
import type { SocialPlatform, FunnelStage } from '@/types/database';

const FUNNEL_COLORS: Record<string, string> = {
  awareness: 'bg-green-100 text-green-800',
  consideration: 'bg-blue-100 text-blue-800',
  conversion: 'bg-orange-100 text-orange-800',
};

interface EngineVariationCardProps {
  item: {
    id: string;
    topic: string | null;
    caption: string | null;
    hashtags: string[] | null;
    funnel_stage: string;
    storybrand_stage: string;
    format: string;
    platforms: string[] | null;
    media_urls: string[] | null;
  };
  editFields: Record<string, string>;
  onFieldChange: (field: string, value: string) => void;
  uploadedFiles: UploadedFile[];
  onFilesChange: (files: UploadedFile[]) => void;
  platforms: SocialPlatform[];
  organizationId: string;
  userName: string;
  isSelected: boolean;
  onToggleSelect: () => void;
}

export function EngineVariationCard({
  item,
  editFields,
  onFieldChange,
  uploadedFiles,
  onFilesChange,
  platforms,
  organizationId,
  userName,
  isSelected,
  onToggleSelect,
}: EngineVariationCardProps) {
  const [showPreview, setShowPreview] = useState(false);

  const caption = editFields.caption ?? item.caption ?? '';
  const hashtags = editFields.hashtags ?? (item.hashtags ? item.hashtags.join(', ') : '');
  const topic = editFields.topic ?? item.topic ?? '';

  return (
    <Card className={cn(
      'relative transition-all border-2',
      isSelected ? 'border-teal/40 shadow-sm' : 'border-transparent'
    )}>
      {/* Selection checkbox */}
      <div className="absolute top-4 right-4">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onToggleSelect}
          className="rounded border-stone/30 text-teal focus:ring-teal w-4 h-4 cursor-pointer"
        />
      </div>

      {/* Badges */}
      <div className="flex items-center gap-2 flex-wrap mb-3 pr-8">
        <Badge className={FUNNEL_COLORS[item.funnel_stage] || 'bg-stone/10 text-stone'}>
          {item.funnel_stage}
        </Badge>
        <Badge className="bg-purple-100 text-purple-800">
          {item.storybrand_stage.replace(/_/g, ' ')}
        </Badge>
        <span className="text-xs text-stone">
          {FORMAT_LABELS[item.format as ContentFormat] || item.format}
        </span>
      </div>

      {/* Caption */}
      <div className="mb-3">
        <label className="text-sm font-medium text-charcoal-700 mb-1 block">Caption</label>
        <Textarea
          value={caption}
          onChange={e => onFieldChange('caption', e.target.value)}
          rows={6}
          placeholder="Post caption..."
          className="text-sm"
        />
      </div>

      {/* Hashtags */}
      <div className="mb-3">
        <label className="text-sm font-medium text-charcoal-700 mb-1 block">Hashtags</label>
        <input
          value={hashtags}
          onChange={e => onFieldChange('hashtags', e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-stone/20 text-sm focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal"
          placeholder="hashtag1, hashtag2, hashtag3"
        />
      </div>

      {/* Topic */}
      <div className="mb-3">
        <label className="text-sm font-medium text-charcoal-700 mb-1 block">Topic</label>
        <input
          value={topic}
          onChange={e => onFieldChange('topic', e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-stone/20 text-sm focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal"
          placeholder="Brief topic summary"
        />
      </div>

      {/* Media Upload */}
      <div className="mb-3">
        <label className="text-sm font-medium text-charcoal-700 mb-1 block">Media</label>
        <MediaUpload
          organizationId={organizationId}
          contentItemId={item.id}
          uploadedFiles={uploadedFiles}
          onFilesChange={onFilesChange}
        />
      </div>

      {/* Preview toggle */}
      {platforms.length > 0 && (
        <div>
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="text-xs font-medium text-teal hover:underline mb-2"
          >
            {showPreview ? 'Hide Preview' : 'Show Platform Preview'}
          </button>

          {showPreview && (
            <div className="border border-stone/10 rounded-lg p-3">
              <SocialPreviewTabs
                platforms={platforms}
                caption={caption}
                hashtags={hashtags.split(',').map(h => h.trim()).filter(Boolean)}
                mediaUrls={[
                  ...uploadedFiles.map(f => f.url),
                  ...(item.media_urls || []),
                ]}
                userName={userName}
              />
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
