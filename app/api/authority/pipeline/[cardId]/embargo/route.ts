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

  // Look up organization_id from the card (service client to avoid RLS issues)
  const svc = createServiceClient();
  const { data: record } = await svc.from('authority_pipeline_cards').select('organization_id').eq('id', cardId).single();
  if (!record) return NextResponse.json({ error: 'Card not found' }, { status: 404 });

  const access = await checkAuthorityAccess(supabase, user.id, record.organization_id);
  if (!access.authorized) return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  const db = access.queryClient;

  const { data: card } = await db
    .from('authority_pipeline_cards')
    .select('embargo_active, embargo_date')
    .eq('id', cardId)
    .single();

  if (!card) return NextResponse.json({ error: 'Card not found' }, { status: 404 });

  const isActive = card.embargo_active && card.embargo_date && new Date(card.embargo_date) > new Date();

  return NextResponse.json({
    embargo_active: card.embargo_active,
    embargo_date: card.embargo_date,
    is_currently_embargoed: isActive,
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
  const { embargo_active, embargo_date } = await request.json();

  // Look up organization_id from the card (service client to avoid RLS issues)
  const svc = createServiceClient();
  const { data: record } = await svc.from('authority_pipeline_cards').select('organization_id').eq('id', cardId).single();
  if (!record) return NextResponse.json({ error: 'Card not found' }, { status: 404 });

  const access = await checkAuthorityAccess(supabase, user.id, record.organization_id);
  if (!access.authorized) return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  const db = access.queryClient;

  const { data, error } = await db
    .from('authority_pipeline_cards')
    .update({
      embargo_active: embargo_active ?? false,
      embargo_date: embargo_date || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', cardId)
    .select('embargo_active, embargo_date')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
