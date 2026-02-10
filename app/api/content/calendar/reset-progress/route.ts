import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { Json } from '@/types/database';

export async function POST(request: Request) {
  try {
    const { calendarId } = await request.json();

    if (!calendarId) {
      return NextResponse.json({ error: 'calendarId is required' }, { status: 400 });
    }

    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the calendar and verify membership
    const { data: calendar } = await supabase
      .from('content_calendars')
      .select('id, organization_id, generation_progress')
      .eq('id', calendarId)
      .single();

    if (!calendar) {
      return NextResponse.json({ error: 'Calendar not found' }, { status: 404 });
    }

    // Verify user is owner or admin
    const { data: membership } = await supabase
      .from('org_members')
      .select('role')
      .eq('organization_id', calendar.organization_id)
      .eq('user_id', user.id)
      .single();

    if (!membership || !['owner', 'admin'].includes(membership.role)) {
      return NextResponse.json({ error: 'Only owners and admins can reset progress' }, { status: 403 });
    }

    // Get total weeks from existing progress or recalculate from items
    const currentProgress = calendar.generation_progress as { weeks_generated: number; total_weeks: number } | null;
    const totalWeeks = currentProgress?.total_weeks || 0;

    // Reset progress to 0 weeks generated
    const { error } = await supabase
      .from('content_calendars')
      .update({
        generation_progress: ({ weeks_generated: 0, total_weeks: totalWeeks } as unknown as Json),
      })
      .eq('id', calendarId);

    if (error) {
      return NextResponse.json({ error: 'Failed to reset progress' }, { status: 500 });
    }

    // Reset all generated items back to "idea" status
    await supabase
      .from('content_items')
      .update({
        status: 'idea',
        topic: null,
        hook: null,
        script_body: null,
        cta: null,
        caption: null,
        hashtags: null,
      })
      .eq('calendar_id', calendarId)
      .in('status', ['scripted', 'idea']);

    return NextResponse.json({
      progress: { weeks_generated: 0, total_weeks: totalWeeks },
    });
  } catch (error) {
    console.error('Reset progress error:', error);
    return NextResponse.json({ error: 'Failed to reset progress' }, { status: 500 });
  }
}
