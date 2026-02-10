import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { Json } from '@/types/database';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ pipelineId: string; contactId: string }> }) {
  const { contactId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { stage_id } = body;
  if (!stage_id) return NextResponse.json({ error: 'stage_id required' }, { status: 400 });

  const { data: contact } = await supabase.from('pipeline_contacts').select('stage_id, organization_id, pipeline_id').eq('id', contactId).single();
  if (!contact) return NextResponse.json({ error: 'Contact not found' }, { status: 404 });

  const { data: member } = await supabase.from('org_members').select('role').eq('organization_id', contact.organization_id).eq('user_id', user.id).single();
  if (!member) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const fromStageId = contact.stage_id;

  const { data, error } = await supabase
    .from('pipeline_contacts')
    .update({ stage_id, updated_at: new Date().toISOString() })
    .eq('id', contactId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Log activity
  await supabase.from('pipeline_activity').insert({
    contact_id: contactId,
    organization_id: contact.organization_id,
    event_type: 'stage_changed',
    from_stage_id: fromStageId,
    to_stage_id: stage_id,
    performed_by: user.id,
    metadata: {} as unknown as Json,
  });

  // Emit automation event
  try {
    const { emitPipelineEvent } = await import('@/lib/automations/events');
    await emitPipelineEvent({
      type: 'stage_changed',
      contactId: contactId,
      organizationId: contact.organization_id,
      pipelineId: contact.pipeline_id,
      performedBy: user.id,
      data: { fromStageId, toStageId: stage_id },
    });
  } catch (err) {
    console.error('Failed to emit stage_changed event:', err);
  }

  return NextResponse.json(data);
}
