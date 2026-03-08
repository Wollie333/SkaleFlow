import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { recordUserEdit } from '@/lib/content-engine/style-learning';

// GET — Single post detail
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; postId: string }> }
) {
  try {
    const { postId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data, error } = await supabase
      .from('content_posts')
      .select('*')
      .eq('id', postId)
      .single();

    if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ post: data });
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH — Update post
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; postId: string }> }
) {
  try {
    const { postId } = await params;
    const body = await request.json();
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Allowlist of updatable fields
    const allowed = [
      'topic', 'hook', 'hook_variations', 'body', 'cta', 'caption', 'hashtags',
      'visual_brief', 'shot_suggestions', 'slide_content', 'on_screen_text',
      'platform_variations', 'scheduled_date', 'scheduled_time', 'status',
      'assigned_to', 'target_url', 'utm_parameters', 'media_urls', 'thumbnail_url',
    ];

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    for (const key of allowed) {
      if (body[key] !== undefined) updates[key] = body[key];
    }

    // Fetch original AI output before updating (for style learning)
    const { data: currentPost } = await supabase
      .from('content_posts')
      .select('original_ai_output, organization_id, ai_generated')
      .eq('id', postId)
      .single();

    const { data, error } = await supabase
      .from('content_posts')
      .update(updates)
      .eq('id', postId)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Style learning: compare user edits against original AI output
    if (currentPost?.original_ai_output && currentPost.ai_generated && currentPost.organization_id) {
      const originalOutput = currentPost.original_ai_output as Record<string, unknown>;
      const userEdited = {
        topic: body.topic,
        hook: body.hook,
        body: body.body,
        cta: body.cta,
        caption: body.caption,
      };
      // Fire-and-forget (don't block the save response)
      recordUserEdit(supabase, currentPost.organization_id, postId, originalOutput, userEdited).catch(() => {});
    }

    return NextResponse.json({ post: data });
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE — Remove post
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; postId: string }> }
) {
  try {
    const { postId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await supabase.from('content_posts').delete().eq('id', postId);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
