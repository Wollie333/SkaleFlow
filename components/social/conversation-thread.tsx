'use client';

import { formatDistanceToNow } from 'date-fns';
import { SentimentIndicator } from './sentiment-indicator';
import { ReplyComposer } from './reply-composer';
import {
  ChatBubbleLeftIcon,
  LinkIcon,
  UserIcon,
} from '@heroicons/react/24/outline';

interface ConversationThreadProps {
  interaction: any;
  onReply: (interactionId: string, message: string) => Promise<void>;
  savedReplies: any[];
  teamMembers: any[];
}

export function ConversationThread({
  interaction,
  onReply,
  savedReplies,
  teamMembers,
}: ConversationThreadProps) {
  const handleReply = async (message: string) => {
    await onReply(interaction.id, message);
  };

  return (
    <div className="bg-white rounded-xl border border-stone/10 overflow-hidden sticky top-6">
      {/* Header */}
      <div className="px-6 py-4 border-b border-stone/10">
        <div className="flex items-start gap-3">
          {interaction.author_avatar_url ? (
            <img
              src={interaction.author_avatar_url}
              alt={interaction.author_name}
              className="w-12 h-12 rounded-full"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-stone/10 flex items-center justify-center">
              <UserIcon className="w-6 h-6 text-stone" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-charcoal">
              {interaction.author_name || interaction.author_username || 'Unknown User'}
            </h3>
            {interaction.author_username && (
              <p className="text-sm text-stone">@{interaction.author_username}</p>
            )}
          </div>
        </div>
      </div>

      {/* Conversation */}
      <div className="px-6 py-4 max-h-[400px] overflow-y-auto space-y-4">
        {/* Original interaction */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-stone">
              {formatDistanceToNow(new Date(interaction.interaction_timestamp), { addSuffix: true })}
            </span>
            {interaction.sentiment && (
              <SentimentIndicator sentiment={interaction.sentiment} size="sm" showLabel />
            )}
          </div>
          <p className="text-sm text-charcoal leading-relaxed">{interaction.message}</p>

          {/* Media */}
          {interaction.has_media && interaction.media_urls && (
            <div className="grid grid-cols-2 gap-2 mt-3">
              {interaction.media_urls.slice(0, 4).map((url: string, index: number) => (
                <img
                  key={index}
                  src={url}
                  alt={`Media ${index + 1}`}
                  className="rounded-lg w-full h-24 object-cover"
                />
              ))}
            </div>
          )}

          {/* Context link */}
          {interaction.published_post?.post_url && (
            <a
              href={interaction.published_post.post_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-xs text-teal hover:text-teal-dark mt-2"
            >
              <LinkIcon className="w-3 h-3" />
              View original post
            </a>
          )}
        </div>

        {/* Thread replies would go here */}
        {/* TODO: Add threaded replies when we have nested interactions */}
      </div>

      {/* Reply Composer */}
      <div className="px-6 py-4 border-t border-stone/10">
        <ReplyComposer
          onReply={handleReply}
          savedReplies={savedReplies}
          placeholder={`Reply to ${interaction.author_name || 'user'}...`}
        />
      </div>

      {/* Meta Info */}
      <div className="px-6 py-3 bg-stone/5 border-t border-stone/10">
        <div className="flex items-center justify-between text-xs text-stone">
          <div className="flex items-center gap-4">
            <span className="capitalize">{interaction.platform}</span>
            <span className="capitalize">{interaction.interaction_type.replace('_', ' ')}</span>
          </div>
          {interaction.assigned_user && (
            <span className="flex items-center gap-1">
              <UserIcon className="w-3 h-3" />
              Assigned to {interaction.assigned_user.full_name || interaction.assigned_user.email}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
