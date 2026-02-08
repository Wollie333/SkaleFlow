import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

async function verifyPipelineAccess(supabase: ReturnType<typeof createClient>, pipelineId: string, userId: string, requireAdmin = false) {
  const { data: pipeline } = await supabase.from('pipelines').select('organization_id').eq('id', pipelineId).single();
  if (!pipeline) return { error: 'Pipeline not found', status: 404 };

  const { data: member } = await supabase.from('org_members').select('role').eq('organization_id', pipeline.organization_id).eq('user_id', userId).single();
  if (!member) return { error: 'Forbidden', status: 403 };
  if (requireAdmin && !['owner', 'admin'].includes(member.role)) return { error: 'Admin access required', status: 403 };

  return { pipeline, member };
}

export async function GET(request: NextRequest, { params }: { params: { pipelineId: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const access = await verifyPipelineAccess(supabase, params.pipelineId, user.id);
  if ('error' in access) return NextResponse.json({ error: access.error }, { status: access.status });

  const { data, error } = await supabase
    .from('pipeline_stages')
    .select('*')
    .eq('pipeline_id', params.pipelineId)
    .order('sort_order', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: NextRequest, { params }: { params: { pipelineId: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const access = await verifyPipelineAccess(supabase, params.pipelineId, user.id, true);
  if ('error' in access) return NextResponse.json({ error: access.error }, { status: access.status });

  const body = await request.json();
  const { data, error } = await supabase
    .from('pipeline_stages')
    .insert({
      pipeline_id: params.pipelineId,
      name: body.name,
      color: body.color || '#6B7280',
      sort_order: body.sort_order ?? 0,
      is_win_stage: body.is_win_stage || false,
      is_loss_stage: body.is_loss_stage || false,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

export async function PATCH(request: NextRequest, { params }: { params: { pipelineId: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const access = await verifyPipelineAccess(supabase, params.pipelineId, user.id, true);
  if ('error' in access) return NextResponse.json({ error: access.error }, { status: access.status });

  const body = await request.json();

  // Handle bulk reorder
  if (body.stages && Array.isArray(body.stages)) {
    for (const stage of body.stages) {
      await supabase.from('pipeline_stages').update({ sort_order: stage.sort_order, name: stage.name, color: stage.color }).eq('id', stage.id);
    }
    const { data } = await supabase.from('pipeline_stages').select('*').eq('pipeline_id', params.pipelineId).order('sort_order');
    return NextResponse.json(data);
  }

  // Single stage update
  if (!body.id) return NextResponse.json({ error: 'stage id required' }, { status: 400 });
  const { data, error } = await supabase.from('pipeline_stages').update({
    name: body.name,
    color: body.color,
    sort_order: body.sort_order,
    is_win_stage: body.is_win_stage,
    is_loss_stage: body.is_loss_stage,
  }).eq('id', body.id).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(request: NextRequest, { params }: { params: { pipelineId: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const access = await verifyPipelineAccess(supabase, params.pipelineId, user.id, true);
  if ('error' in access) return NextResponse.json({ error: access.error }, { status: access.status });

  const { searchParams } = new URL(request.url);
  const stageId = searchParams.get('stageId');
  if (!stageId) return NextResponse.json({ error: 'stageId required' }, { status: 400 });

  // Check if stage has contacts
  const { count } = await supabase.from('pipeline_contacts').select('*', { count: 'exact', head: true }).eq('stage_id', stageId);
  if (count && count > 0) return NextResponse.json({ error: 'Cannot delete stage with contacts. Move contacts first.' }, { status: 400 });

  const { error } = await supabase.from('pipeline_stages').delete().eq('id', stageId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
