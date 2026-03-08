'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { PostEditorV3 } from '@/components/content/post-editor-v3';

export default function PostDetailPage() {
  const router = useRouter();
  const params = useParams();
  const campaignId = params.id as string;
  const postId = params.postId as string;

  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  const fetchPost = useCallback(async () => {
    try {
      const res = await fetch(`/api/content/campaigns/${campaignId}/posts/${postId}`);
      if (res.ok) {
        const data = await res.json();
        setPost(data.post);
      }
    } catch (err) {
      console.error('Failed to fetch post:', err);
    } finally {
      setLoading(false);
    }
  }, [campaignId, postId]);

  useEffect(() => {
    fetchPost();
  }, [fetchPost]);

  async function handleSave(updates: Record<string, unknown>) {
    setSaving(true);
    try {
      await fetch(`/api/content/campaigns/${campaignId}/posts/${postId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      await fetchPost();
    } catch (err) {
      console.error('Failed to save:', err);
    } finally {
      setSaving(false);
    }
  }

  async function handleSubmitForReview() {
    await handleSave({ status: 'pending_review' });
  }

  async function handleRegenerate(creativeDirection?: string) {
    setRegenerating(true);
    try {
      // Trigger regeneration via the generate endpoint with specific post
      await fetch(`/api/content/campaigns/${campaignId}/posts/${postId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'idea',
          creative_direction: creativeDirection || null,
          topic: null,
          hook: null,
          body: null,
        }),
      });
      // Then trigger generation
      await fetch(`/api/content/campaigns/${campaignId}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postIds: [postId] }),
      });
      await fetchPost();
    } catch (err) {
      console.error('Failed to regenerate:', err);
    } finally {
      setRegenerating(false);
    }
  }

  async function handleRegenerateHooks() {
    setRegenerating(true);
    try {
      await fetch(`/api/content/campaigns/${campaignId}/posts/${postId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ regenerate_hooks: true }),
      });
      await fetchPost();
    } catch (err) {
      console.error('Failed to regenerate hooks:', err);
    } finally {
      setRegenerating(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-2 border-teal border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="text-center py-12">
        <p className="text-stone text-body-md mb-4">Post not found.</p>
        <Button onClick={() => router.push(`/content/campaigns/${campaignId}`)}>
          Back to Campaign
        </Button>
      </div>
    );
  }

  return (
    <div>
      {/* Back button */}
      <button
        onClick={() => router.push(`/content/campaigns/${campaignId}`)}
        className="text-xs text-stone hover:text-teal transition-colors mb-4 flex items-center gap-1"
      >
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Campaign
      </button>

      <PostEditorV3
        post={post}
        onSave={handleSave}
        onSubmitForReview={handleSubmitForReview}
        onRegenerate={handleRegenerate}
        onRegenerateHooks={handleRegenerateHooks}
        isRegenerating={regenerating}
        isSaving={saving}
      />
    </div>
  );
}
