import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { Json } from '@/types/database';

export async function GET(request: NextRequest, { params }: { params: Promise<{ pipelineId: string; contactId: string }> }) {
  const { contactId, pipelineId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: contact, error } = await supabase
    .from('pipeline_contacts')
    .select('*, pipeline_contact_tags(tag_id, pipeline_tags(id, name, color))')
    .eq('id', contactId)
    .eq('pipeline_id', pipelineId)
    .single();

  if (error || !contact) return NextResponse.json({ error: 'Contact not found' }, { status: 404 });

  const { data: member } = await supabase.from('org_members').select('role').eq('organization_id', contact.organization_id).eq('user_id', user.id).single();
  if (!member) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  // Get activity log
  const { data: activity } = await supabase
    .from('pipeline_activity')
    .select('*')
    .eq('contact_id', contactId)
    .order('created_at', { ascending: false })
    .limit(50);

  return NextResponse.json({ ...contact, activity: activity || [] });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ pipelineId: string; contactId: string }> }) {
  const { contactId, pipelineId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();

  const { data: existing } = await supabase.from('pipeline_contacts').select('organization_id').eq('id', contactId).single();
  if (!existing) return NextResponse.json({ error: 'Contact not found' }, { status: 404 });

  const { data: member } = await supabase.from('org_members').select('role').eq('organization_id', existing.organization_id).eq('user_id', user.id).single();
  if (!member) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (body.full_name !== undefined) updateData.full_name = body.full_name;
  if (body.email !== undefined) updateData.email = body.email;
  if (body.phone !== undefined) updateData.phone = body.phone;
  if (body.company !== undefined) updateData.company = body.company;
  if (body.value_cents !== undefined) updateData.value_cents = body.value_cents;
  if (body.assigned_to !== undefined) updateData.assigned_to = body.assigned_to;
  if (body.notes !== undefined) updateData.notes = body.notes;
  if (body.custom_fields !== undefined) updateData.custom_fields = (body.custom_fields || {}) as unknown as Json;

  const { data, error } = await supabase.from('pipeline_contacts').update(updateData).eq('id', contactId).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ pipelineId: string; contactId: string }> }) {
  const { contactId, pipelineId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: existing } = await supabase.from('pipeline_contacts').select('organization_id').eq('id', contactId).single();
  if (!existing) return NextResponse.json({ error: 'Contact not found' }, { status: 404 });

  const { data: member } = await supabase.from('org_members').select('role').eq('organization_id', existing.organization_id).eq('user_id', user.id).single();
  if (!member) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { error } = await supabase.from('pipeline_contacts').delete().eq('id', contactId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
