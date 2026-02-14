import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { AMPLIFICATION_POSTS, TEASER_POSTS } from '@/lib/authority/amplification-templates';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ cardId: string }> }
) {
  const supabase = await createClient();
  const serviceClient = createServiceClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { cardId } = await params;
  const { campaignType } = await request.json();
  // campaignType: 'teaser' (pre-launch) or 'amplification' (post-publish)

  // Get card details
  const { data: card } = await supabase
    .from('authority_pipeline_cards')
    .select(`
      *,
      authority_pipeline_stages(slug),
      authority_contacts(full_name, outlet)
    `)
    .eq('id', cardId)
    .single();

  if (!card) return NextResponse.json({ error: 'Card not found' }, { status: 404 });

  // Embargo check
  if (card.embargo_active && card.embargo_date && new Date(card.embargo_date) > new Date()) {
    return NextResponse.json({ error: 'Cannot create amplification campaign — embargo is still active' }, { status: 400 });
  }

  const templates = campaignType === 'teaser' ? TEASER_POSTS : AMPLIFICATION_POSTS;
  const baseDate = card.published_at ? new Date(card.published_at) : new Date();
  const stageSlug = (card.authority_pipeline_stages as { slug: string } | null)?.slug;

  // For teasers, only allow at 'agreed' stage or later
  if (campaignType === 'teaser' && !['agreed', 'content_prep', 'submitted', 'published', 'amplified'].includes(stageSlug || '')) {
    return NextResponse.json({ error: 'Teasers can only be created from the Agreed stage onwards' }, { status: 400 });
  }

  // Get or create a calendar for this campaign
  const campaignName = `${campaignType === 'teaser' ? 'Teaser' : 'Amplification'}: ${card.opportunity_name}`;

  const { data: calendar } = await serviceClient
    .from('content_calendars')
    .insert({
      organization_id: card.organization_id,
      name: campaignName,
      start_date: baseDate.toISOString().slice(0, 10),
      end_date: new Date(baseDate.getTime() + 30 * 86400000).toISOString().slice(0, 10),
      created_by: user.id,
    })
    .select('id')
    .single();

  if (!calendar) return NextResponse.json({ error: 'Failed to create campaign calendar' }, { status: 500 });

  // Create content items
  const items = templates.map((tpl) => {
    const scheduledDate = new Date(baseDate.getTime() + tpl.dayOffset * 86400000);
    return {
      organization_id: card.organization_id,
      calendar_id: calendar.id,
      topic: `${tpl.label} — ${card.opportunity_name}`,
      caption: tpl.description,
      scheduled_date: scheduledDate.toISOString().slice(0, 10),
      scheduled_time: '09:00',
      time_slot: 'AM' as const,
      funnel_stage: 'awareness' as const,
      storybrand_stage: 'guide' as const,
      format: 'text',
      platforms: tpl.suggestedPlatforms,
      status: 'idea' as const,
      assigned_to: user.id,
    };
  });

  const { data: created, error } = await serviceClient
    .from('content_items')
    .insert(items)
    .select('id');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    created_count: created?.length || 0,
    calendar_id: calendar.id,
    campaign_name: campaignName,
  });
}
