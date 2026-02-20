import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ pipelineId: string; formId: string }> }
) {
  const { pipelineId, formId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: pipeline } = await supabase
    .from('pipelines')
    .select('organization_id')
    .eq('id', pipelineId)
    .single();
  if (!pipeline) return NextResponse.json({ error: 'Pipeline not found' }, { status: 404 });

  const { data: member } = await supabase
    .from('org_members')
    .select('role')
    .eq('organization_id', pipeline.organization_id)
    .eq('user_id', user.id)
    .single();
  if (!member) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { data: form, error } = await supabase
    .from('pipeline_forms')
    .select('*, pipeline_form_fields(*)')
    .eq('id', formId)
    .eq('pipeline_id', pipelineId)
    .single();

  if (error || !form) return NextResponse.json({ error: 'Form not found' }, { status: 404 });
  return NextResponse.json(form);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ pipelineId: string; formId: string }> }
) {
  const { pipelineId, formId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: pipeline } = await supabase
    .from('pipelines')
    .select('organization_id')
    .eq('id', pipelineId)
    .single();
  if (!pipeline) return NextResponse.json({ error: 'Pipeline not found' }, { status: 404 });

  const { data: member } = await supabase
    .from('org_members')
    .select('role')
    .eq('organization_id', pipeline.organization_id)
    .eq('user_id', user.id)
    .single();
  if (!member) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  if (!['owner', 'admin'].includes(member.role)) {
    return NextResponse.json({ error: 'Only owners and admins can edit forms' }, { status: 403 });
  }

  const body = await request.json();
  const allowedFields = ['name', 'description', 'submit_button_text', 'success_message', 'stage_id', 'is_published', 'settings'];
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const key of allowedFields) {
    if (body[key] !== undefined) updates[key] = body[key];
  }

  // Validate stage if being changed
  if (body.stage_id) {
    const { data: stage } = await supabase
      .from('pipeline_stages')
      .select('id')
      .eq('id', body.stage_id)
      .eq('pipeline_id', pipelineId)
      .single();
    if (!stage) return NextResponse.json({ error: 'Stage not found in this pipeline' }, { status: 400 });
  }

  const { data: form, error } = await supabase
    .from('pipeline_forms')
    .update(updates)
    .eq('id', formId)
    .eq('pipeline_id', pipelineId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(form);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ pipelineId: string; formId: string }> }
) {
  const { pipelineId, formId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: pipeline } = await supabase
    .from('pipelines')
    .select('organization_id')
    .eq('id', pipelineId)
    .single();
  if (!pipeline) return NextResponse.json({ error: 'Pipeline not found' }, { status: 404 });

  const { data: member } = await supabase
    .from('org_members')
    .select('role')
    .eq('organization_id', pipeline.organization_id)
    .eq('user_id', user.id)
    .single();
  if (!member) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  if (!['owner', 'admin'].includes(member.role)) {
    return NextResponse.json({ error: 'Only owners and admins can delete forms' }, { status: 403 });
  }

  const { error } = await supabase
    .from('pipeline_forms')
    .delete()
    .eq('id', formId)
    .eq('pipeline_id', pipelineId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
