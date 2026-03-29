import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logActivity } from '@/lib/activity-log';
import { isWorkspaceAdmin } from '@/lib/permissions';

// PATCH - Edit a comment
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ postId: string; commentId: string }> }
) {
  try {
    const { commentId } = await params;
    const { body } = await req.json();

    if (!body || body.trim().length === 0) {
      return NextResponse.json(
        { error: 'Comment body is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get comment
    const { data: comment } = await supabase
      .from('post_comments')
      .select('user_id, workspace_id, post_id')
      .eq('id', commentId)
      .single();

    if (!comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    // Check permission (own comment or workspace admin)
    const isOwner = comment.user_id === user.id;
    const isAdmin = await isWorkspaceAdmin(comment.workspace_id, user.id);

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden: Cannot edit this comment' },
        { status: 403 }
      );
    }

    // Update comment
    const { data: updated, error } = await supabase
      .from('post_comments')
      .update({
        body,
        is_edited: true,
        edited_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', commentId)
      .select(`
        *,
        user:users(id, full_name, email, avatar_url)
      `)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Log activity
    await logActivity({
      workspace_id: comment.workspace_id,
      actor_id: user.id,
      action: 'comment_edited',
      entity_type: 'comment',
      entity_id: commentId,
      metadata: { post_id: comment.post_id },
    });

    return NextResponse.json({ comment: updated });
  } catch (err) {
    console.error('[comments] PATCH error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a comment
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ postId: string; commentId: string }> }
) {
  try {
    const { commentId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get comment
    const { data: comment } = await supabase
      .from('post_comments')
      .select('user_id, workspace_id, post_id, body')
      .eq('id', commentId)
      .single();

    if (!comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    // Check permission
    const isOwner = comment.user_id === user.id;
    const isAdmin = await isWorkspaceAdmin(comment.workspace_id, user.id);

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden: Cannot delete this comment' },
        { status: 403 }
      );
    }

    // Delete comment (cascade deletes replies)
    const { error } = await supabase
      .from('post_comments')
      .delete()
      .eq('id', commentId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Log activity
    await logActivity({
      workspace_id: comment.workspace_id,
      actor_id: user.id,
      action: 'comment_deleted',
      entity_type: 'comment',
      entity_id: commentId,
      metadata: { post_id: comment.post_id },
      old_value: { body: comment.body },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[comments] DELETE error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
