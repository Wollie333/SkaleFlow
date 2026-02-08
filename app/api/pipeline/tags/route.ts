import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const organizationId = searchParams.get('organizationId');
  if (!organizationId) return NextResponse.json({ error: 'organizationId required' }, { status: 400 });

  const { data: member } = await supabase.from('org_members').select('role').eq('organization_id', organizationId).eq('user_id', user.id).single();
  if (!member) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { data, error } = await supabase.from('pipeline_tags').select('*').eq('organization_id', organizationId).order('name');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  if (!body.organizationId || !body.name) return NextResponse.json({ error: 'organizationId and name required' }, { status: 400 });

  const { data: member } = await supabase.from('org_members').select('role').eq('organization_id', body.organizationId).eq('user_id', user.id).single();
  if (!member) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { data, error } = await supabase.from('pipeline_tags').insert({
    organization_id: body.organizationId,
    name: body.name,
    color: body.color || '#6B7280',
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  if (!body.id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const { data: tag } = await supabase.from('pipeline_tags').select('organization_id').eq('id', body.id).single();
  if (!tag) return NextResponse.json({ error: 'Tag not found' }, { status: 404 });

  const { data: member } = await supabase.from('org_members').select('role').eq('organization_id', tag.organization_id).eq('user_id', user.id).single();
  if (!member) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { data, error } = await supabase.from('pipeline_tags').update({ name: body.name, color: body.color }).eq('id', body.id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const tagId = searchParams.get('tagId');
  if (!tagId) return NextResponse.json({ error: 'tagId required' }, { status: 400 });

  const { data: tag } = await supabase.from('pipeline_tags').select('organization_id').eq('id', tagId).single();
  if (!tag) return NextResponse.json({ error: 'Tag not found' }, { status: 404 });

  const { data: member } = await supabase.from('org_members').select('role').eq('organization_id', tag.organization_id).eq('user_id', user.id).single();
  if (!member) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { error } = await supabase.from('pipeline_tags').delete().eq('id', tagId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
