import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import crypto from 'crypto';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ pipelineId: string }> }
) {
  const { pipelineId } = await params;
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

  const { data: forms, error } = await supabase
    .from('pipeline_forms')
    .select('*, pipeline_form_fields(*)')
    .eq('pipeline_id', pipelineId)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(forms);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ pipelineId: string }> }
) {
  const { pipelineId } = await params;
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
    return NextResponse.json({ error: 'Only owners and admins can create forms' }, { status: 403 });
  }

  // Enforce max 2 forms per pipeline
  const { count } = await supabase
    .from('pipeline_forms')
    .select('id', { count: 'exact', head: true })
    .eq('pipeline_id', pipelineId);

  if ((count ?? 0) >= 2) {
    return NextResponse.json({ error: 'Maximum 2 forms per pipeline' }, { status: 400 });
  }

  const body = await request.json();
  if (!body.name || !body.stage_id) {
    return NextResponse.json({ error: 'name and stage_id required' }, { status: 400 });
  }

  // Validate stage belongs to pipeline
  const { data: stage } = await supabase
    .from('pipeline_stages')
    .select('id')
    .eq('id', body.stage_id)
    .eq('pipeline_id', pipelineId)
    .single();

  if (!stage) {
    return NextResponse.json({ error: 'Stage not found in this pipeline' }, { status: 400 });
  }

  const slug = crypto.randomUUID().slice(0, 10);

  const { data: form, error } = await supabase
    .from('pipeline_forms')
    .insert({
      organization_id: pipeline.organization_id,
      pipeline_id: pipelineId,
      stage_id: body.stage_id,
      name: body.name,
      description: body.description || null,
      submit_button_text: body.submit_button_text || 'Submit',
      success_message: body.success_message || 'Thank you! Your submission has been received.',
      slug,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(form, { status: 201 });
}
