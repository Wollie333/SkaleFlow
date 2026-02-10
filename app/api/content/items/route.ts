import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { ContentStatus, PlacementType } from '@/types/database';
import { getPlatformFromPlacement } from '@/config/placement-types';

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
      // Placement variations
      platformPlacements,
      target_url,
      utm_parameters,
      angle_id,
    } = body;

    const supabase = await createClient();

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

    // Auto-create or find "Main Calendar" when calendarId is not provided
    let resolvedCalendarId = calendarId || null;
    if (!resolvedCalendarId && organizationId) {
      // Look for existing Main Calendar (or legacy "Default")
      const { data: mainCal } = await supabase
        .from('content_calendars')
        .select('id')
        .eq('organization_id', organizationId)
        .in('name', ['Main Calendar', 'Default'])
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (mainCal) {
        resolvedCalendarId = mainCal.id;
      } else {
        // Create a Main Calendar that spans all time
        const { data: newCal } = await supabase
          .from('content_calendars')
          .insert({
            name: 'Main Calendar',
            organization_id: organizationId,
            start_date: '2025-01-01',
            end_date: '2030-12-31',
            status: 'active',
            settings: { frequency: 'moderate', platforms: ['linkedin', 'facebook', 'instagram'], timezone: 'Africa/Johannesburg' },
          })
          .select('id')
          .single();

        if (newCal) {
          resolvedCalendarId = newCal.id;
        }
      }
    }

    // Shared fields for item creation
    const sharedFields = {
      organization_id: organizationId,
      calendar_id: resolvedCalendarId,
      scheduled_date: scheduled_date || new Date().toISOString().split('T')[0],
      time_slot,
      scheduled_time,
      funnel_stage,
      storybrand_stage,
      format,
      status,
      ai_generated,
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
      target_url: target_url || null,
      utm_parameters: utm_parameters || null,
      angle_id: angle_id || null,
    };

    // ─── Variation group creation (when platformPlacements provided) ────
    if (platformPlacements && Array.isArray(platformPlacements) && platformPlacements.length > 0) {
      const variationGroupId = crypto.randomUUID();
      const itemsToInsert = (platformPlacements as PlacementType[]).map((placement, i) => ({
        ...sharedFields,
        platforms: [getPlatformFromPlacement(placement)],
        placement_type: placement,
        variation_group_id: variationGroupId,
        is_primary_variation: i === 0,
      }));

      const { data: items, error } = await supabase
        .from('content_items')
        .insert(itemsToInsert)
        .select();

      if (error || !items || items.length === 0) {
        console.error('Failed to create variation items:', error);
        return NextResponse.json({ error: 'Failed to create content items' }, { status: 500 });
      }

      return NextResponse.json({
        items,
        item: items[0], // primary item for backward compat
        variationGroupId,
        generated: false,
      });
    }

    // ─── Single item creation (legacy/default) ─────────────────────────
    const { data: item, error } = await supabase
      .from('content_items')
      .insert({
        ...sharedFields,
        platforms,
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
