import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabase.from('webhook_endpoints').select('*').eq('id', params.id).single();
  if (error || !data) return NextResponse.json({ error: 'Endpoint not found' }, { status: 404 });

  const { data: member } = await supabase.from('org_members').select('role').eq('organization_id', data.organization_id).eq('user_id', user.id).single();
  if (!member) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  return NextResponse.json(data);
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { data: existing } = await supabase.from('webhook_endpoints').select('organization_id').eq('id', params.id).single();
  if (!existing) return NextResponse.json({ error: 'Endpoint not found' }, { status: 404 });

  const { data: member } = await supabase.from('org_members').select('role').eq('organization_id', existing.organization_id).eq('user_id', user.id).single();
  if (!member || !['owner', 'admin'].includes(member.role)) return NextResponse.json({ error: 'Admin access required' }, { status: 403 });

  const { data, error } = await supabase.from('webhook_endpoints').update({
    name: body.name,
    url: body.url,
    method: body.method,
    headers: body.headers as unknown as import('@/types/database').Json,
    is_active: body.is_active,
    updated_at: new Date().toISOString(),
  }).eq('id', params.id).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: existing } = await supabase.from('webhook_endpoints').select('organization_id').eq('id', params.id).single();
  if (!existing) return NextResponse.json({ error: 'Endpoint not found' }, { status: 404 });

  const { data: member } = await supabase.from('org_members').select('role').eq('organization_id', existing.organization_id).eq('user_id', user.id).single();
  if (!member || !['owner', 'admin'].includes(member.role)) return NextResponse.json({ error: 'Admin access required' }, { status: 403 });

  const { error } = await supabase.from('webhook_endpoints').delete().eq('id', params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
