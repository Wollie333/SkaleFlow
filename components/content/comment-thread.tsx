'use client';

import { useState, useEffect } from 'react';
import { Button, Textarea } from '@/components/ui';
import { ChatBubbleLeftIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { createClient } from '@/lib/supabase/client';
import { format } from 'date-fns';

interface Comment {
  id: string;
  user_id: string;
  body: string;
  is_resolved: boolean;
  created_at: string;
  parent_comment_id: string | null;
  user?: { full_name: string; avatar_url: string | null };
  replies?: Comment[];
}

interface CommentThreadProps {
  contentItemId: string;
}

export function CommentThread({ contentItemId }: CommentThreadProps) {
  const supabase = createClient();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadComments = async () => {
    const res = await fetch(`/api/content/items/${contentItemId}/comments`);
    if (res.ok) {
      const data = await res.json();
      setComments(data.comments || []);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadComments();
  }, [contentItemId]);

  const handleSubmit = async () => {
    if (!newComment.trim()) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/content/items/${contentItemId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: newComment }),
      });
      if (res.ok) {
        setNewComment('');
        await loadComments();
      }
    } catch (err) {
      console.error('Failed to post comment:', err);
    }
    setIsSubmitting(false);
  };

  const handleResolve = async (commentId: string) => {
    const res = await fetch(`/api/content/items/${contentItemId}/comments`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ commentId, is_resolved: true }),
    });
    if (res.ok) {
      await loadComments();
    }
  };

  // Organize into threads
  const topLevel = comments.filter(c => !c.parent_comment_id);
  const replies = comments.filter(c => c.parent_comment_id);
  const threadedComments = topLevel.map(c => ({
    ...c,
    replies: replies.filter(r => r.parent_comment_id === c.id),
  }));

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <ChatBubbleLeftIcon className="w-4 h-4 text-stone" />
        <h4 className="text-sm font-medium text-charcoal">Comments ({comments.length})</h4>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-4">
          <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-teal" />
        </div>
      ) : (
        <>
          {threadedComments.map(comment => (
            <div key={comment.id} className={`p-3 rounded-lg ${comment.is_resolved ? 'bg-green-50 border border-green-100' : 'bg-cream-warm'}`}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-charcoal">
                    {(comment as Comment & { user?: { full_name: string } }).user?.full_name || 'User'}
                  </p>
                  <p className="text-xs text-stone">{format(new Date(comment.created_at), 'MMM d, h:mm a')}</p>
                </div>
                {!comment.is_resolved && (
                  <button
                    onClick={() => handleResolve(comment.id)}
                    className="text-xs text-stone hover:text-teal flex items-center gap-1"
                  >
                    <CheckCircleIcon className="w-3.5 h-3.5" />
                    Resolve
                  </button>
                )}
              </div>
              <p className="text-sm text-charcoal mt-2">{comment.body}</p>

              {comment.replies && comment.replies.length > 0 && (
                <div className="mt-2 ml-4 space-y-2 border-l-2 border-stone/10 pl-3">
                  {comment.replies.map(reply => (
                    <div key={reply.id} className="text-xs">
                      <span className="font-medium text-charcoal">
                        {(reply as Comment & { user?: { full_name: string } }).user?.full_name || 'User'}
                      </span>
                      <span className="text-stone ml-2">{format(new Date(reply.created_at), 'MMM d, h:mm a')}</span>
                      <p className="text-sm text-charcoal mt-0.5">{reply.body}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          <div className="flex gap-2">
            <Textarea
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              rows={2}
              className="flex-1 text-sm"
            />
            <Button onClick={handleSubmit} disabled={!newComment.trim() || isSubmitting} size="sm" className="self-end">
              Post
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
