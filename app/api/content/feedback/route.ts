import { NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { contentItemId, feedbackType, reason, tags } = body;

    if (!contentItemId || !feedbackType) {
      return NextResponse.json({ error: 'contentItemId and feedbackType are required' }, { status: 400 });
    }

    if (!['rejected', 'accepted', 'regenerated'].includes(feedbackType)) {
      return NextResponse.json({ error: 'Invalid feedbackType' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Load content item to get org_id and generation config snapshot
    const { data: item, error: itemError } = await supabase
      .from('content_items')
      .select('id, organization_id, format, funnel_stage, storybrand_stage')
      .eq('id', contentItemId)
      .single();

    if (!item || itemError) {
      return NextResponse.json({ error: 'Content item not found' }, { status: 404 });
    }

    // Verify org membership
    const { data: membership } = await supabase
      .from('org_members')
      .select('id')
      .eq('organization_id', item.organization_id)
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const serviceClient = createServiceClient();

    const { data: feedback, error: insertError } = await serviceClient
      .from('content_feedback')
      .insert({
        content_item_id: contentItemId,
        organization_id: item.organization_id,
        user_id: user.id,
        feedback_type: feedbackType,
        reason: reason || null,
        tags: tags || [],
        generation_config: {
          format: item.format,
          funnel_stage: item.funnel_stage,
          storybrand_stage: item.storybrand_stage,
        },
      })
      .select('id')
      .single();

    if (insertError) {
      console.error('Insert feedback error:', insertError);
      return NextResponse.json({ error: 'Failed to save feedback' }, { status: 500 });
    }

    return NextResponse.json({ success: true, feedbackId: feedback?.id });
  } catch (error) {
    console.error('Feedback API error:', error);
    return NextResponse.json({ error: 'Failed to save feedback' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const feedbackType = searchParams.get('feedbackType');

    if (!organizationId) {
      return NextResponse.json({ error: 'organizationId is required' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify org membership
    const { data: membership } = await supabase
      .from('org_members')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    let query = supabase
      .from('content_feedback')
      .select('id, content_item_id, feedback_type, reason, tags, generation_config, created_at')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (feedbackType) {
      query = query.eq('feedback_type', feedbackType as 'rejected' | 'accepted' | 'regenerated');
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch feedback' }, { status: 500 });
    }

    return NextResponse.json({ feedback: data || [] });
  } catch (error) {
    console.error('Get feedback error:', error);
    return NextResponse.json({ error: 'Failed to fetch feedback' }, { status: 500 });
  }
}
