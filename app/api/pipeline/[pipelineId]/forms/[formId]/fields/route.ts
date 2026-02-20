import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { Json } from '@/types/database';

export async function PUT(
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
    return NextResponse.json({ error: 'Only owners and admins can edit form fields' }, { status: 403 });
  }

  // Verify form belongs to this pipeline
  const { data: form } = await supabase
    .from('pipeline_forms')
    .select('id')
    .eq('id', formId)
    .eq('pipeline_id', pipelineId)
    .single();
  if (!form) return NextResponse.json({ error: 'Form not found' }, { status: 404 });

  const body = await request.json();
  const fields: Array<{
    label: string;
    field_type: string;
    placeholder?: string;
    is_required?: boolean;
    options?: string[];
    mapping: string;
    sort_order: number;
  }> = body.fields;

  if (!Array.isArray(fields)) {
    return NextResponse.json({ error: 'fields array required' }, { status: 400 });
  }

  // Delete existing fields
  await supabase.from('pipeline_form_fields').delete().eq('form_id', formId);

  // Insert new fields
  if (fields.length > 0) {
    const inserts = fields.map((f, i) => ({
      form_id: formId,
      label: f.label,
      field_type: f.field_type,
      placeholder: f.placeholder || null,
      is_required: f.is_required ?? false,
      options: (f.options || null) as unknown as Json,
      mapping: f.mapping,
      sort_order: f.sort_order ?? i,
    }));

    const { error } = await supabase.from('pipeline_form_fields').insert(inserts);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Return updated fields
  const { data: updatedFields } = await supabase
    .from('pipeline_form_fields')
    .select('*')
    .eq('form_id', formId)
    .order('sort_order');

  return NextResponse.json(updatedFields);
}
