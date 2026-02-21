import { NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

// GET — List comments for a change request
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

    // Verify user has access to this change request
    const { data: cr } = await serviceClient
      .from('change_requests')
      .select('organization_id')
      .eq('id', id)
      .single();

    if (!cr) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const { data: membership } = await supabase
      .from('org_members')
      .select('role')
      .eq('organization_id', cr.organization_id)
      .eq('user_id', user.id)
      .single();

    if (!membership) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { data: comments } = await serviceClient
      .from('review_comments')
      .select('*, user:user_id(full_name, email)')
      .eq('change_request_id', id)
      .order('created_at', { ascending: true });

    return NextResponse.json({ comments: comments || [] });
  } catch (error) {
    console.error('GET /api/change-requests/[id]/comments error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST — Add a comment
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { body } = await request.json();
    if (!body || typeof body !== 'string' || !body.trim()) {
      return NextResponse.json({ error: 'Comment body is required' }, { status: 400 });
    }

    const serviceClient = createServiceClient();

    // Verify user has access to this change request
    const { data: cr } = await serviceClient
      .from('change_requests')
      .select('organization_id')
      .eq('id', id)
      .single();

    if (!cr) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const { data: membership } = await supabase
      .from('org_members')
      .select('role')
      .eq('organization_id', cr.organization_id)
      .eq('user_id', user.id)
      .single();

    if (!membership) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { data: comment, error } = await serviceClient
      .from('review_comments')
      .insert({
        change_request_id: id,
        user_id: user.id,
        body: body.trim(),
      })
      .select('*, user:user_id(full_name, email)')
      .single();

    if (error) {
      console.error('Failed to create comment:', error);
      return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 });
    }

    return NextResponse.json({ comment });
  } catch (error) {
    console.error('POST /api/change-requests/[id]/comments error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
