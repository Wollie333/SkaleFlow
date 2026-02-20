import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

async function isSuperAdmin(userId: string): Promise<boolean> {
  const sc = createServiceClient();
  const { data } = await sc.from('users').select('role').eq('id', userId).single();
  return data?.role === 'super_admin';
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabase
    .from('call_templates')
    .select('*')
    .eq('id', id)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const superAdmin = await isSuperAdmin(user.id);
  return NextResponse.json({ ...data, _isSuperAdmin: superAdmin });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: template } = await supabase
    .from('call_templates')
    .select('is_system')
    .eq('id', id)
    .single();

  const superAdmin = await isSuperAdmin(user.id);

  // Only super_admin can edit system templates
  if (template?.is_system && !superAdmin) {
    return NextResponse.json({ error: 'System templates cannot be edited. Clone it to create your own version.' }, { status: 403 });
  }

  const body = await request.json();
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  const allowed = ['name', 'description', 'call_type', 'phases', 'opening_script', 'closing_script', 'objection_bank', 'is_active'];
  for (const k of allowed) {
    if (body[k] !== undefined) updates[k] = body[k];
  }

  // Use service client for system templates (RLS blocks normal updates)
  const client = template?.is_system ? createServiceClient() : supabase;
  const { data, error } = await client
    .from('call_templates')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: template } = await supabase
    .from('call_templates')
    .select('is_system')
    .eq('id', id)
    .single();

  const superAdmin = await isSuperAdmin(user.id);

  // Only super_admin can delete system templates
  if (template?.is_system && !superAdmin) {
    return NextResponse.json({ error: 'System templates cannot be deleted.' }, { status: 403 });
  }

  // Use service client for system templates (RLS blocks normal deletes)
  const client = template?.is_system ? createServiceClient() : supabase;
  const { error } = await client
    .from('call_templates')
    .delete()
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
