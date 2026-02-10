import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const organizationId = searchParams.get('organizationId');
  if (!organizationId) return NextResponse.json({ error: 'organizationId required' }, { status: 400 });

  const { data: member } = await supabase.from('org_members').select('role').eq('organization_id', organizationId).eq('user_id', user.id).single();
  if (!member) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { data, error } = await supabase.from('webhook_endpoints').select('*').eq('organization_id', organizationId).order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  if (!body.organizationId || !body.name || !body.url) return NextResponse.json({ error: 'organizationId, name, and url required' }, { status: 400 });

  const { data: member } = await supabase.from('org_members').select('role').eq('organization_id', body.organizationId).eq('user_id', user.id).single();
  if (!member || !['owner', 'admin'].includes(member.role)) return NextResponse.json({ error: 'Admin access required' }, { status: 403 });

  const { data, error } = await supabase.from('webhook_endpoints').insert({
    organization_id: body.organizationId,
    name: body.name,
    url: body.url,
    method: body.method || 'POST',
    headers: (body.headers || {}) as unknown as import('@/types/database').Json,
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
