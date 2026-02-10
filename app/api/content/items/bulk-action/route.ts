import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { ContentStatus } from '@/types/database';

export async function POST(request: Request) {
  try {
    const { itemIds, action, value } = await request.json();

    if (!itemIds || itemIds.length === 0) {
      return NextResponse.json({ error: 'No items selected' }, { status: 400 });
    }

    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify access via first item's org
    const { data: firstItem } = await supabase
      .from('content_items')
      .select('organization_id')
      .eq('id', itemIds[0])
      .single();

    if (!firstItem) {
      return NextResponse.json({ error: 'Items not found' }, { status: 404 });
    }

    const orgId = firstItem.organization_id;

    const { data: membership } = await supabase
      .from('org_members')
      .select('role')
      .eq('organization_id', orgId)
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Verify ALL items belong to the same organization (defense-in-depth alongside RLS)
    if (itemIds.length > 1) {
      const { data: allItems } = await supabase
        .from('content_items')
        .select('id')
        .in('id', itemIds)
        .eq('organization_id', orgId);

      if (!allItems || allItems.length !== itemIds.length) {
        return NextResponse.json(
          { error: 'All items must belong to the same organization' },
          { status: 403 }
        );
      }
    }

    let updated = 0;

    switch (action) {
      case 'approve': {
        if (!['owner', 'admin'].includes(membership.role)) {
          return NextResponse.json({ error: 'Only owners/admins can approve' }, { status: 403 });
        }
        const { count } = await supabase
          .from('content_items')
          .update({
            status: 'approved' as ContentStatus,
            approved_at: new Date().toISOString(),
            approved_by: user.id,
            updated_at: new Date().toISOString(),
          })
          .in('id', itemIds)
          .eq('organization_id', orgId);
        updated = count || 0;
        break;
      }
      case 'assign': {
        const { count } = await supabase
          .from('content_items')
          .update({
            assigned_to: value,
            updated_at: new Date().toISOString(),
          })
          .in('id', itemIds)
          .eq('organization_id', orgId);
        updated = count || 0;
        break;
      }
      case 'change_status': {
        const { count } = await supabase
          .from('content_items')
          .update({
            status: value as ContentStatus,
            updated_at: new Date().toISOString(),
          })
          .in('id', itemIds)
          .eq('organization_id', orgId);
        updated = count || 0;
        break;
      }
      case 'request_revision': {
        if (!['owner', 'admin'].includes(membership.role)) {
          return NextResponse.json({ error: 'Only owners/admins can request revisions' }, { status: 403 });
        }
        const { count: revCount } = await supabase
          .from('content_items')
          .update({
            status: 'revision_requested' as ContentStatus,
            review_comment: value || 'Revisions needed',
            updated_at: new Date().toISOString(),
          })
          .in('id', itemIds)
          .eq('organization_id', orgId);
        updated = revCount || 0;
        break;
      }
      case 'delete': {
        if (!['owner', 'admin'].includes(membership.role)) {
          return NextResponse.json({ error: 'Only owners/admins can bulk delete' }, { status: 403 });
        }
        const { count } = await supabase
          .from('content_items')
          .delete()
          .in('id', itemIds)
          .eq('organization_id', orgId);
        updated = count || 0;
        break;
      }
      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }

    return NextResponse.json({ success: true, updated });
  } catch (error) {
    console.error('Bulk action error:', error);
    return NextResponse.json(
      { error: 'Failed to perform bulk action' },
      { status: 500 }
    );
  }
}
