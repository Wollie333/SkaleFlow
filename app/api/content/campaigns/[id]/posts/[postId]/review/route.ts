import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { canApproveContent } from '@/lib/permissions';
import { logApprovalGranted, logApprovalDenied, logRevisionRequested } from '@/lib/activity-log';
import { createRevision } from '@/lib/content-engine/revisions';

// POST — Approve / Reject / Request Revision
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; postId: string }> }
) {
  try {
    const { postId } = await params;
    const body = await request.json();
    const { action, comment } = body;

    if (!['approve', 'reject', 'request_revision'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Get post with workspace context
    const { data: post } = await supabase
      .from('content_posts')
      .select('*, workspace_id, organization_id, assigned_to, status, campaign_id')
      .eq('id', postId)
      .single();

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Check permission to review/approve
    const canReview = await canApproveContent(post.workspace_id, user.id);
    if (!canReview) {
      return NextResponse.json(
        { error: 'Forbidden: No permission to review content' },
        { status: 403 }
      );
    }

    const oldStatus = post.status;
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

    switch (action) {
      case 'approve':
        updates.status = 'approved';
        updates.approved_at = new Date().toISOString();
        updates.approved_by = user.id;
        updates.review_comment = comment || null;
        break;
      case 'reject':
        updates.status = 'rejected';
        updates.rejection_reason = comment || null;
        break;
      case 'request_revision':
        updates.status = 'revision_requested';
        updates.review_comment = comment || null;
        break;
    }

    // Update post
    const { data: updatedPost, error } = await supabase
      .from('content_posts')
      .update(updates)
      .eq('id', postId)
      .eq('status', 'pending_review') // Only review if pending
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Create revision for status change
    await createRevision(
      postId,
      user.id,
      post.workspace_id,
      post.organization_id,
      'status_changed',
      ['status'],
      'approval_workflow'
    );

    // Log activity based on action
    if (action === 'approve') {
      await logApprovalGranted(
        post.workspace_id,
        user.id,
        postId,
        post.assigned_to,
        comment
      );
    } else if (action === 'reject') {
      await logApprovalDenied(
        post.workspace_id,
        user.id,
        postId,
        post.assigned_to,
        comment
      );
    } else if (action === 'request_revision') {
      await logRevisionRequested(
        post.workspace_id,
        user.id,
        postId,
        post.assigned_to,
        comment || 'Revision requested'
      );
    }

    // Send notification to creator
    const notificationTitle =
      action === 'approve'
        ? 'Content Approved'
        : action === 'reject'
        ? 'Content Rejected'
        : 'Revision Requested';

    const notificationBody =
      comment ||
      (action === 'approve'
        ? 'Your post has been approved'
        : action === 'reject'
        ? 'Your post has been rejected'
        : 'Changes requested for your post');

    await supabase.from('notifications').insert({
      user_id: post.assigned_to,
      organization_id: post.organization_id,
      workspace_id: post.workspace_id,
      type:
        action === 'approve'
          ? 'content_approved'
          : action === 'reject'
          ? 'content_rejected'
          : 'revision_requested',
      title: notificationTitle,
      body: notificationBody,
      link: `/content/campaigns/${post.campaign_id}/posts/${postId}`,
      metadata: {
        post_id: postId,
        reviewer_id: user.id,
        old_status: oldStatus,
        new_status: updates.status,
      },
    });

    return NextResponse.json({ post: updatedPost });
  } catch (err) {
    console.error('[review] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
