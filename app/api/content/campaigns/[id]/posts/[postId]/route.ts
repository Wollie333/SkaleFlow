import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { canEditPost } from '@/lib/permissions';
import { trackPostChanges } from '@/lib/content-engine/revisions';
import { logPostDeleted } from '@/lib/activity-log';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; postId: string }> }
) {
  try {
    const { id, postId } = await params;
    console.log('[GET-POST] Request params:', { campaignId: id, postId });

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    console.log('[GET-POST] User authenticated:', user?.id);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Try to fetch the post - don't enforce campaign_id match here as it might be incorrect from routing
    const { data: post, error } = await supabase
      .from('content_posts')
      .select('*')
      .eq('id', postId)
      .single();

    console.log('[GET-POST] Query result:', { found: !!post, error: error?.message, campaignMatch: post?.campaign_id === id });

    if (error || !post) {
      console.error('[GET-POST] Post not found or error:', error);
      return NextResponse.json({ error: error?.message || 'Post not found' }, { status: 404 });
    }

    // Verify the post belongs to the campaign (soft check for logging)
    if (post.campaign_id !== id) {
      console.warn('[GET-POST] Post campaign mismatch:', { expected: id, actual: post.campaign_id });
    }

    console.log('[GET-POST] Returning post:', post.id);
    return NextResponse.json({ post });
  } catch (error) {
    console.error('[GET-POST] Unexpected error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch post' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; postId: string }> }
) {
  try {
    const { id, postId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current post state (before update) for revision tracking
    const { data: currentPost } = await supabase
      .from('content_posts')
      .select('*, workspace_id, organization_id, assigned_to')
      .eq('id', postId)
      .single();

    if (!currentPost) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Check permission to edit
    const canEdit = await canEditPost(
      currentPost.workspace_id,
      user.id,
      currentPost.assigned_to
    );

    if (!canEdit) {
      return NextResponse.json(
        { error: 'Forbidden: No permission to edit this post' },
        { status: 403 }
      );
    }

    const updates = await req.json();

    // Update post
    const { data: post, error } = await supabase
      .from('content_posts')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', postId)
      .select()
      .single();

    if (error || !post) {
      console.error('[PATCH-POST] Error:', error);
      return NextResponse.json(
        { error: error?.message || 'Failed to update post' },
        { status: 500 }
      );
    }

    // Track changes and create revision
    await trackPostChanges(
      postId,
      currentPost,
      post,
      user.id,
      currentPost.workspace_id,
      currentPost.organization_id
    );

    return NextResponse.json({ post });
  } catch (error) {
    console.error('[PATCH-POST] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update post' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; postId: string }> }
) {
  try {
    const { id, postId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get post data before deleting for activity log
    const { data: post } = await supabase
      .from('content_posts')
      .select('*, workspace_id, organization_id')
      .eq('id', postId)
      .single();

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Delete post
    const { error } = await supabase
      .from('content_posts')
      .delete()
      .eq('id', postId);

    if (error) {
      console.error('[DELETE-POST] Error:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to delete post' },
        { status: 500 }
      );
    }

    // Log deletion activity
    await logPostDeleted(
      post.workspace_id,
      user.id,
      postId,
      {
        topic: post.topic,
        content_type: post.content_type,
        status: post.status,
      }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[DELETE-POST] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete post' },
      { status: 500 }
    );
  }
}
