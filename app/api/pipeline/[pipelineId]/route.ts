import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest, { params }: { params: { pipelineId: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: pipeline, error } = await supabase
    .from('pipelines')
    .select('*, pipeline_stages(id, name, color, sort_order, is_win_stage, is_loss_stage)')
    .eq('id', params.pipelineId)
    .single();

  if (error || !pipeline) return NextResponse.json({ error: 'Pipeline not found' }, { status: 404 });

  // Verify membership
  const { data: member } = await supabase.from('org_members').select('role').eq('organization_id', pipeline.organization_id).eq('user_id', user.id).single();
  if (!member) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  return NextResponse.json(pipeline);
}

export async function PATCH(request: NextRequest, { params }: { params: { pipelineId: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();

  const { data: pipeline } = await supabase.from('pipelines').select('organization_id').eq('id', params.pipelineId).single();
  if (!pipeline) return NextResponse.json({ error: 'Pipeline not found' }, { status: 404 });

  const { data: member } = await supabase.from('org_members').select('role').eq('organization_id', pipeline.organization_id).eq('user_id', user.id).single();
  if (!member || !['owner', 'admin'].includes(member.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { data, error } = await supabase
    .from('pipelines')
    .update({ name: body.name, description: body.description, updated_at: new Date().toISOString() })
    .eq('id', params.pipelineId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(request: NextRequest, { params }: { params: { pipelineId: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: pipeline } = await supabase.from('pipelines').select('organization_id').eq('id', params.pipelineId).single();
  if (!pipeline) return NextResponse.json({ error: 'Pipeline not found' }, { status: 404 });

  const { data: member } = await supabase.from('org_members').select('role').eq('organization_id', pipeline.organization_id).eq('user_id', user.id).single();
  if (!member || !['owner', 'admin'].includes(member.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { error } = await supabase.from('pipelines').delete().eq('id', params.pipelineId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
