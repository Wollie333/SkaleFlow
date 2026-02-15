import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { checkAuthorityAccess } from '@/lib/authority/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ contactId: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { contactId } = await params;
  const url = new URL(request.url);

  // Use service client for initial lookup to get organization_id (RLS-safe for super_admin)
  const svc = createServiceClient();
  const { data: contactOrg } = await svc
    .from('authority_contacts')
    .select('organization_id')
    .eq('id', contactId)
    .single();
  if (!contactOrg) return NextResponse.json({ error: 'Contact not found' }, { status: 404 });

  // Verify membership (super_admin bypass)
  const access = await checkAuthorityAccess(supabase, user.id, contactOrg.organization_id);
  if (!access.authorized) return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  const db = access.queryClient;

  const { data: contact, error } = await db
    .from('authority_contacts')
    .select('*')
    .eq('id', contactId)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 404 });

  // Get relationship timeline: pipeline cards
  const { data: cards } = await db
    .from('authority_pipeline_cards')
    .select('id, opportunity_name, category, authority_pipeline_stages(name, slug, color), created_at, published_at')
    .eq('contact_id', contactId)
    .order('created_at', { ascending: false });

  // Get correspondence history — full fields if include=correspondence requested
  const includeParam = url.searchParams.get('include');
  const correspondenceSelect = includeParam === 'correspondence'
    ? 'id, type, direction, email_subject, email_from, email_to, email_body_text, summary, content, occurred_at, card_id'
    : 'id, type, direction, email_subject, summary, occurred_at';

  const { data: correspondence } = await db
    .from('authority_correspondence')
    .select(correspondenceSelect)
    .eq('contact_id', contactId)
    .order('occurred_at', { ascending: false });

  return NextResponse.json({
    ...contact,
    pipeline_cards: cards || [],
    correspondence: correspondence || [],
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ contactId: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { contactId } = await params;
  const body = await request.json();

  // Use service client for initial lookup to get organization_id (RLS-safe for super_admin)
  const svc = createServiceClient();
  const { data: existing } = await svc
    .from('authority_contacts')
    .select('organization_id')
    .eq('id', contactId)
    .single();
  if (!existing) return NextResponse.json({ error: 'Contact not found' }, { status: 404 });

  // Verify membership (super_admin bypass)
  const access = await checkAuthorityAccess(supabase, user.id, existing.organization_id);
  if (!access.authorized) return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  const db = access.queryClient;

  const { data: contact, error } = await db
    .from('authority_contacts')
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq('id', contactId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(contact);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ contactId: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { contactId } = await params;

  // Use service client for initial lookup to get organization_id (RLS-safe for super_admin)
  const svc = createServiceClient();
  const { data: contact } = await svc
    .from('authority_contacts')
    .select('organization_id')
    .eq('id', contactId)
    .single();
  if (!contact) return NextResponse.json({ error: 'Contact not found' }, { status: 404 });

  // Verify owner/admin (super_admin bypass)
  const access = await checkAuthorityAccess(supabase, user.id, contact.organization_id);
  if (!access.authorized || !['owner', 'admin'].includes(access.role!)) {
    return NextResponse.json({ error: 'Only owners and admins can delete contacts' }, { status: 403 });
  }
  const db = access.queryClient;

  const { error } = await db
    .from('authority_contacts')
    .delete()
    .eq('id', contactId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
