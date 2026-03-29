'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui';
import { useToast } from '@/hooks/useToast';
import {
  ChatBubbleLeftIcon,
  PaperAirplaneIcon,
  TrashIcon,
  PencilSquareIcon,
  UserIcon,
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  parent_comment_id: string | null;
  body: string;
  mentioned_user_ids: string[] | null;
  is_edited: boolean;
  edited_at: string | null;
  created_at: string;
  updated_at: string;
  user?: {
    full_name: string;
    avatar_url?: string | null;
  } | null;
}

interface PostCommentsPanelProps {
  postId: string;
  currentUserId: string;
  className?: string;
}

export function PostCommentsPanel({
  postId,
  currentUserId,
  className,
}: PostCommentsPanelProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingBody, setEditingBody] = useState('');
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyBody, setReplyBody] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useToast();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const fetchComments = useCallback(async () => {
    try {
      const res = await fetch(`/api/content/posts/${postId}/comments`);
      if (res.ok) {
        const data = await res.json();
        setComments(data.comments || []);
      }
    } catch (error) {
      console.error('Failed to fetch comments:', error);
    } finally {
      setIsLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/content/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          body: newComment.trim(),
          parent_comment_id: null,
        }),
      });

      if (res.ok) {
        setNewComment('');
        await fetchComments();
        toast.success('Comment added');
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to add comment');
      }
    } catch (error) {
      toast.error('Failed to add comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitReply = async (parentId: string) => {
    if (!replyBody.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/content/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          body: replyBody.trim(),
          parent_comment_id: parentId,
        }),
      });

      if (res.ok) {
        setReplyBody('');
        setReplyingToId(null);
        await fetchComments();
        toast.success('Reply added');
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to add reply');
      }
    } catch (error) {
      toast.error('Failed to add reply');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditComment = async (commentId: string) => {
    if (!editingBody.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/content/posts/${postId}/comments/${commentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: editingBody.trim() }),
      });

      if (res.ok) {
        setEditingCommentId(null);
        setEditingBody('');
        await fetchComments();
        toast.success('Comment updated');
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to update comment');
      }
    } catch (error) {
      toast.error('Failed to update comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;

    try {
      const res = await fetch(`/api/content/posts/${postId}/comments/${commentId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        await fetchComments();
        toast.success('Comment deleted');
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to delete comment');
      }
    } catch (error) {
      toast.error('Failed to delete comment');
    }
  };

  const startEditing = (comment: Comment) => {
    setEditingCommentId(comment.id);
    setEditingBody(comment.body);
  };

  const cancelEditing = () => {
    setEditingCommentId(null);
    setEditingBody('');
  };

  const startReplying = (commentId: string) => {
    setReplyingToId(commentId);
    setTimeout(() => textareaRef.current?.focus(), 100);
  };

  const cancelReplying = () => {
    setReplyingToId(null);
    setReplyBody('');
  };

  const formatRelativeTime = (dateStr: string): string => {
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' });
  };

  // Group comments by parent
  const topLevelComments = comments.filter(c => !c.parent_comment_id);
  const getReplies = (parentId: string) => comments.filter(c => c.parent_comment_id === parentId);

  const renderComment = (comment: Comment, isReply: boolean = false) => {
    const isOwnComment = comment.user_id === currentUserId;
    const isEditing = editingCommentId === comment.id;
    const isReplying = replyingToId === comment.id;
    const replies = getReplies(comment.id);

    return (
      <div key={comment.id} className={cn('group', isReply && 'ml-12 mt-3')}>
        <div className="flex items-start gap-3">
          {/* Avatar */}
          {comment.user?.avatar_url ? (
            <img
              src={comment.user.avatar_url}
              alt={comment.user.full_name}
              className="w-8 h-8 rounded-full flex-shrink-0"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-teal/10 flex items-center justify-center flex-shrink-0">
              <UserIcon className="w-4 h-4 text-teal" />
            </div>
          )}

          {/* Comment content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <p className="text-sm font-medium text-charcoal">
                {comment.user?.full_name || 'Unknown User'}
              </p>
              <span className="text-xs text-stone">
                {formatRelativeTime(comment.created_at)}
              </span>
              {comment.is_edited && (
                <span className="text-xs text-stone italic">(edited)</span>
              )}
            </div>

            {isEditing ? (
              <div className="space-y-2">
                <textarea
                  value={editingBody}
                  onChange={(e) => setEditingBody(e.target.value)}
                  className="w-full px-3 py-2 border border-stone/10 rounded-lg text-sm text-charcoal focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal"
                  rows={3}
                />
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => handleEditComment(comment.id)}
                    disabled={isSubmitting || !editingBody.trim()}
                    isLoading={isSubmitting}
                    size="sm"
                    className="bg-teal hover:bg-teal-light text-white text-xs"
                  >
                    Save
                  </Button>
                  <button
                    onClick={cancelEditing}
                    className="text-xs text-stone hover:text-charcoal"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-sm text-charcoal whitespace-pre-wrap">{comment.body}</p>

                {/* Actions */}
                <div className="flex items-center gap-3 mt-2">
                  {!isReply && (
                    <button
                      onClick={() => startReplying(comment.id)}
                      className="text-xs text-stone hover:text-teal font-medium"
                    >
                      Reply
                    </button>
                  )}
                  {isOwnComment && (
                    <>
                      <button
                        onClick={() => startEditing(comment)}
                        className="text-xs text-stone hover:text-teal"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteComment(comment.id)}
                        className="text-xs text-stone hover:text-red-600"
                      >
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Reply form */}
            {isReplying && (
              <div className="mt-3 space-y-2">
                <textarea
                  ref={textareaRef}
                  value={replyBody}
                  onChange={(e) => setReplyBody(e.target.value)}
                  placeholder="Write a reply... Use @username to mention someone"
                  className="w-full px-3 py-2 border border-stone/10 rounded-lg text-sm text-charcoal placeholder:text-stone/50 focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal"
                  rows={3}
                />
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => handleSubmitReply(comment.id)}
                    disabled={isSubmitting || !replyBody.trim()}
                    isLoading={isSubmitting}
                    size="sm"
                    className="bg-teal hover:bg-teal-light text-white text-xs"
                  >
                    Reply
                  </Button>
                  <button
                    onClick={cancelReplying}
                    className="text-xs text-stone hover:text-charcoal"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Nested replies */}
            {replies.length > 0 && (
              <div className="mt-3 space-y-3">
                {replies.map(reply => renderComment(reply, true))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center gap-2">
        <ChatBubbleLeftIcon className="w-5 h-5 text-teal" />
        <h3 className="font-serif text-lg font-bold text-charcoal">
          Comments {comments.length > 0 && `(${comments.length})`}
        </h3>
      </div>

      {/* New comment form */}
      <form onSubmit={handleSubmitComment} className="space-y-3">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment... Use @username to mention someone"
          className="w-full px-4 py-3 border border-stone/10 rounded-lg text-sm text-charcoal placeholder:text-stone/50 focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal"
          rows={3}
        />
        <div className="flex items-center justify-between">
          <p className="text-xs text-stone">
            Tip: Use @username to mention team members
          </p>
          <Button
            type="submit"
            disabled={isSubmitting || !newComment.trim()}
            isLoading={isSubmitting}
            size="sm"
            className="bg-teal hover:bg-teal-light text-white"
          >
            <PaperAirplaneIcon className="w-4 h-4" />
            Post Comment
          </Button>
        </div>
      </form>

      {/* Comments list */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-start gap-3 animate-pulse">
              <div className="w-8 h-8 rounded-full bg-stone/10" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-stone/10 rounded w-1/4" />
                <div className="h-3 bg-stone/8 rounded w-3/4" />
              </div>
            </div>
          ))}
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-8 text-sm text-stone">
          No comments yet. Be the first to comment!
        </div>
      ) : (
        <div className="space-y-4">
          {topLevelComments.map(comment => renderComment(comment))}
        </div>
      )}
    </div>
  );
}
