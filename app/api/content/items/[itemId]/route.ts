import { NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { notifyApprovers } from '@/lib/notifications';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
  const { itemId } = await params;
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: item, error } = await supabase
      .from('content_items')
      .select('*')
      .eq('id', itemId)
      .single();

    if (error || !item) {
      return NextResponse.json({ error: 'Content item not found' }, { status: 404 });
    }

    // Verify org membership
    const { data: membership } = await supabase
      .from('org_members')
      .select('id, role')
      .eq('organization_id', item.organization_id)
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    return NextResponse.json({ item, role: membership.role });
  } catch (error) {
    console.error('Get content item error:', error);
    return NextResponse.json({ error: 'Failed to get content item' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
  const { itemId } = await params;
    const body = await request.json();
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify access via the item's organization
    const { data: item } = await supabase
      .from('content_items')
      .select('organization_id, status, topic, format')
      .eq('id', itemId)
      .single();

    if (!item) {
      return NextResponse.json({ error: 'Content item not found' }, { status: 404 });
    }

    const { data: membership } = await supabase
      .from('org_members')
      .select('id')
      .eq('organization_id', item.organization_id)
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Allowed update fields
    const allowedFields = [
      'scheduled_date', 'time_slot', 'scheduled_time',
      'funnel_stage', 'storybrand_stage', 'format',
      'topic', 'hook', 'script_body', 'cta', 'caption', 'hashtags',
      'platforms', 'platform_specs', 'status',
      'assigned_to', 'media_urls', 'thumbnail_url', 'calendar_id',
      'filming_notes', 'context_section', 'teaching_points', 'reframe',
      'problem_expansion', 'case_study', 'framework_teaching',
      'rejection_reason', 'review_comment',
      'script_template', 'hook_template', 'cta_template',
      'target_url', 'utm_parameters',
    ];

    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
    for (const key of allowedFields) {
      if (key in body) {
        updateData[key] = body[key];
      }
    }

    const { data: updated, error } = await supabase
      .from('content_items')
      .update(updateData)
      .eq('id', itemId)
      .select()
      .single();

    if (error) {
      console.error('Failed to update content item:', error);
      return NextResponse.json({ error: 'Failed to update content item' }, { status: 500 });
    }

    // Notify approvers when content is submitted for review
    if (body.status === 'pending_review' && item.status !== 'pending_review') {
      const serviceClient = createServiceClient();
      const { data: submitter } = await supabase
        .from('users')
        .select('full_name')
        .eq('id', user.id)
        .single();

      notifyApprovers({
        supabase: serviceClient,
        orgId: item.organization_id,
        contentItem: { id: itemId, topic: item.topic, format: item.format },
        submitterName: submitter?.full_name || undefined,
      }).catch(err => console.error('Failed to notify approvers:', err));
    }

    return NextResponse.json({ item: updated });
  } catch (error) {
    console.error('Update content item error:', error);
    return NextResponse.json(
      { error: 'Failed to update content item' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
  const { itemId } = await params;
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: item } = await supabase
      .from('content_items')
      .select('organization_id')
      .eq('id', itemId)
      .single();

    if (!item) {
      return NextResponse.json({ error: 'Content item not found' }, { status: 404 });
    }

    const { data: membership } = await supabase
      .from('org_members')
      .select('role')
      .eq('organization_id', item.organization_id)
      .eq('user_id', user.id)
      .single();

    if (!membership || !['owner', 'admin'].includes(membership.role)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { error } = await supabase
      .from('content_items')
      .delete()
      .eq('id', itemId);

    if (error) {
      return NextResponse.json({ error: 'Failed to delete content item' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete content item error:', error);
    return NextResponse.json(
      { error: 'Failed to delete content item' },
      { status: 500 }
    );
  }
}
