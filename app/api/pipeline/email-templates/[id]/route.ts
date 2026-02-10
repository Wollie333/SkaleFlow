import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabase.from('email_templates').select('*').eq('id', id).single();
  if (error || !data) return NextResponse.json({ error: 'Template not found' }, { status: 404 });

  const { data: member } = await supabase.from('org_members').select('role').eq('organization_id', data.organization_id).eq('user_id', user.id).single();
  if (!member) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  return NextResponse.json(data);
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();

  const { data: existing } = await supabase.from('email_templates').select('organization_id').eq('id', id).single();
  if (!existing) return NextResponse.json({ error: 'Template not found' }, { status: 404 });

  const { data: member } = await supabase.from('org_members').select('role').eq('organization_id', existing.organization_id).eq('user_id', user.id).single();
  if (!member) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { data, error } = await supabase.from('email_templates').update({
    name: body.name,
    subject: body.subject,
    body_html: body.body_html,
    merge_fields: body.merge_fields,
    updated_at: new Date().toISOString(),
  }).eq('id', id).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: existing } = await supabase.from('email_templates').select('organization_id').eq('id', id).single();
  if (!existing) return NextResponse.json({ error: 'Template not found' }, { status: 404 });

  const { data: member } = await supabase.from('org_members').select('role').eq('organization_id', existing.organization_id).eq('user_id', user.id).single();
  if (!member) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { error } = await supabase.from('email_templates').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
