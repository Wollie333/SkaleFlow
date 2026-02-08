import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateCalendarSlots, getMonthBounds, buildConflictMap, type Frequency } from '@/lib/content-engine/calendar-generator';
import { format } from 'date-fns';
import type { ContentStatus, Json } from '@/types/database';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      organizationId,
      frequency,
      defaultPlatforms,
      // New campaign fields
      campaignName,
      startDate: startDateStr,
      endDate: endDateStr,
      // Legacy fields (backward compat)
      year,
      month,
    } = body;

    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: membership } = await supabase
      .from('org_members')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { data: org } = await supabase
      .from('organizations')
      .select('content_engine_enabled')
      .eq('id', organizationId)
      .single();

    if (!org?.content_engine_enabled) {
      return NextResponse.json(
        { error: 'Content engine not enabled. Complete Brand Engine first.' },
        { status: 403 }
      );
    }

    // Determine date range: use campaign fields if provided, else legacy month bounds
    let start: Date;
    let end: Date;
    let calendarName: string;

    if (startDateStr && endDateStr) {
      start = new Date(startDateStr + 'T00:00:00');
      end = new Date(endDateStr + 'T00:00:00');
      calendarName = campaignName || format(start, 'MMMM yyyy');
    } else if (year != null && month != null) {
      const bounds = getMonthBounds(year, month);
      start = bounds.start;
      end = bounds.end;
      calendarName = campaignName || format(start, 'MMMM yyyy');
    } else {
      return NextResponse.json({ error: 'startDate/endDate or year/month required' }, { status: 400 });
    }

    const platforms = defaultPlatforms || ['linkedin', 'facebook', 'instagram'];

    // Build conflict map from existing items in this date range
    let conflictMap = {};
    try {
      const { data: existingItems } = await supabase
        .from('content_items')
        .select('scheduled_date, scheduled_time')
        .eq('organization_id', organizationId)
        .gte('scheduled_date', format(start, 'yyyy-MM-dd'))
        .lte('scheduled_date', format(end, 'yyyy-MM-dd'))
        .not('status', 'in', '("rejected","archived")');

      conflictMap = buildConflictMap(existingItems || []);
    } catch (e) {
      console.error('Failed to build conflict map, proceeding without:', e);
    }

    // Generate slots with generation_week and conflict resolution
    const slots = generateCalendarSlots(start, end, frequency as Frequency, platforms, conflictMap);
    const totalWeeks = new Set(slots.map(s => s.generation_week)).size;

    const { data: calendar, error: calendarError } = await supabase
      .from('content_calendars')
      .insert({
        organization_id: organizationId,
        name: calendarName,
        start_date: format(start, 'yyyy-MM-dd'),
        end_date: format(end, 'yyyy-MM-dd'),
        status: 'draft',
        settings: {
          frequency,
          platforms,
          timezone: 'Africa/Johannesburg',
        },
        generation_progress: ({ weeks_generated: 0, total_weeks: totalWeeks } as unknown as Json),
      })
      .select()
      .single();

    if (calendarError || !calendar) {
      return NextResponse.json({ error: 'Failed to create calendar' }, { status: 500 });
    }

    // Get angles
    const { data: angles } = await supabase
      .from('content_angles')
      .select('id, week_number')
      .eq('organization_id', organizationId)
      .eq('is_active', true);

    const angleMap = new Map(angles?.map(a => [a.week_number, a.id]) || []);

    // Create content items with generation_week
    const contentItems = slots.map(slot => {
      const slotDate = new Date(slot.scheduled_date);
      const weekNumber = Math.ceil(slotDate.getDate() / 7) % 4 || 4;
      const angleId = angleMap.get(weekNumber) || null;

      return {
        organization_id: organizationId,
        calendar_id: calendar.id,
        scheduled_date: slot.scheduled_date,
        time_slot: slot.time_slot,
        scheduled_time: slot.scheduled_time,
        funnel_stage: slot.funnel_stage,
        storybrand_stage: slot.storybrand_stage,
        angle_id: angleId,
        format: slot.format,
        platforms: slot.platforms,
        status: 'idea' as ContentStatus,
        generation_week: slot.generation_week,
      };
    });

    const { error: itemsError } = await supabase
      .from('content_items')
      .insert(contentItems);

    if (itemsError) {
      console.error('Failed to create content items:', itemsError);
      await supabase.from('content_calendars').delete().eq('id', calendar.id);
      return NextResponse.json({ error: 'Failed to create content items' }, { status: 500 });
    }

    return NextResponse.json({
      calendar,
      itemCount: contentItems.length,
      totalWeeks,
    });
  } catch (error) {
    console.error('Calendar creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create calendar' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { calendarId } = await request.json();

    if (!calendarId) {
      return NextResponse.json({ error: 'calendarId is required' }, { status: 400 });
    }

    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user has access to this calendar's organization
    const { data: calendar } = await supabase
      .from('content_calendars')
      .select('id, organization_id')
      .eq('id', calendarId)
      .single();

    if (!calendar) {
      return NextResponse.json({ error: 'Calendar not found' }, { status: 404 });
    }

    const { data: membership } = await supabase
      .from('org_members')
      .select('role')
      .eq('organization_id', calendar.organization_id)
      .eq('user_id', user.id)
      .single();

    if (!membership || (membership.role !== 'owner' && membership.role !== 'admin')) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Delete content items first, then the calendar
    await supabase
      .from('content_items')
      .delete()
      .eq('calendar_id', calendarId);

    const { error: deleteError } = await supabase
      .from('content_calendars')
      .delete()
      .eq('id', calendarId);

    if (deleteError) {
      console.error('Failed to delete calendar:', deleteError);
      return NextResponse.json({ error: 'Failed to delete calendar' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Calendar deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to delete calendar' },
      { status: 500 }
    );
  }
}
