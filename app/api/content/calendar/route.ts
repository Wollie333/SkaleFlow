import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateCalendarSlots, getMonthBounds, type Frequency } from '@/lib/content-engine/calendar-generator';
import { format } from 'date-fns';

export async function POST(request: Request) {
  try {
    const { organizationId, year, month, frequency } = await request.json();

    const supabase = createClient();

    // Verify user has access
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

    // Check if content engine is enabled
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

    // Get month bounds
    const { start, end } = getMonthBounds(year, month);

    // Create calendar
    const calendarName = format(start, 'MMMM yyyy');

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
          platforms: ['linkedin', 'facebook', 'instagram'],
          timezone: 'Africa/Johannesburg',
        },
      })
      .select()
      .single();

    if (calendarError || !calendar) {
      return NextResponse.json({ error: 'Failed to create calendar' }, { status: 500 });
    }

    // Get angles for this organization
    const { data: angles } = await supabase
      .from('content_angles')
      .select('id, week_number')
      .eq('organization_id', organizationId)
      .eq('is_active', true);

    const angleMap = new Map(angles?.map(a => [a.week_number, a.id]) || []);

    // Generate slots
    const slots = generateCalendarSlots(start, end, frequency as Frequency);

    // Create content items
    const contentItems = slots.map(slot => {
      // Determine week number for angle assignment
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
        status: 'idea',
      };
    });

    // Insert content items
    const { error: itemsError } = await supabase
      .from('content_items')
      .insert(contentItems);

    if (itemsError) {
      console.error('Failed to create content items:', itemsError);
      // Delete the calendar if items failed
      await supabase.from('content_calendars').delete().eq('id', calendar.id);
      return NextResponse.json({ error: 'Failed to create content items' }, { status: 500 });
    }

    return NextResponse.json({
      calendar,
      itemCount: contentItems.length,
    });
  } catch (error) {
    console.error('Calendar creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create calendar' },
      { status: 500 }
    );
  }
}
