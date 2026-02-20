'use client';

import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  ChatBubbleLeftIcon,
  EnvelopeIcon,
  AtSymbolIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';
import { SentimentIndicator } from './sentiment-indicator';

interface InteractionCardProps {
  interaction: any;
  isSelected: boolean;
  onClick: () => void;
  onMarkAsRead: () => void;
}

const PLATFORM_COLORS: Record<string, string> = {
  linkedin: 'bg-blue-600',
  facebook: 'bg-blue-500',
  instagram: 'bg-pink-500',
  twitter: 'bg-sky-400',
  tiktok: 'bg-black',
  youtube: 'bg-red-600',
};

export function InteractionCard({
  interaction,
  isSelected,
  onClick,
  onMarkAsRead,
}: InteractionCardProps) {
  const getTypeIcon = () => {
    switch (interaction.interaction_type) {
      case 'comment':
        return ChatBubbleLeftIcon;
      case 'dm':
        return EnvelopeIcon;
      case 'mention':
        return AtSymbolIcon;
      default:
        return ChatBubbleLeftIcon;
    }
  };

  const TypeIcon = getTypeIcon();

  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-cream-warm rounded-xl border border-stone/10 p-4 hover:shadow-md transition-all cursor-pointer',
        isSelected && 'ring-2 ring-teal',
        !interaction.is_read && 'bg-teal/5'
      )}
    >
      <div className="flex items-start gap-4">
        {/* Avatar or Icon */}
        <div className="flex-shrink-0">
          {interaction.author_avatar_url ? (
            <img
              src={interaction.author_avatar_url}
              alt={interaction.author_name}
              className="w-10 h-10 rounded-full"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-stone/10 flex items-center justify-center">
              <TypeIcon className="w-5 h-5 text-stone" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-charcoal truncate">
                  {interaction.author_name || interaction.author_username || 'Unknown User'}
                </span>
                {interaction.author_username && (
                  <span className="text-xs text-stone truncate">@{interaction.author_username}</span>
                )}
                {/* Platform badge */}
                <span
                  className={cn(
                    'w-2 h-2 rounded-full',
                    PLATFORM_COLORS[interaction.platform] || 'bg-stone'
                  )}
                  title={interaction.platform}
                />
              </div>
              <p className="text-xs text-stone mt-0.5">
                {formatDistanceToNow(new Date(interaction.interaction_timestamp), { addSuffix: true })}
              </p>
            </div>

            {/* Sentiment */}
            {interaction.sentiment && (
              <SentimentIndicator sentiment={interaction.sentiment} size="sm" />
            )}
          </div>

          {/* Message */}
          <p className="text-sm text-charcoal line-clamp-2">{interaction.message}</p>

          {/* Footer */}
          <div className="flex items-center gap-3 mt-3">
            {/* Type badge */}
            <span className="text-xs px-2 py-1 rounded bg-stone/10 text-stone capitalize">
              {interaction.interaction_type.replace('_', ' ')}
            </span>

            {/* Status indicators */}
            {!interaction.is_read && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onMarkAsRead();
                }}
                className="text-xs text-teal hover:text-teal-dark font-medium flex items-center gap-1"
              >
                <CheckIcon className="w-3 h-3" />
                Mark as read
              </button>
            )}

            {interaction.is_replied && (
              <span className="text-xs text-green-600 flex items-center gap-1">
                <CheckIcon className="w-3 h-3" />
                Replied
              </span>
            )}

            {interaction.is_flagged && (
              <span className="text-xs px-2 py-1 rounded bg-amber-100 text-amber-700">
                Flagged
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
