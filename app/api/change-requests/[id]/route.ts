import { NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { reviewChangeRequest } from '@/lib/change-requests';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
  const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const serviceClient = createServiceClient();
    const { data: cr } = await serviceClient
      .from('change_requests')
      .select('*, requester:requested_by(full_name, email), reviewer:reviewed_by(full_name)')
      .eq('id', id)
      .single();

    if (!cr) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // Verify user has access (either requester or org admin)
    if (cr.requested_by !== user.id) {
      const { data: membership } = await supabase
        .from('org_members')
        .select('role')
        .eq('organization_id', cr.organization_id)
        .eq('user_id', user.id)
        .single();

      if (!membership || !['owner', 'admin'].includes(membership.role)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    return NextResponse.json({ changeRequest: cr });
  } catch (error) {
    console.error('GET /api/change-requests/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
  const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { action } = body;

    // Handle assignment
    if (action === 'assign') {
      const { assignedTo } = body;
      const serviceClient = createServiceClient();
      const { error: updateError } = await serviceClient
        .from('change_requests')
        .update({ assigned_to: assignedTo || null })
        .eq('id', id);
      if (updateError) return NextResponse.json({ error: 'Failed to assign' }, { status: 500 });
      return NextResponse.json({ success: true });
    }

    // Handle priority change
    if (action === 'set_priority') {
      const { priority } = body;
      if (!priority || !['urgent', 'normal', 'low'].includes(priority)) {
        return NextResponse.json({ error: 'Invalid priority' }, { status: 400 });
      }
      const serviceClient = createServiceClient();
      const { error: updateError } = await serviceClient
        .from('change_requests')
        .update({ priority })
        .eq('id', id);
      if (updateError) return NextResponse.json({ error: 'Failed to set priority' }, { status: 500 });
      return NextResponse.json({ success: true });
    }

    // Handle deadline
    if (action === 'set_deadline') {
      const { deadline } = body;
      const serviceClient = createServiceClient();
      const { error: updateError } = await serviceClient
        .from('change_requests')
        .update({ deadline: deadline || null })
        .eq('id', id);
      if (updateError) return NextResponse.json({ error: 'Failed to set deadline' }, { status: 500 });
      return NextResponse.json({ success: true });
    }

    // Handle review actions
    if (!action || !['approve', 'reject', 'request_revision'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const result = await reviewChangeRequest(id, user.id, action, body.comment);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('PATCH /api/change-requests/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
