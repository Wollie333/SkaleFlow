import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

    switch (action) {
      case 'approve':
        updates.status = 'approved';
        updates.approved_at = new Date().toISOString();
        updates.approved_by = user.id;
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

    const { data, error } = await supabase
      .from('content_posts')
      .update(updates)
      .eq('id', postId)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ post: data });
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
