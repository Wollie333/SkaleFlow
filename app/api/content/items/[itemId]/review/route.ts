import { NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { getApprovalSettings, canApproveContent } from '@/config/approval-settings';
import { notifyCreator } from '@/lib/notifications';
import type { ContentStatus, OrgMemberRole } from '@/types/database';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
  const { itemId } = await params;
    const { action, comment } = await request.json();

    if (!['approve', 'reject', 'request_revision'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get item + org
    const { data: item } = await supabase
      .from('content_items')
      .select('organization_id, status, topic, format, assigned_to')
      .eq('id', itemId)
      .single();

    if (!item) {
      return NextResponse.json({ error: 'Content item not found' }, { status: 404 });
    }

    // Get user role + name
    const { data: membership } = await supabase
      .from('org_members')
      .select('role')
      .eq('organization_id', item.organization_id)
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get approval settings
    const { data: org } = await supabase
      .from('organizations')
      .select('settings')
      .eq('id', item.organization_id)
      .single();

    const settings = getApprovalSettings(org?.settings as Record<string, unknown> | null);

    if (!canApproveContent(membership.role as OrgMemberRole, settings)) {
      return NextResponse.json({ error: 'You do not have permission to review content' }, { status: 403 });
    }

    // Get reviewer name for notifications
    const { data: reviewer } = await supabase
      .from('users')
      .select('full_name')
      .eq('id', user.id)
      .single();

    const reviewerName = reviewer?.full_name || user.email || 'A reviewer';

    if (action === 'approve') {
      const { error } = await supabase
        .from('content_items')
        .update({
          status: 'approved' as ContentStatus,
          approved_at: new Date().toISOString(),
          approved_by: user.id,
          review_comment: comment || null,
          rejection_reason: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', itemId);

      if (error) {
        return NextResponse.json({ error: 'Failed to approve' }, { status: 500 });
      }
    } else if (action === 'reject') {
      const { error } = await supabase
        .from('content_items')
        .update({
          status: 'rejected' as ContentStatus,
          rejection_reason: comment || 'No reason provided',
          review_comment: comment || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', itemId);

      if (error) {
        return NextResponse.json({ error: 'Failed to reject' }, { status: 500 });
      }
    } else if (action === 'request_revision') {
      if (!comment?.trim()) {
        return NextResponse.json({ error: 'Comment is required for revision requests' }, { status: 400 });
      }
      const { error } = await supabase
        .from('content_items')
        .update({
          status: 'revision_requested' as ContentStatus,
          review_comment: comment,
          updated_at: new Date().toISOString(),
        })
        .eq('id', itemId);

      if (error) {
        return NextResponse.json({ error: 'Failed to request revision' }, { status: 500 });
      }
    }

    // Notify the content creator
    const serviceClient = createServiceClient();
    const notifyAction = action === 'request_revision' ? 'revision_requested' : action;
    await notifyCreator({
      supabase: serviceClient,
      orgId: item.organization_id,
      contentItem: {
        id: itemId,
        topic: item.topic,
        format: item.format,
        assigned_to: item.assigned_to,
      },
      action: notifyAction as 'approved' | 'rejected' | 'revision_requested',
      reviewerName,
      comment,
    });

    return NextResponse.json({ success: true, action });
  } catch (error) {
    console.error('Review error:', error);
    return NextResponse.json(
      { error: 'Failed to review content' },
      { status: 500 }
    );
  }
}
