import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/server';
import { logCommentAdded, logMentionCreated } from '@/lib/activity-log';

// GET - Fetch all comments for a post
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch comments with user info
    const { data: comments, error } = await supabase
      .from('post_comments')
      .select(`
        *,
        user:users(id, full_name, email, avatar_url)
      `)
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('[comments] Fetch error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch comments' },
        { status: 500 }
      );
    }

    return NextResponse.json({ comments: comments || [] });
  } catch (err) {
    console.error('[comments] GET error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Add a new comment
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params;
    const { body, parent_comment_id } = await req.json();

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

    // Get post workspace context
    const { data: post } = await supabase
      .from('content_posts')
      .select('workspace_id, organization_id, campaign_id')
      .eq('id', postId)
      .single();

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Extract @mentions
    const mentionedUserIds = await extractMentions(body, post.workspace_id);

    // Create comment
    const { data: comment, error } = await supabase
      .from('post_comments')
      .insert({
        post_id: postId,
        user_id: user.id,
        workspace_id: post.workspace_id,
        organization_id: post.organization_id,
        parent_comment_id: parent_comment_id || null,
        body,
        mentioned_user_ids: mentionedUserIds,
      })
      .select(`
        *,
        user:users(id, full_name, email, avatar_url)
      `)
      .single();

    if (error) {
      console.error('[comments] Create error:', error);
      return NextResponse.json(
        { error: 'Failed to create comment' },
        { status: 500 }
      );
    }

    // Log activity
    await logCommentAdded(
      post.workspace_id,
      user.id,
      postId,
      comment.id,
      !!parent_comment_id,
      mentionedUserIds
    );

    // Send notifications to mentioned users
    if (mentionedUserIds.length > 0) {
      await notifyMentionedUsers(
        supabase,
        postId,
        post.campaign_id,
        comment.id,
        user.id,
        mentionedUserIds,
        body,
        post.workspace_id,
        post.organization_id
      );

      // Log mentions
      for (const mentionedUserId of mentionedUserIds) {
        if (mentionedUserId !== user.id) {
          await logMentionCreated(
            post.workspace_id,
            user.id,
            postId,
            mentionedUserId,
            comment.id
          );
        }
      }
    }

    return NextResponse.json({ comment });
  } catch (err) {
    console.error('[comments] POST error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Extract @mentions from comment body
 */
async function extractMentions(
  body: string,
  workspaceId: string
): Promise<string[]> {
  const mentionPattern = /@([a-zA-Z0-9._-]+)/g;
  const matches = [...body.matchAll(mentionPattern)];

  if (matches.length === 0) return [];

  const usernames = matches.map(m => m[1]);
  const supabase = createServiceClient();

  // Get workspace members
  const { data: members } = await supabase
    .from('workspace_members')
    .select('user_id, users(email, full_name)')
    .eq('workspace_id', workspaceId);

  if (!members) return [];

  const userIds: string[] = [];
  members.forEach(m => {
    const user = m.users as any;
    if (!user) return;

    const emailUsername = user.email.split('@')[0];
    const normalizedName = user.full_name?.replace(/\s/g, '').toLowerCase();

    // Match by email username or full name
    if (
      usernames.some(u => u.toLowerCase() === emailUsername.toLowerCase()) ||
      usernames.some(u => u.toLowerCase() === normalizedName)
    ) {
      if (!userIds.includes(m.user_id)) {
        userIds.push(m.user_id);
      }
    }
  });

  return userIds;
}

/**
 * Send notifications to mentioned users
 */
async function notifyMentionedUsers(
  supabase: any,
  postId: string,
  campaignId: string,
  commentId: string,
  mentionerId: string,
  mentionedUserIds: string[],
  commentBody: string,
  workspaceId: string,
  organizationId: string
) {
  const { data: mentioner } = await supabase
    .from('users')
    .select('full_name')
    .eq('id', mentionerId)
    .single();

  for (const userId of mentionedUserIds) {
    if (userId === mentionerId) continue; // Don't notify self

    await supabase.from('notifications').insert({
      user_id: userId,
      organization_id: organizationId,
      workspace_id: workspaceId,
      comment_id: commentId,
      type: 'mention_created',
      title: `${mentioner?.full_name || 'Someone'} mentioned you`,
      body: commentBody.substring(0, 100) + (commentBody.length > 100 ? '...' : ''),
      link: `/content/campaigns/${campaignId}/posts/${postId}#comment-${commentId}`,
      metadata: {
        post_id: postId,
        comment_id: commentId,
        mentioner_id: mentionerId,
      },
    });
  }
}
