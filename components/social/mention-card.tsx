'use client';

import { formatDistanceToNow } from 'date-fns';
import { SentimentIndicator } from './sentiment-indicator';
import {
  FlagIcon,
  EnvelopeOpenIcon,
  LinkIcon,
  UserIcon,
} from '@heroicons/react/24/outline';
import { FlagIcon as FlagIconSolid } from '@heroicons/react/24/solid';
import { cn } from '@/lib/utils';

interface MentionCardProps {
  mention: any;
  onMarkAsRead: () => void;
  onToggleFlag: () => void;
}

const PLATFORM_COLORS: Record<string, string> = {
  twitter: 'bg-[#1DA1F2]',
  linkedin: 'bg-[#0A66C2]',
  facebook: 'bg-[#1877F2]',
  instagram: 'bg-gradient-to-br from-[#F58529] via-[#DD2A7B] to-[#8134AF]',
  reddit: 'bg-[#FF4500]',
  news: 'bg-[#4CAF50]',
  blog: 'bg-[#9C27B0]',
};

export function MentionCard({ mention, onMarkAsRead, onToggleFlag }: MentionCardProps) {
  const getPlatformColor = (platform: string) => {
    return PLATFORM_COLORS[platform?.toLowerCase()] || 'bg-stone';
  };

  return (
    <div
      className={cn(
        'p-6 hover:bg-cream/30 transition-colors',
        !mention.is_read && 'bg-teal/5'
      )}
    >
      <div className="flex items-start gap-4">
        {/* Avatar */}
        {mention.author_avatar_url ? (
          <img
            src={mention.author_avatar_url}
            alt={mention.author_name || 'User'}
            className="w-12 h-12 rounded-full flex-shrink-0"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-stone/10 flex items-center justify-center flex-shrink-0">
            <UserIcon className="w-6 h-6 text-stone" />
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p className="font-semibold text-charcoal truncate">
                  {mention.author_name || mention.author_username || 'Unknown User'}
                </p>
                {mention.author_username && mention.author_name && (
                  <span className="text-sm text-stone">@{mention.author_username}</span>
                )}
                {/* Platform indicator */}
                <div
                  className={cn('w-2 h-2 rounded-full', getPlatformColor(mention.platform))}
                  title={mention.platform}
                />
              </div>
              <div className="flex items-center gap-3 text-xs text-stone">
                <span className="capitalize">{mention.platform}</span>
                <span>•</span>
                <span>
                  {formatDistanceToNow(new Date(mention.published_at), { addSuffix: true })}
                </span>
                {!mention.is_read && (
                  <>
                    <span>•</span>
                    <span className="text-teal font-medium">Unread</span>
                  </>
                )}
              </div>
            </div>

            {/* Sentiment & Actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {mention.sentiment && <SentimentIndicator sentiment={mention.sentiment} size="sm" />}

              <button
                onClick={onToggleFlag}
                className={cn(
                  'p-1.5 rounded-lg transition-colors',
                  mention.is_flagged
                    ? 'text-orange-600 hover:bg-orange-50'
                    : 'text-stone hover:bg-stone/10'
                )}
                title={mention.is_flagged ? 'Unflag' : 'Flag'}
              >
                {mention.is_flagged ? (
                  <FlagIconSolid className="w-4 h-4" />
                ) : (
                  <FlagIcon className="w-4 h-4" />
                )}
              </button>

              {!mention.is_read && (
                <button
                  onClick={onMarkAsRead}
                  className="p-1.5 text-stone hover:text-teal hover:bg-teal/10 rounded-lg transition-colors"
                  title="Mark as read"
                >
                  <EnvelopeOpenIcon className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Mention Content */}
          <p className="text-sm text-charcoal leading-relaxed mb-3">{mention.content}</p>

          {/* Media */}
          {mention.has_image && mention.media_urls && mention.media_urls.length > 0 && (
            <div className="grid grid-cols-2 gap-2 mb-3">
              {mention.media_urls.slice(0, 4).map((url: string, index: number) => (
                <img
                  key={index}
                  src={url}
                  alt={`Media ${index + 1}`}
                  className="rounded-lg w-full h-24 object-cover"
                />
              ))}
            </div>
          )}

          {/* Brand detected in media */}
          {mention.brand_detected_in_media && (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-purple-100 text-purple-700 rounded-lg text-xs font-medium mb-3">
              <span>🎯</span>
              Brand detected in image/video
            </div>
          )}

          {/* Topics */}
          {mention.topics && mention.topics.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {mention.topics.slice(0, 5).map((topic: string, index: number) => (
                <span
                  key={index}
                  className="px-2 py-0.5 bg-stone/10 text-stone text-xs rounded-lg"
                >
                  {topic}
                </span>
              ))}
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between">
            {/* Source link */}
            {mention.url && (
              <a
                href={mention.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-teal hover:text-teal-dark font-medium"
              >
                <LinkIcon className="w-3.5 h-3.5" />
                View original
              </a>
            )}

            {/* Engagement metrics */}
            {mention.engagement_count > 0 && (
              <span className="text-xs text-stone">
                {mention.engagement_count.toLocaleString()} engagement
                {mention.engagement_count === 1 ? '' : 's'}
              </span>
            )}
          </div>

          {/* Notes */}
          {mention.notes && (
            <div className="mt-3 p-3 bg-stone/5 rounded-lg border border-stone/10">
              <p className="text-xs text-stone">
                <strong className="text-charcoal">Note:</strong> {mention.notes}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
