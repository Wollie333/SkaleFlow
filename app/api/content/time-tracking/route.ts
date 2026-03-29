import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { startPostTimeEntry, endPostTimeEntry } from '@/lib/session-tracking';

// POST - Start time entry
export async function POST(req: NextRequest) {
  try {
    const { post_id, activity_type } = await req.json();

    if (!post_id || !activity_type) {
      return NextResponse.json(
        { error: 'Missing required fields: post_id and activity_type' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get workspace context from post
    const { data: post } = await supabase
      .from('content_posts')
      .select('workspace_id, organization_id')
      .eq('id', post_id)
      .single();

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Start time entry
    const timeEntryId = await startPostTimeEntry(
      post_id,
      user.id,
      post.workspace_id,
      post.organization_id,
      activity_type
    );

    if (!timeEntryId) {
      return NextResponse.json(
        { error: 'Failed to start time entry' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      time_entry_id: timeEntryId,
      started_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[time-tracking] POST error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH - End time entry
export async function PATCH(req: NextRequest) {
  try {
    const { time_entry_id } = await req.json();

    if (!time_entry_id) {
      return NextResponse.json(
        { error: 'Missing required field: time_entry_id' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify ownership
    const { data: entry } = await supabase
      .from('post_time_entries')
      .select('user_id')
      .eq('id', time_entry_id)
      .single();

    if (!entry) {
      return NextResponse.json({ error: 'Time entry not found' }, { status: 404 });
    }

    if (entry.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden: Cannot end another user\'s time entry' },
        { status: 403 }
      );
    }

    // End time entry
    const duration = await endPostTimeEntry(time_entry_id);

    if (duration === null) {
      return NextResponse.json(
        { error: 'Failed to end time entry' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      duration_seconds: duration,
      ended_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[time-tracking] PATCH error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
