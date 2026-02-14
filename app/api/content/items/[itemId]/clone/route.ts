import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const { itemId } = await params;
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch source item
    const { data: source, error: fetchError } = await supabase
      .from('content_items')
      .select('*')
      .eq('id', itemId)
      .single();

    if (fetchError || !source) {
      return NextResponse.json({ error: 'Content item not found' }, { status: 404 });
    }

    // Verify org membership
    const { data: membership } = await supabase
      .from('org_members')
      .select('id')
      .eq('organization_id', source.organization_id)
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const today = new Date().toISOString().split('T')[0];

    // Build clone: preserve content fields, reset lifecycle fields
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const clone: any = {
      organization_id: source.organization_id,
      calendar_id: source.calendar_id,
      scheduled_date: today,
      scheduled_time: null,
      time_slot: source.time_slot,
      funnel_stage: source.funnel_stage,
      storybrand_stage: source.storybrand_stage,
      format: source.format,
      topic: source.topic ? `${source.topic} (copy)` : '(copy)',
      hook: source.hook,
      script_body: source.script_body,
      cta: source.cta,
      caption: source.caption,
      hashtags: source.hashtags,
      platforms: source.platforms,
      platform_specs: source.platform_specs,
      media_urls: source.media_urls,
      filming_notes: source.filming_notes,
      context_section: source.context_section,
      teaching_points: source.teaching_points,
      reframe: source.reframe,
      problem_expansion: source.problem_expansion,
      case_study: source.case_study,
      framework_teaching: source.framework_teaching,
      target_url: source.target_url,
      utm_parameters: source.utm_parameters,
      angle_id: source.angle_id,
      assigned_to: source.assigned_to,
      placement_type: source.placement_type,
      // Reset lifecycle fields
      status: 'scripted',
      published_at: null,
      approved_at: null,
      approved_by: null,
      rejection_reason: null,
      review_comment: null,
      variation_group_id: null,
      is_primary_variation: true,
    };

    const { data: cloned, error: insertError } = await supabase
      .from('content_items')
      .insert(clone)
      .select()
      .single();

    if (insertError) {
      console.error('Clone insert error:', insertError);
      return NextResponse.json({ error: 'Failed to clone content item' }, { status: 500 });
    }

    return NextResponse.json({ item: cloned });
  } catch (error) {
    console.error('Clone content item error:', error);
    return NextResponse.json({ error: 'Failed to clone content item' }, { status: 500 });
  }
}
