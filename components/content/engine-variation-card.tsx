'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, Badge, Textarea } from '@/components/ui';
import { MediaUpload, type UploadedFile } from './media-upload';
import { SocialPreviewTabs } from './social-preview';
import { cn } from '@/lib/utils';
import { FORMAT_LABELS, type ContentFormat } from '@/config/script-frameworks';
import { ArrowPathIcon, XMarkIcon, PencilSquareIcon, CheckIcon } from '@heroicons/react/24/outline';
import type { SocialPlatform, FunnelStage } from '@/types/database';

const FUNNEL_COLORS: Record<string, string> = {
  awareness: 'bg-green-500/10 text-green-400',
  consideration: 'bg-blue-500/10 text-blue-400',
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
  onRegenerate?: (itemId: string) => void;
  onReject?: (itemId: string) => void;
  isRegenerating?: boolean;
  isRejected?: boolean;
  isExpanded: boolean;
  onExpand: () => void;
  onCollapse: () => void;
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
  onRegenerate,
  onReject,
  isRegenerating,
  isRejected,
  isExpanded,
  onExpand,
  onCollapse,
}: EngineVariationCardProps) {
  const [showPreview, setShowPreview] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const caption = editFields.caption ?? item.caption ?? '';
  const hashtags = editFields.hashtags ?? (item.hashtags ? item.hashtags.join(', ') : '');
  const topic = editFields.topic ?? item.topic ?? '';

  const hasEdits = Object.keys(editFields).length > 0 || uploadedFiles.length > 0;

  // Click-outside to collapse
  useEffect(() => {
    if (!isExpanded) return;
    function handleClickOutside(e: MouseEvent) {
      if (cardRef.current && !cardRef.current.contains(e.target as Node)) {
        onCollapse();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isExpanded, onCollapse]);

  return (
    <div ref={cardRef}>
    <Card
      className={cn(
        'relative transition-all border-2',
        isRejected
          ? 'border-red-300 opacity-50'
          : isExpanded
            ? 'border-teal/60 shadow-md ring-1 ring-teal/20'
            : isSelected ? 'border-teal/40 shadow-sm' : 'border-transparent hover:border-stone/20',
        !isExpanded && !isRejected && 'cursor-pointer'
      )}
      onClick={() => {
        if (!isExpanded && !isRejected) onExpand();
      }}
    >
      {/* Rejected overlay badge */}
      {isRejected && (
        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
          <span className="bg-red-600 text-white text-sm font-semibold px-4 py-1.5 rounded-full shadow-lg">
            Rejected
          </span>
        </div>
      )}

      {/* Top-right controls */}
      <div className="absolute top-4 right-4 flex items-center gap-2">
        {!isExpanded && !isRejected && hasEdits && (
          <span className="w-2 h-2 rounded-full bg-gold" title="Unsaved edits" />
        )}
        {!isExpanded && !isRejected && (
          <button
            onClick={e => { e.stopPropagation(); onExpand(); }}
            className="p-1 rounded hover:bg-stone/10 text-stone hover:text-charcoal transition-colors"
            title="Edit"
          >
            <PencilSquareIcon className="w-4 h-4" />
          </button>
        )}
        <input
          type="checkbox"
          checked={isSelected}
          onChange={e => { e.stopPropagation(); onToggleSelect(); }}
          disabled={isRejected}
          className={cn(
            'rounded border-stone/30 text-teal focus:ring-teal w-4 h-4',
            isRejected ? 'cursor-not-allowed opacity-40' : 'cursor-pointer'
          )}
        />
      </div>

      {/* Badges */}
      <div className="flex items-center gap-2 flex-wrap mb-3 pr-20">
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

      {/* ─── COMPACT MODE ─── */}
      {!isExpanded && (
        <div className="space-y-1">
          <p className="text-sm text-charcoal line-clamp-4 whitespace-pre-wrap">
            {caption || <span className="text-stone italic">No caption yet</span>}
          </p>
          {hashtags && (
            <p className="text-xs text-teal/70 truncate">
              {hashtags.split(',').map(h => h.trim()).filter(Boolean).map(h => h.startsWith('#') ? h : `#${h}`).join(' ')}
            </p>
          )}
        </div>
      )}

      {/* ─── EXPANDED MODE ─── */}
      {isExpanded && (
        <div onClick={e => e.stopPropagation()}>
          {/* Caption */}
          <div className="mb-3">
            <label className="text-sm font-medium text-charcoal-700 mb-1 block">Caption</label>
            <Textarea
              value={caption}
              onChange={e => onFieldChange('caption', e.target.value)}
              rows={6}
              placeholder="Post caption..."
              className="text-sm"
              disabled={isRejected}
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
              disabled={isRejected}
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
              disabled={isRejected}
            />
          </div>

          {/* Media Upload */}
          {!isRejected && (
            <div className="mb-3">
              <label className="text-sm font-medium text-charcoal-700 mb-1 block">Media</label>
              <MediaUpload
                organizationId={organizationId}
                contentItemId={item.id}
                uploadedFiles={uploadedFiles}
                onFilesChange={onFilesChange}
              />
            </div>
          )}

          {/* Preview toggle */}
          {!isRejected && platforms.length > 0 && (
            <div className="mb-3">
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

          {/* Done button */}
          <div className="flex justify-end mb-1">
            <button
              onClick={onCollapse}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium bg-teal text-white hover:bg-teal/90 transition-colors"
            >
              <CheckIcon className="w-4 h-4" />
              Done
            </button>
          </div>
        </div>
      )}

      {/* Action bar: Regenerate / Reject */}
      {(onRegenerate || onReject) && (
        <div className="flex items-center gap-2 pt-3 border-t border-stone/10" onClick={e => e.stopPropagation()}>
          {onRegenerate && (
            <button
              onClick={() => onRegenerate(item.id)}
              disabled={isRegenerating}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
                isRegenerating
                  ? 'border-stone/20 text-stone cursor-wait'
                  : 'border-teal/30 text-teal hover:bg-teal/5'
              )}
            >
              <ArrowPathIcon className={cn('w-3.5 h-3.5', isRegenerating && 'animate-spin')} />
              {isRegenerating ? 'Regenerating...' : 'Regenerate'}
            </button>
          )}
          {onReject && !isRejected && (
            <button
              onClick={() => onReject(item.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
            >
              <XMarkIcon className="w-3.5 h-3.5" />
              Reject
            </button>
          )}
        </div>
      )}
    </Card>
    </div>
  );
}
