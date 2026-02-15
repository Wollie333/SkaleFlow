import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { checkAuthorityAccess } from '@/lib/authority/auth';

// Map DB column names to what the client expects
function mapCorrespondenceForClient(item: Record<string, unknown>) {
  return {
    ...item,
    // Client expects correspondence_type, subject, body
    correspondence_type: item.type,
    subject: item.email_subject || item.summary || '',
    body: item.content || item.email_body_text || null,
  };
}

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

  const { data: correspondence, error } = await db
    .from('authority_correspondence')
    .select('*, authority_contacts(id, full_name, outlet)')
    .eq('card_id', cardId)
    .order('occurred_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json((correspondence || []).map(mapCorrespondenceForClient));
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

  // Accept both old client names and DB names:
  // correspondence_type -> type, subject -> email_subject, body -> content
  const corrType = body.type || body.correspondence_type;
  const occurredAt = body.occurred_at;

  if (!corrType || !occurredAt) {
    return NextResponse.json({ error: 'type and occurred_at required' }, { status: 400 });
  }

  const { data: item, error } = await db
    .from('authority_correspondence')
    .insert({
      organization_id: card.organization_id,
      card_id: cardId,
      contact_id: body.contact_id || null,
      type: corrType,
      direction: body.direction || null,
      email_subject: body.email_subject || body.subject || null,
      email_from: body.email_from || null,
      email_to: body.email_to || null,
      email_cc: body.email_cc || null,
      email_body_text: body.email_body_text || null,
      email_body_html: body.email_body_html || null,
      summary: body.summary || null,
      content: body.content || body.body || null,
      occurred_at: occurredAt,
      duration_minutes: body.duration_minutes || null,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(mapCorrespondenceForClient(item), { status: 201 });
}
