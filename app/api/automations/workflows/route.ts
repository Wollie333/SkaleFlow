import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const pipelineId = searchParams.get('pipelineId');
  if (!pipelineId) return NextResponse.json({ error: 'pipelineId required' }, { status: 400 });

  const { data: pipeline } = await supabase.from('pipelines').select('organization_id').eq('id', pipelineId).single();
  if (!pipeline) return NextResponse.json({ error: 'Pipeline not found' }, { status: 404 });

  const { data: member } = await supabase.from('org_members').select('role').eq('organization_id', pipeline.organization_id).eq('user_id', user.id).single();
  if (!member) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { data, error } = await supabase
    .from('automation_workflows')
    .select('*')
    .eq('pipeline_id', pipelineId)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  if (!body.pipelineId || !body.name || !body.trigger_type) {
    return NextResponse.json({ error: 'pipelineId, name, and trigger_type required' }, { status: 400 });
  }

  const { data: pipeline } = await supabase.from('pipelines').select('organization_id').eq('id', body.pipelineId).single();
  if (!pipeline) return NextResponse.json({ error: 'Pipeline not found' }, { status: 404 });

  const { data: member } = await supabase.from('org_members').select('role').eq('organization_id', pipeline.organization_id).eq('user_id', user.id).single();
  if (!member || !['owner', 'admin'].includes(member.role)) return NextResponse.json({ error: 'Admin access required' }, { status: 403 });

  const { data, error } = await supabase.from('automation_workflows').insert({
    organization_id: pipeline.organization_id,
    pipeline_id: body.pipelineId,
    name: body.name,
    description: body.description || null,
    trigger_type: body.trigger_type,
    trigger_config: (body.trigger_config || {}) as unknown as import('@/types/database').Json,
    graph_data: (body.graph_data || {}) as unknown as import('@/types/database').Json,
    created_by: user.id,
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
