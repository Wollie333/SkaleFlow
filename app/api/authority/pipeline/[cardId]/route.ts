import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { checkAuthorityAccess } from '@/lib/authority/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ cardId: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { cardId } = await params;

  // Use service client for initial lookup to get organization_id (RLS-safe for super_admin)
  const svc = createServiceClient();
  const { data: cardOrg } = await svc
    .from('authority_pipeline_cards')
    .select('organization_id')
    .eq('id', cardId)
    .single();
  if (!cardOrg) return NextResponse.json({ error: 'Card not found' }, { status: 404 });

  // Verify membership (super_admin bypass)
  const access = await checkAuthorityAccess(supabase, user.id, cardOrg.organization_id);
  if (!access.authorized) return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  const db = access.queryClient;

  const { data: card, error } = await db
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

  // Get checklist counts
  const { count: checklistTotal } = await db
    .from('authority_card_checklist')
    .select('id', { count: 'exact', head: true })
    .eq('card_id', cardId);

  const { count: checklistCompleted } = await db
    .from('authority_card_checklist')
    .select('id', { count: 'exact', head: true })
    .eq('card_id', cardId)
    .eq('is_completed', true);

  // Get correspondence count
  const { count: correspondenceCount } = await db
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

  // Use service client for initial lookup to get organization_id (RLS-safe for super_admin)
  const svc = createServiceClient();
  const { data: existingCard } = await svc
    .from('authority_pipeline_cards')
    .select('organization_id')
    .eq('id', cardId)
    .single();
  if (!existingCard) return NextResponse.json({ error: 'Card not found' }, { status: 404 });

  const access = await checkAuthorityAccess(supabase, user.id, existingCard.organization_id);
  if (!access.authorized) return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  const db = access.queryClient;

  // Separate commercial data from card fields
  const { commercial, ...cardFields } = body;

  // Update card (only card-level fields, skip if no card fields to update)
  const hasCardFields = Object.keys(cardFields).length > 0;
  let card;

  if (hasCardFields) {
    const { data, error } = await db
      .from('authority_pipeline_cards')
      .update({ ...cardFields, updated_at: new Date().toISOString() })
      .eq('id', cardId)
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    card = data;
  } else {
    const { data } = await db
      .from('authority_pipeline_cards')
      .select()
      .eq('id', cardId)
      .single();
    card = data;
  }

  // Update commercial if included — use service client to bypass RLS
  // (auth already verified above via checkAuthorityAccess)
  if (commercial) {
    const { data: existing } = await svc
      .from('authority_commercial')
      .select('id')
      .eq('card_id', cardId)
      .maybeSingle();

    if (existing) {
      const { error: comErr } = await svc
        .from('authority_commercial')
        .update({ ...commercial, updated_at: new Date().toISOString() })
        .eq('card_id', cardId);
      if (comErr) return NextResponse.json({ error: comErr.message }, { status: 500 });
    } else {
      const { error: comErr } = await svc
        .from('authority_commercial')
        .insert({
          organization_id: existingCard.organization_id,
          card_id: cardId,
          ...commercial,
        });
      if (comErr) return NextResponse.json({ error: comErr.message }, { status: 500 });
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

  // Use service client for initial lookup to get organization_id (RLS-safe for super_admin)
  const svc = createServiceClient();
  const { data: card } = await svc
    .from('authority_pipeline_cards')
    .select('organization_id')
    .eq('id', cardId)
    .single();
  if (!card) return NextResponse.json({ error: 'Card not found' }, { status: 404 });

  // Only owners/admins can delete (super_admin bypass)
  const access = await checkAuthorityAccess(supabase, user.id, card.organization_id);
  if (!access.authorized || !['owner', 'admin'].includes(access.role!)) {
    return NextResponse.json({ error: 'Only owners and admins can delete cards' }, { status: 403 });
  }
  const db = access.queryClient;

  const { error } = await db
    .from('authority_pipeline_cards')
    .delete()
    .eq('id', cardId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
