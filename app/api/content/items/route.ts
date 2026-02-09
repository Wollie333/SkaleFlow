import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { ContentStatus } from '@/types/database';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      organizationId,
      calendarId,
      scheduled_date,
      time_slot = 'AM',
      scheduled_time = '08:00',
      funnel_stage,
      storybrand_stage,
      format,
      platforms = ['linkedin'],
      generateImmediately = false,
      // Manual creation fields (A5)
      topic,
      hook,
      script_body,
      cta,
      caption,
      hashtags,
      filming_notes,
      media_urls,
      context_section,
      teaching_points,
      reframe,
      problem_expansion,
      framework_teaching,
      case_study,
      ai_generated = true,
      status: requestedStatus,
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

    // Determine status: manual content with fields defaults to 'scripted'
    const hasContent = topic || hook || script_body || cta || caption;
    const defaultStatus: ContentStatus = !ai_generated && hasContent ? 'scripted' : 'idea';
    const status = (requestedStatus || defaultStatus) as ContentStatus;

    // Auto-create or find "Default" calendar when calendarId is not provided
    let resolvedCalendarId = calendarId || null;
    if (!resolvedCalendarId && organizationId) {
      // Look for existing Default calendar
      const { data: defaultCal } = await supabase
        .from('content_calendars')
        .select('id')
        .eq('organization_id', organizationId)
        .eq('name', 'Default')
        .maybeSingle();

      if (defaultCal) {
        resolvedCalendarId = defaultCal.id;
      } else {
        // Create a Default calendar that spans all time
        const { data: newCal } = await supabase
          .from('content_calendars')
          .insert({
            name: 'Default',
            organization_id: organizationId,
            start_date: '2025-01-01',
            end_date: '2030-12-31',
          })
          .select('id')
          .single();

        if (newCal) {
          resolvedCalendarId = newCal.id;
        }
      }
    }

    const { data: item, error } = await supabase
      .from('content_items')
      .insert({
        organization_id: organizationId,
        calendar_id: resolvedCalendarId,
        scheduled_date: scheduled_date || new Date().toISOString().split('T')[0],
        time_slot,
        scheduled_time,
        funnel_stage,
        storybrand_stage,
        format,
        platforms,
        status,
        ai_generated,
        // Manual content fields
        topic: topic || null,
        hook: hook || null,
        script_body: script_body || null,
        cta: cta || null,
        caption: caption || null,
        hashtags: hashtags || null,
        filming_notes: filming_notes || null,
        media_urls: media_urls || null,
        context_section: context_section || null,
        teaching_points: teaching_points || null,
        reframe: reframe || null,
        problem_expansion: problem_expansion || null,
        framework_teaching: framework_teaching || null,
        case_study: case_study || null,
      })
      .select()
      .single();

    if (error || !item) {
      console.error('Failed to create content item:', error);
      return NextResponse.json({ error: 'Failed to create content item' }, { status: 500 });
    }

    // If generateImmediately, call generation endpoint
    if (generateImmediately) {
      const generateResponse = await fetch(new URL('/api/content/generate', request.url).toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: request.headers.get('cookie') || '',
        },
        body: JSON.stringify({
          organizationId,
          contentItemIds: [item.id],
        }),
      });

      if (generateResponse.ok) {
        const result = await generateResponse.json();
        // Re-fetch the updated item
        const { data: updatedItem } = await supabase
          .from('content_items')
          .select('*')
          .eq('id', item.id)
          .single();

        return NextResponse.json({
          item: updatedItem || item,
          generated: true,
          generationResult: result.results?.[0],
        });
      }
    }

    return NextResponse.json({ item, generated: false });
  } catch (error) {
    console.error('Create content item error:', error);
    return NextResponse.json(
      { error: 'Failed to create content item' },
      { status: 500 }
    );
  }
}
