import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { revertToRevision } from '@/lib/content-engine/revisions';
import { canRevertPost } from '@/lib/permissions';

// POST - Revert post to a specific revision
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ postId: string; revisionId: string }> }
) {
  try {
    const { postId, revisionId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get post
    const { data: post } = await supabase
      .from('content_posts')
      .select('workspace_id, organization_id')
      .eq('id', postId)
      .single();

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Check permission to revert
    const canRevert = await canRevertPost(post.workspace_id, user.id);

    if (!canRevert) {
      return NextResponse.json(
        { error: 'Forbidden: No permission to revert posts' },
        { status: 403 }
      );
    }

    // Perform revert
    const result = await revertToRevision(
      postId,
      revisionId,
      user.id,
      post.workspace_id,
      post.organization_id
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to revert' },
        { status: 500 }
      );
    }

    // Fetch updated post
    const { data: updatedPost } = await supabase
      .from('content_posts')
      .select('*')
      .eq('id', postId)
      .single();

    return NextResponse.json({
      success: true,
      post: updatedPost,
      message: 'Post reverted successfully',
    });
  } catch (err) {
    console.error('[revisions] Revert error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
