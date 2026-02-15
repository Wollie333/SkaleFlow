import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { checkAuthorityAccess } from '@/lib/authority/auth';
import { STAGE_TIMESTAMP_MAP } from '@/lib/authority/constants';
import { getChecklistForCategory } from '@/lib/authority/checklist-templates';
import { calculateActivityScore } from '@/lib/authority/scoring';
import type { AuthorityCategory, AuthorityReachTier, AuthorityEngagementType } from '@/lib/authority/types';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ cardId: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { cardId } = await params;
  const body = await request.json();
  const { stage_id } = body;

  if (!stage_id) {
    return NextResponse.json({ error: 'stage_id required' }, { status: 400 });
  }

  // Use service client for initial lookup to get organization_id (RLS-safe for super_admin)
  const svc = createServiceClient();
  const { data: card } = await svc
    .from('authority_pipeline_cards')
    .select('*, authority_pipeline_stages(slug)')
    .eq('id', cardId)
    .single();
  if (!card) return NextResponse.json({ error: 'Card not found' }, { status: 404 });

  // Verify membership (super_admin bypass)
  const access = await checkAuthorityAccess(supabase, user.id, card.organization_id);
  if (!access.authorized) return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  const db = access.queryClient;

  // Get target stage
  const { data: targetStage } = await db
    .from('authority_pipeline_stages')
    .select('id, slug, name, stage_type, color')
    .eq('id', stage_id)
    .single();
  if (!targetStage) return NextResponse.json({ error: 'Target stage not found' }, { status: 404 });

  // Build update object
  const updates: Record<string, unknown> = {
    stage_id,
    updated_at: new Date().toISOString(),
  };

  // Auto-set timestamps based on target stage
  const timestampField = STAGE_TIMESTAMP_MAP[targetStage.slug];
  if (timestampField) {
    updates[timestampField] = new Date().toISOString();
  }

  // Handle decline metadata
  if (targetStage.slug === 'declined' && body.decline_reason) {
    updates.decline_reason = body.decline_reason;
    updates.decline_reason_other = body.decline_reason_other || null;
    updates.decline_try_again_date = body.decline_try_again_date || null;
    updates.decline_referred_to = body.decline_referred_to || null;
  }

  // Handle on-hold metadata
  if (targetStage.slug === 'on_hold') {
    updates.on_hold_reason = body.on_hold_reason || null;
    updates.on_hold_resume_date = body.on_hold_resume_date || null;
  }

  // Increment follow-up count for no_response
  if (targetStage.slug === 'no_response') {
    updates.no_response_follow_up_count = (card.no_response_follow_up_count || 0) + 1;
  }

  // Update the card
  const { data: updatedCard, error } = await db
    .from('authority_pipeline_cards')
    .update(updates)
    .eq('id', cardId)
    .select(`
      *,
      authority_pipeline_stages(id, name, slug, stage_order, stage_type, color)
    `)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Auto-generate checklist when moving to Content Prep (if none exists)
  if (targetStage.slug === 'content_prep') {
    const { count } = await db
      .from('authority_card_checklist')
      .select('id', { count: 'exact', head: true })
      .eq('card_id', cardId);

    if (!count || count === 0) {
      const items = getChecklistForCategory(card.category as AuthorityCategory);
      if (items.length > 0) {
        const serviceClient = createServiceClient();
        await serviceClient.from('authority_card_checklist').insert(
          items.map((text, i) => ({
            card_id: cardId,
            organization_id: card.organization_id,
            item_text: text,
            is_system: true,
            display_order: i,
          }))
        );
      }
    }
  }

  // Auto-create calendar events for key stages
  if (['agreed', 'submitted'].includes(targetStage.slug)) {
    const serviceClient = createServiceClient();

    if (targetStage.slug === 'agreed' && card.submission_deadline) {
      await serviceClient.from('authority_calendar_events').insert({
        organization_id: card.organization_id,
        card_id: cardId,
        event_type: 'submission_deadline',
        title: `Deadline: ${card.opportunity_name}`,
        event_date: card.submission_deadline,
        color: targetStage.color || '#14b8a6',
        created_by: user.id,
      });
    }

    if (targetStage.slug === 'agreed' && card.expected_publication_date) {
      await serviceClient.from('authority_calendar_events').insert({
        organization_id: card.organization_id,
        card_id: cardId,
        event_type: 'publication_date',
        title: `Publication: ${card.opportunity_name}`,
        event_date: card.expected_publication_date,
        color: '#84cc16',
        created_by: user.id,
      });
    }

    if (targetStage.slug === 'agreed' && card.embargo_date) {
      await serviceClient.from('authority_calendar_events').insert({
        organization_id: card.organization_id,
        card_id: cardId,
        event_type: 'embargo_lift',
        title: `Embargo lifts: ${card.opportunity_name}`,
        event_date: card.embargo_date,
        color: '#ef4444',
        created_by: user.id,
      });
    }
  }

  // Auto-score when moving to Published
  if (targetStage.slug === 'published') {
    const serviceClient2 = createServiceClient();

    // Check if already scored for this card
    const { count: existingScore } = await serviceClient2
      .from('authority_scores')
      .select('id', { count: 'exact', head: true })
      .eq('card_id', cardId);

    if (!existingScore || existingScore === 0) {
      // Get commercial data for engagement_type
      const { data: commercial } = await serviceClient2
        .from('authority_commercial')
        .select('engagement_type')
        .eq('card_id', cardId)
        .maybeSingle();

      const engagementType = (commercial?.engagement_type || 'earned') as AuthorityEngagementType;

      // Check if an amplification campaign exists for bonus
      const { count: ampCount } = await serviceClient2
        .from('content_calendars')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', card.organization_id)
        .ilike('name', `%${card.opportunity_name}%`);

      const result = calculateActivityScore({
        category: (card.category || 'thought_leadership') as AuthorityCategory,
        reachTier: (card.reach_tier || 'local') as AuthorityReachTier,
        engagementType,
        hasAmplification: (ampCount || 0) > 0,
      });

      await serviceClient2.from('authority_scores').insert({
        organization_id: card.organization_id,
        card_id: cardId,
        base_points: result.basePoints,
        reach_multiplier: result.reachMultiplier,
        engagement_multiplier: result.engagementMultiplier,
        amplification_bonus: result.amplificationBonus,
        round_bonus: result.roundBonus,
        consistency_bonus: result.consistencyBonus,
        total_points: result.totalPoints,
        activity_category: card.category || 'thought_leadership',
        reach_tier: (card.reach_tier || 'local') as AuthorityReachTier,
        engagement_type: engagementType,
        description: result.description,
      });
    }
  }

  return NextResponse.json(updatedCard);
}
