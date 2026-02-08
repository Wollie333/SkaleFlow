import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: workflow, error } = await supabase
    .from('automation_workflows')
    .select('*, automation_steps(*)')
    .eq('id', params.id)
    .single();

  if (error || !workflow) return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });

  const { data: member } = await supabase.from('org_members').select('role').eq('organization_id', workflow.organization_id).eq('user_id', user.id).single();
  if (!member) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  return NextResponse.json(workflow);
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();

  const { data: existing } = await supabase.from('automation_workflows').select('organization_id').eq('id', params.id).single();
  if (!existing) return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });

  const { data: member } = await supabase.from('org_members').select('role').eq('organization_id', existing.organization_id).eq('user_id', user.id).single();
  if (!member || !['owner', 'admin'].includes(member.role)) return NextResponse.json({ error: 'Admin access required' }, { status: 403 });

  const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (body.name !== undefined) updateData.name = body.name;
  if (body.description !== undefined) updateData.description = body.description;
  if (body.is_active !== undefined) updateData.is_active = body.is_active;
  if (body.trigger_type !== undefined) updateData.trigger_type = body.trigger_type;
  if (body.trigger_config !== undefined) updateData.trigger_config = body.trigger_config as unknown as import('@/types/database').Json;
  if (body.graph_data !== undefined) updateData.graph_data = body.graph_data as unknown as import('@/types/database').Json;

  const { data, error } = await supabase.from('automation_workflows').update(updateData).eq('id', params.id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: existing } = await supabase.from('automation_workflows').select('organization_id').eq('id', params.id).single();
  if (!existing) return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });

  const { data: member } = await supabase.from('org_members').select('role').eq('organization_id', existing.organization_id).eq('user_id', user.id).single();
  if (!member || !['owner', 'admin'].includes(member.role)) return NextResponse.json({ error: 'Admin access required' }, { status: 403 });

  const { error } = await supabase.from('automation_workflows').delete().eq('id', params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
