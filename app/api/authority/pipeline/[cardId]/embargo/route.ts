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

  const { data: card } = await supabase
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

  const { data, error } = await supabase
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
