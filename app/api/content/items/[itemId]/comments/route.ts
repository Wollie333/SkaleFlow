import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest, { params }: { params: Promise<{ itemId: string }> }) {
  try {
    const { itemId } = await params;
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: comments } = await supabase
      .from('content_comments')
      .select('*, user:users(full_name, avatar_url)')
      .eq('content_item_id', itemId)
      .order('created_at', { ascending: true });

    return NextResponse.json({ comments: comments || [] });
  } catch (error) {
    console.error('Get comments error:', error);
    return NextResponse.json({ error: 'Failed to load comments' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ itemId: string }> }) {
  try {
    const { itemId } = await params;
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { body, parent_comment_id } = await request.json();

    if (!body?.trim()) {
      return NextResponse.json({ error: 'Comment body is required' }, { status: 400 });
    }

    const { data: comment, error } = await supabase
      .from('content_comments')
      .insert({
        content_item_id: itemId,
        user_id: user.id,
        body: body.trim(),
        parent_comment_id: parent_comment_id || null,
      })
      .select('*, user:users(full_name, avatar_url)')
      .single();

    if (error) {
      console.error('Create comment error:', error);
      return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 });
    }

    return NextResponse.json({ comment });
  } catch (error) {
    console.error('Create comment error:', error);
    return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { commentId, is_resolved } = await request.json();

    const { error } = await supabase
      .from('content_comments')
      .update({ is_resolved, updated_at: new Date().toISOString() })
      .eq('id', commentId);

    if (error) {
      return NextResponse.json({ error: 'Failed to update comment' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update comment error:', error);
    return NextResponse.json({ error: 'Failed to update comment' }, { status: 500 });
  }
}
