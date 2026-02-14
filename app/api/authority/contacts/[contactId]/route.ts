import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ contactId: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { contactId } = await params;

  const { data: contact, error } = await supabase
    .from('authority_contacts')
    .select('*')
    .eq('id', contactId)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 404 });

  // Verify membership
  const { data: member } = await supabase
    .from('org_members')
    .select('role')
    .eq('organization_id', contact.organization_id)
    .eq('user_id', user.id)
    .single();
  if (!member) return NextResponse.json({ error: 'Not a member of this organization' }, { status: 403 });

  // Get relationship timeline: pipeline cards
  const { data: cards } = await supabase
    .from('authority_pipeline_cards')
    .select('id, opportunity_name, category, authority_pipeline_stages(name, slug, color), created_at, published_at')
    .eq('contact_id', contactId)
    .order('created_at', { ascending: false });

  // Get correspondence history
  const { data: correspondence } = await supabase
    .from('authority_correspondence')
    .select('id, type, direction, email_subject, summary, occurred_at')
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

  const { data: existing } = await supabase
    .from('authority_contacts')
    .select('organization_id')
    .eq('id', contactId)
    .single();
  if (!existing) return NextResponse.json({ error: 'Contact not found' }, { status: 404 });

  const { data: member } = await supabase
    .from('org_members')
    .select('role')
    .eq('organization_id', existing.organization_id)
    .eq('user_id', user.id)
    .single();
  if (!member) return NextResponse.json({ error: 'Not a member of this organization' }, { status: 403 });

  const { data: contact, error } = await supabase
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

  const { data: contact } = await supabase
    .from('authority_contacts')
    .select('organization_id')
    .eq('id', contactId)
    .single();
  if (!contact) return NextResponse.json({ error: 'Contact not found' }, { status: 404 });

  const { data: member } = await supabase
    .from('org_members')
    .select('role')
    .eq('organization_id', contact.organization_id)
    .eq('user_id', user.id)
    .single();
  if (!member || !['owner', 'admin'].includes(member.role)) {
    return NextResponse.json({ error: 'Only owners and admins can delete contacts' }, { status: 403 });
  }

  const { error } = await supabase
    .from('authority_contacts')
    .delete()
    .eq('id', contactId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
