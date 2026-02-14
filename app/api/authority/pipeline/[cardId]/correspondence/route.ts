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

  // Verify card access
  const { data: card } = await supabase
    .from('authority_pipeline_cards')
    .select('organization_id')
    .eq('id', cardId)
    .single();
  if (!card) return NextResponse.json({ error: 'Card not found' }, { status: 404 });

  const { data: member } = await supabase
    .from('org_members')
    .select('role')
    .eq('organization_id', card.organization_id)
    .eq('user_id', user.id)
    .single();
  if (!member) return NextResponse.json({ error: 'Not a member of this organization' }, { status: 403 });

  const { data: correspondence, error } = await supabase
    .from('authority_correspondence')
    .select('*, authority_contacts(id, full_name, outlet)')
    .eq('card_id', cardId)
    .order('occurred_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(correspondence || []);
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

  // Verify card access
  const { data: card } = await supabase
    .from('authority_pipeline_cards')
    .select('organization_id')
    .eq('id', cardId)
    .single();
  if (!card) return NextResponse.json({ error: 'Card not found' }, { status: 404 });

  const { data: member } = await supabase
    .from('org_members')
    .select('role')
    .eq('organization_id', card.organization_id)
    .eq('user_id', user.id)
    .single();
  if (!member) return NextResponse.json({ error: 'Not a member of this organization' }, { status: 403 });

  if (!body.type || !body.occurred_at) {
    return NextResponse.json({ error: 'type and occurred_at required' }, { status: 400 });
  }

  const { data: item, error } = await supabase
    .from('authority_correspondence')
    .insert({
      organization_id: card.organization_id,
      card_id: cardId,
      contact_id: body.contact_id || null,
      type: body.type,
      direction: body.direction || null,
      email_subject: body.email_subject || null,
      email_from: body.email_from || null,
      email_to: body.email_to || null,
      email_cc: body.email_cc || null,
      email_body_text: body.email_body_text || null,
      email_body_html: body.email_body_html || null,
      summary: body.summary || null,
      content: body.content || null,
      occurred_at: body.occurred_at,
      duration_minutes: body.duration_minutes || null,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(item, { status: 201 });
}
