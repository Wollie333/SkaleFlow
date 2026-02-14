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
  const { data: card } = await svc
    .from('authority_pipeline_cards')
    .select('organization_id')
    .eq('id', cardId)
    .single();
  if (!card) return NextResponse.json({ error: 'Card not found' }, { status: 404 });

  const access = await checkAuthorityAccess(supabase, user.id, card.organization_id);
  if (!access.authorized) return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  const db = access.queryClient;

  const { data: items, error } = await db
    .from('authority_card_checklist')
    .select('*')
    .eq('card_id', cardId)
    .order('display_order', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(items || []);
}

export async function POST(
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
  const { data: card } = await svc
    .from('authority_pipeline_cards')
    .select('organization_id')
    .eq('id', cardId)
    .single();
  if (!card) return NextResponse.json({ error: 'Card not found' }, { status: 404 });

  const access = await checkAuthorityAccess(supabase, user.id, card.organization_id);
  if (!access.authorized) return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  const db = access.queryClient;

  if (!body.item_text) {
    return NextResponse.json({ error: 'item_text required' }, { status: 400 });
  }

  // Get the highest display_order for this card
  const { data: lastItem } = await db
    .from('authority_card_checklist')
    .select('display_order')
    .eq('card_id', cardId)
    .order('display_order', { ascending: false })
    .limit(1)
    .single();

  const { data: item, error } = await db
    .from('authority_card_checklist')
    .insert({
      card_id: cardId,
      organization_id: card.organization_id,
      item_text: body.item_text,
      is_system: false,
      display_order: (lastItem?.display_order ?? -1) + 1,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(item, { status: 201 });
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
  const { itemId, is_completed } = body;

  if (!itemId || typeof is_completed !== 'boolean') {
    return NextResponse.json({ error: 'itemId and is_completed required' }, { status: 400 });
  }

  // Use service client for initial lookup to get organization_id (RLS-safe for super_admin)
  const svc = createServiceClient();
  const { data: card } = await svc
    .from('authority_pipeline_cards')
    .select('organization_id')
    .eq('id', cardId)
    .single();
  if (!card) return NextResponse.json({ error: 'Card not found' }, { status: 404 });

  const access = await checkAuthorityAccess(supabase, user.id, card.organization_id);
  if (!access.authorized) return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  const db = access.queryClient;

  const { data: item, error } = await db
    .from('authority_card_checklist')
    .update({
      is_completed,
      completed_at: is_completed ? new Date().toISOString() : null,
      completed_by: is_completed ? user.id : null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', itemId)
    .eq('card_id', cardId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(item);
}
