import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { Json } from '@/types/database';

export async function POST(request: NextRequest, { params }: { params: { pipelineId: string; contactId: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  if (!body.tag_id) return NextResponse.json({ error: 'tag_id required' }, { status: 400 });

  const { data: contact } = await supabase.from('pipeline_contacts').select('organization_id, pipeline_id').eq('id', params.contactId).single();
  if (!contact) return NextResponse.json({ error: 'Contact not found' }, { status: 404 });

  const { data: member } = await supabase.from('org_members').select('role').eq('organization_id', contact.organization_id).eq('user_id', user.id).single();
  if (!member) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { error } = await supabase.from('pipeline_contact_tags').insert({ contact_id: params.contactId, tag_id: body.tag_id });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Log activity
  await supabase.from('pipeline_activity').insert({
    contact_id: params.contactId,
    organization_id: contact.organization_id,
    event_type: 'tag_added',
    performed_by: user.id,
    metadata: { tag_id: body.tag_id } as unknown as Json,
  });

  // Emit event
  try {
    const { emitPipelineEvent } = await import('@/lib/automations/events');
    await emitPipelineEvent({
      type: 'tag_added',
      contactId: params.contactId,
      organizationId: contact.organization_id,
      pipelineId: contact.pipeline_id,
      performedBy: user.id,
      data: { tagId: body.tag_id },
    });
  } catch (err) {
    console.error('Failed to emit tag_added event:', err);
  }

  return NextResponse.json({ success: true }, { status: 201 });
}

export async function DELETE(request: NextRequest, { params }: { params: { pipelineId: string; contactId: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const tagId = searchParams.get('tagId');
  if (!tagId) return NextResponse.json({ error: 'tagId required' }, { status: 400 });

  const { data: contact } = await supabase.from('pipeline_contacts').select('organization_id, pipeline_id').eq('id', params.contactId).single();
  if (!contact) return NextResponse.json({ error: 'Contact not found' }, { status: 404 });

  const { data: member } = await supabase.from('org_members').select('role').eq('organization_id', contact.organization_id).eq('user_id', user.id).single();
  if (!member) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { error } = await supabase.from('pipeline_contact_tags').delete().eq('contact_id', params.contactId).eq('tag_id', tagId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Log activity
  await supabase.from('pipeline_activity').insert({
    contact_id: params.contactId,
    organization_id: contact.organization_id,
    event_type: 'tag_removed',
    performed_by: user.id,
    metadata: { tag_id: tagId } as unknown as Json,
  });

  // Emit event
  try {
    const { emitPipelineEvent } = await import('@/lib/automations/events');
    await emitPipelineEvent({
      type: 'tag_removed',
      contactId: params.contactId,
      organizationId: contact.organization_id,
      pipelineId: contact.pipeline_id,
      performedBy: user.id,
      data: { tagId },
    });
  } catch (err) {
    console.error('Failed to emit tag_removed event:', err);
  }

  return NextResponse.json({ success: true });
}
