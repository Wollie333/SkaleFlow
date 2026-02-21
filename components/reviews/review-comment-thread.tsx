'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button, Textarea } from '@/components/ui';
import { ChatBubbleLeftEllipsisIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline';

interface ReviewComment {
  id: string;
  user_id: string;
  body: string;
  created_at: string;
  user?: { full_name: string | null; email: string };
}

interface ReviewCommentThreadProps {
  changeRequestId: string;
}

function getRelativeTime(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' });
}

function getInitial(name?: string | null, email?: string): string {
  if (name) return name.charAt(0).toUpperCase();
  if (email) return email.charAt(0).toUpperCase();
  return '?';
}

export function ReviewCommentThread({ changeRequestId }: ReviewCommentThreadProps) {
  const [comments, setComments] = useState<ReviewComment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [isSending, setIsSending] = useState(false);

  const fetchComments = useCallback(async () => {
    try {
      const res = await fetch(`/api/change-requests/${changeRequestId}/comments`);
      if (res.ok) {
        const data = await res.json();
        setComments(data.comments || []);
      }
    } catch {
      // silent
    } finally {
      setIsLoading(false);
    }
  }, [changeRequestId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setIsSending(true);
    try {
      const res = await fetch(`/api/change-requests/${changeRequestId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: newComment.trim() }),
      });
      if (res.ok) {
        setNewComment('');
        await fetchComments();
      }
    } catch {
      // silent
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <ChatBubbleLeftEllipsisIcon className="w-4 h-4 text-stone" />
        <h4 className="text-xs font-semibold text-stone uppercase tracking-wider">
          Discussion ({comments.length})
        </h4>
      </div>

      {/* Comments list */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2].map(i => (
            <div key={i} className="flex items-start gap-2 animate-pulse">
              <div className="w-7 h-7 rounded-full bg-stone/10" />
              <div className="flex-1 space-y-1">
                <div className="h-3 bg-stone/10 rounded w-20" />
                <div className="h-3 bg-stone/8 rounded w-48" />
              </div>
            </div>
          ))}
        </div>
      ) : comments.length > 0 ? (
        <div className="space-y-3 max-h-60 overflow-y-auto">
          {comments.map(comment => (
            <div key={comment.id} className="flex items-start gap-2.5">
              <div className="w-7 h-7 rounded-full bg-teal/10 text-teal flex items-center justify-center flex-shrink-0">
                <span className="text-[10px] font-bold">
                  {getInitial(comment.user?.full_name, comment.user?.email)}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-charcoal">
                    {comment.user?.full_name || comment.user?.email || 'Unknown'}
                  </span>
                  <span className="text-[10px] text-stone">
                    {getRelativeTime(comment.created_at)}
                  </span>
                </div>
                <p className="text-sm text-charcoal/80 mt-0.5 whitespace-pre-wrap">
                  {comment.body}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-stone/60">No comments yet.</p>
      )}

      {/* New comment form */}
      <form onSubmit={handleSubmit} className="flex items-end gap-2">
        <Textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment..."
          rows={2}
          disabled={isSending}
          className="text-sm flex-1"
        />
        <Button
          type="submit"
          disabled={!newComment.trim() || isSending}
          isLoading={isSending}
          size="sm"
          className="bg-teal hover:bg-teal-light text-white"
        >
          <PaperAirplaneIcon className="w-4 h-4" />
        </Button>
      </form>
    </div>
  );
}
