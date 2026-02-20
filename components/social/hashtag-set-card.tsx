'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import {
  PencilIcon,
  TrashIcon,
  ClipboardDocumentIcon,
  CheckIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';

interface HashtagSetCardProps {
  set: any;
  onEdit: () => void;
  onDelete: () => void;
  onCopy: () => void;
}

const PLATFORM_COLORS: Record<string, string> = {
  linkedin: 'bg-[#0A66C2]',
  facebook: 'bg-[#1877F2]',
  instagram: 'bg-gradient-to-br from-[#F58529] via-[#DD2A7B] to-[#8134AF]',
  twitter: 'bg-[#1DA1F2]',
  tiktok: 'bg-[#000000]',
  youtube: 'bg-[#FF0000]',
};

export function HashtagSetCard({ set, onEdit, onDelete, onCopy }: HashtagSetCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    onCopy();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      industry: 'bg-blue-500/10 text-blue-400 border-blue-200',
      trending: 'bg-pink-100 text-pink-700 border-pink-200',
      branded: 'bg-purple-100 text-purple-700 border-purple-200',
      campaign: 'bg-green-500/10 text-green-400 border-green-200',
    };
    return colors[category?.toLowerCase()] || 'bg-cream text-charcoal border-stone/10';
  };

  return (
    <div className="group bg-cream-warm rounded-xl border border-stone/10 overflow-hidden hover:shadow-lg transition-shadow">
      {/* Header */}
      <div className="p-4 border-b border-stone/10">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-charcoal truncate">{set.name}</h3>
            {set.description && (
              <p className="text-sm text-stone mt-1 line-clamp-2">{set.description}</p>
            )}
          </div>

          {/* Category Badge */}
          {set.category && (
            <span
              className={cn(
                'px-2 py-1 text-xs font-medium rounded-lg border flex-shrink-0',
                getCategoryColor(set.category)
              )}
            >
              {set.category}
            </span>
          )}
        </div>

        {/* Platform Indicators */}
        {set.platforms && set.platforms.length > 0 && (
          <div className="flex items-center gap-1.5">
            {set.platforms.map((platform: string) => (
              <div
                key={platform}
                className={cn('w-2 h-2 rounded-full', PLATFORM_COLORS[platform] || 'bg-stone')}
                title={platform}
              />
            ))}
          </div>
        )}
      </div>

      {/* Hashtags Preview */}
      <div className="p-4">
        <div className="flex flex-wrap gap-2 mb-3">
          {set.hashtags.slice(0, 8).map((tag: string, index: number) => (
            <span
              key={index}
              className="px-2 py-1 bg-cream text-charcoal text-xs rounded-lg border border-stone/10"
            >
              {tag.startsWith('#') ? tag : `#${tag}`}
            </span>
          ))}
          {set.hashtags.length > 8 && (
            <span className="px-2 py-1 bg-stone/10 text-stone text-xs rounded-lg border border-stone/10">
              +{set.hashtags.length - 8} more
            </span>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 pt-3 border-t border-stone/10">
          <div>
            <p className="text-xs text-stone mb-0.5">Tags</p>
            <p className="text-sm font-semibold text-charcoal">{set.hashtags.length}</p>
          </div>
          <div>
            <p className="text-xs text-stone mb-0.5">Used</p>
            <p className="text-sm font-semibold text-charcoal">
              {set.use_count || set.metrics?.totalUses || 0}
            </p>
          </div>
          <div>
            <p className="text-xs text-stone mb-0.5">Engagement</p>
            <p className="text-sm font-semibold text-teal">
              {set.metrics?.avgEngagement || 0}%
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="px-4 py-3 bg-stone/5 border-t border-stone/10 flex items-center justify-between gap-2">
        <button
          onClick={handleCopy}
          className={cn(
            'flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all',
            copied
              ? 'bg-green-500 text-white border-green-500'
              : 'bg-cream-warm text-charcoal border-stone/20 hover:border-teal hover:text-teal'
          )}
        >
          {copied ? (
            <>
              <CheckIcon className="w-3.5 h-3.5" />
              Copied!
            </>
          ) : (
            <>
              <ClipboardDocumentIcon className="w-3.5 h-3.5" />
              Copy
            </>
          )}
        </button>

        <div className="flex items-center gap-1">
          <button
            onClick={onEdit}
            className="p-1.5 text-stone hover:text-teal hover:bg-teal/10 rounded-lg transition-colors"
            title="Edit"
          >
            <PencilIcon className="w-4 h-4" />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 text-stone hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Delete"
          >
            <TrashIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Last Used Footer */}
      {set.last_used_at && (
        <div className="px-4 py-2 bg-stone/5 border-t border-stone/10">
          <p className="text-xs text-stone">
            Last used {new Date(set.last_used_at).toLocaleDateString()}
          </p>
        </div>
      )}
    </div>
  );
}
