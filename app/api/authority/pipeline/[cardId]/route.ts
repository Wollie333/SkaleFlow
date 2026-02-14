import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ cardId: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { cardId } = await params;

  const { data: card, error } = await supabase
    .from('authority_pipeline_cards')
    .select(`
      *,
      authority_pipeline_stages(id, name, slug, stage_order, stage_type, color),
      authority_contacts(id, full_name, email, outlet, role, warmth, linkedin_url, twitter_url),
      authority_story_angles(id, title, description),
      authority_commercial(*)
    `)
    .eq('id', cardId)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 404 });

  // Verify membership
  const { data: member } = await supabase
    .from('org_members')
    .select('role')
    .eq('organization_id', card.organization_id)
    .eq('user_id', user.id)
    .single();
  if (!member) return NextResponse.json({ error: 'Not a member of this organization' }, { status: 403 });

  // Get checklist counts
  const { count: checklistTotal } = await supabase
    .from('authority_card_checklist')
    .select('id', { count: 'exact', head: true })
    .eq('card_id', cardId);

  const { count: checklistCompleted } = await supabase
    .from('authority_card_checklist')
    .select('id', { count: 'exact', head: true })
    .eq('card_id', cardId)
    .eq('is_completed', true);

  // Get correspondence count
  const { count: correspondenceCount } = await supabase
    .from('authority_correspondence')
    .select('id', { count: 'exact', head: true })
    .eq('card_id', cardId);

  return NextResponse.json({
    ...card,
    checklist_count: checklistTotal || 0,
    checklist_completed: checklistCompleted || 0,
    correspondence_count: correspondenceCount || 0,
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ cardId: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { cardId } = await params;
  const body = await request.json();

  // Verify card exists and user has access
  const { data: existingCard } = await supabase
    .from('authority_pipeline_cards')
    .select('organization_id')
    .eq('id', cardId)
    .single();
  if (!existingCard) return NextResponse.json({ error: 'Card not found' }, { status: 404 });

  const { data: member } = await supabase
    .from('org_members')
    .select('role')
    .eq('organization_id', existingCard.organization_id)
    .eq('user_id', user.id)
    .single();
  if (!member) return NextResponse.json({ error: 'Not a member of this organization' }, { status: 403 });

  // Update card
  const { data: card, error } = await supabase
    .from('authority_pipeline_cards')
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq('id', cardId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Update commercial if included
  if (body.commercial) {
    const { data: existing } = await supabase
      .from('authority_commercial')
      .select('id')
      .eq('card_id', cardId)
      .single();

    if (existing) {
      await supabase
        .from('authority_commercial')
        .update({ ...body.commercial, updated_at: new Date().toISOString() })
        .eq('card_id', cardId);
    } else {
      await supabase.from('authority_commercial').insert({
        organization_id: existingCard.organization_id,
        card_id: cardId,
        ...body.commercial,
      });
    }
  }

  return NextResponse.json(card);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ cardId: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { cardId } = await params;

  const { data: card } = await supabase
    .from('authority_pipeline_cards')
    .select('organization_id')
    .eq('id', cardId)
    .single();
  if (!card) return NextResponse.json({ error: 'Card not found' }, { status: 404 });

  // Only owners/admins can delete
  const { data: member } = await supabase
    .from('org_members')
    .select('role')
    .eq('organization_id', card.organization_id)
    .eq('user_id', user.id)
    .single();
  if (!member || !['owner', 'admin'].includes(member.role)) {
    return NextResponse.json({ error: 'Only owners and admins can delete cards' }, { status: 403 });
  }

  const { error } = await supabase
    .from('authority_pipeline_cards')
    .delete()
    .eq('id', cardId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
