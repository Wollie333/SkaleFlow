'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { PaperAirplaneIcon, BookmarkIcon } from '@heroicons/react/24/outline';
import { SavedRepliesPicker } from './saved-replies-picker';

interface ReplyComposerProps {
  onReply: (message: string) => Promise<void>;
  savedReplies: any[];
  placeholder?: string;
}

export function ReplyComposer({
  onReply,
  savedReplies,
  placeholder = 'Write your reply...',
}: ReplyComposerProps) {
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSavedReplies, setShowSavedReplies] = useState(false);

  const handleSubmit = async () => {
    if (!message.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onReply(message.trim());
      setMessage('');
    } catch (error) {
      console.error('Error sending reply:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSelectSavedReply = (content: string) => {
    setMessage(content);
    setShowSavedReplies(false);
  };

  return (
    <div className="space-y-3">
      {/* Textarea */}
      <div className="relative">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={3}
          className="w-full px-3 py-2 border border-stone/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal resize-none text-sm"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Saved Replies Button */}
          {savedReplies.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setShowSavedReplies(!showSavedReplies)}
                className={cn(
                  'flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors',
                  showSavedReplies
                    ? 'bg-teal text-white border-teal'
                    : 'bg-white text-stone border-stone/20 hover:border-teal hover:text-teal'
                )}
              >
                <BookmarkIcon className="w-4 h-4" />
                Saved Replies
              </button>

              {showSavedReplies && (
                <SavedRepliesPicker
                  savedReplies={savedReplies}
                  onSelect={handleSelectSavedReply}
                  onClose={() => setShowSavedReplies(false)}
                />
              )}
            </div>
          )}

          <span className="text-xs text-stone">
            {message.length > 0 && `${message.length} characters`}
          </span>
        </div>

        {/* Send Button */}
        <button
          onClick={handleSubmit}
          disabled={!message.trim() || isSubmitting}
          className={cn(
            'flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors',
            message.trim() && !isSubmitting
              ? 'bg-teal text-white hover:bg-teal-dark'
              : 'bg-stone/10 text-stone/40 cursor-not-allowed'
          )}
        >
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <PaperAirplaneIcon className="w-4 h-4" />
              Send Reply
            </>
          )}
        </button>
      </div>

      <p className="text-xs text-stone/60">
        Press <kbd className="px-1 py-0.5 bg-stone/10 rounded text-[10px]">Cmd+Enter</kbd> or{' '}
        <kbd className="px-1 py-0.5 bg-stone/10 rounded text-[10px]">Ctrl+Enter</kbd> to send
      </p>
    </div>
  );
}
