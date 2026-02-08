import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateContentForItems } from '@/lib/content-engine/generate-content';
import type { Json } from '@/types/database';

export async function POST(request: Request) {
  try {
    const { calendarId, weekNumber, modelOverride, limit } = await request.json();

    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get calendar + verify access
    const { data: calendar } = await supabase
      .from('content_calendars')
      .select('*, organization:organizations(id, name)')
      .eq('id', calendarId)
      .single();

    if (!calendar) {
      return NextResponse.json({ error: 'Calendar not found' }, { status: 404 });
    }

    const { data: membership } = await supabase
      .from('org_members')
      .select('id')
      .eq('organization_id', calendar.organization_id)
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get all items for this week that need generation
    const { data: items } = await supabase
      .from('content_items')
      .select('id')
      .eq('calendar_id', calendarId)
      .eq('generation_week', weekNumber)
      .eq('status', 'idea');

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'No items to generate for this week' }, { status: 404 });
    }

    // If limit is specified, only generate that many items
    const limitedItems = limit && limit > 0 && limit < items.length
      ? items.slice(0, limit)
      : items;
    const itemIds = limitedItems.map(i => i.id);

    // Call the shared generation function directly (no internal HTTP fetch)
    const generateResult = await generateContentForItems(
      supabase,
      calendar.organization_id,
      itemIds,
      user.id,
      modelOverride
    );

    // Update calendar generation progress — only advance if all items in the week were generated
    const progress = (calendar.generation_progress || { weeks_generated: 0, total_weeks: 0 }) as { weeks_generated: number; total_weeks: number };
    const allGenerated = itemIds.length === items.length;
    const newProgress = {
      weeks_generated: allGenerated
        ? Math.max(progress.weeks_generated, weekNumber)
        : progress.weeks_generated,
      total_weeks: progress.total_weeks,
    };

    await supabase
      .from('content_calendars')
      .update({
        generation_progress: newProgress as unknown as Json,
        updated_at: new Date().toISOString(),
      })
      .eq('id', calendarId);

    return NextResponse.json({
      weekNumber,
      generatedCount: itemIds.length,
      results: generateResult.results,
      progress: newProgress,
      creditExhausted: generateResult.creditExhausted || false,
    });
  } catch (error) {
    console.error('Week generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate week content' },
      { status: 500 }
    );
  }
}
