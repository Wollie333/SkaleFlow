import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sanitizeSearch } from '@/lib/sanitize-search';
import type { Json } from '@/types/database';

export async function GET(request: NextRequest, { params }: { params: Promise<{ pipelineId: string }> }) {
  const { pipelineId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: pipeline } = await supabase.from('pipelines').select('organization_id').eq('id', pipelineId).single();
  if (!pipeline) return NextResponse.json({ error: 'Pipeline not found' }, { status: 404 });

  const { data: member } = await supabase.from('org_members').select('role').eq('organization_id', pipeline.organization_id).eq('user_id', user.id).single();
  if (!member) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const stageId = searchParams.get('stageId');
  const search = searchParams.get('search');

  let query = supabase
    .from('pipeline_contacts')
    .select('*, pipeline_contact_tags(tag_id, pipeline_tags(id, name, color))')
    .eq('pipeline_id', pipelineId)
    .order('created_at', { ascending: false });

  if (stageId) query = query.eq('stage_id', stageId);
  if (search) { const s = sanitizeSearch(search); query = query.or(`full_name.ilike.%${s}%,email.ilike.%${s}%,company.ilike.%${s}%`); }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ pipelineId: string }> }) {
  const { pipelineId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: pipeline } = await supabase.from('pipelines').select('organization_id').eq('id', pipelineId).single();
  if (!pipeline) return NextResponse.json({ error: 'Pipeline not found' }, { status: 404 });

  const { data: member } = await supabase.from('org_members').select('role').eq('organization_id', pipeline.organization_id).eq('user_id', user.id).single();
  if (!member) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await request.json();
  if (!body.full_name || !body.stage_id) return NextResponse.json({ error: 'full_name and stage_id required' }, { status: 400 });

  const { data: contact, error } = await supabase
    .from('pipeline_contacts')
    .insert({
      organization_id: pipeline.organization_id,
      pipeline_id: pipelineId,
      stage_id: body.stage_id,
      full_name: body.full_name,
      email: body.email || null,
      phone: body.phone || null,
      company: body.company || null,
      value_cents: body.value_cents || 0,
      currency: body.currency || 'ZAR',
      assigned_to: body.assigned_to || null,
      custom_fields: (body.custom_fields || {}) as unknown as Json,
      notes: body.notes || null,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Log activity
  await supabase.from('pipeline_activity').insert({
    contact_id: contact.id,
    organization_id: pipeline.organization_id,
    event_type: 'contact_created',
    to_stage_id: body.stage_id,
    performed_by: user.id,
    metadata: {} as unknown as Json,
  });

  // Emit automation event (fire and forget)
  try {
    const { emitPipelineEvent } = await import('@/lib/automations/events');
    await emitPipelineEvent({
      type: 'contact_created',
      contactId: contact.id,
      organizationId: pipeline.organization_id,
      pipelineId: pipelineId,
      performedBy: user.id,
      data: {},
    });
  } catch (err) {
    console.error('Failed to emit contact_created event:', err);
  }

  return NextResponse.json(contact, { status: 201 });
}
