import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { Json } from '@/types/database';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  const { data: audience, error } = await supabase
    .from('ad_audiences')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !audience) return NextResponse.json({ error: 'Audience not found' }, { status: 404 });

  // Verify membership
  const { data: member } = await supabase
    .from('org_members')
    .select('role')
    .eq('organization_id', audience.organization_id)
    .eq('user_id', user.id)
    .single();

  if (!member) return NextResponse.json({ error: 'Not a member of this organization' }, { status: 403 });

  return NextResponse.json(audience);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  const { data: audience } = await supabase
    .from('ad_audiences')
    .select('id, organization_id')
    .eq('id', id)
    .single();

  if (!audience) return NextResponse.json({ error: 'Audience not found' }, { status: 404 });

  // Verify admin/owner
  const { data: member } = await supabase
    .from('org_members')
    .select('role')
    .eq('organization_id', audience.organization_id)
    .eq('user_id', user.id)
    .single();

  if (!member || !['owner', 'admin'].includes(member.role)) {
    return NextResponse.json({ error: 'Only owners and admins can update audiences' }, { status: 403 });
  }

  const body = await request.json();
  const updateData: Record<string, any> = { updated_at: new Date().toISOString() };

  if (body.name !== undefined) updateData.name = body.name;
  if (body.description !== undefined) updateData.description = body.description;
  if (body.audienceType !== undefined) updateData.audience_type = body.audienceType;
  if (body.audience_type !== undefined) updateData.audience_type = body.audience_type;
  if (body.targetingSpec !== undefined) updateData.targeting_spec = body.targetingSpec as unknown as Json;
  if (body.targeting_spec !== undefined) updateData.targeting_spec = body.targeting_spec as unknown as Json;
  if (body.sourcePipelineId !== undefined) updateData.source_pipeline_id = body.sourcePipelineId;
  if (body.source_pipeline_id !== undefined) updateData.source_pipeline_id = body.source_pipeline_id;
  if (body.sourceStageIds !== undefined) updateData.source_stage_ids = body.sourceStageIds;
  if (body.source_stage_ids !== undefined) updateData.source_stage_ids = body.source_stage_ids;
  if (body.sourceTagIds !== undefined) updateData.source_tag_ids = body.sourceTagIds;
  if (body.source_tag_ids !== undefined) updateData.source_tag_ids = body.source_tag_ids;

  const { data: updated, error } = await supabase
    .from('ad_audiences')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(updated);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  const { data: audience } = await supabase
    .from('ad_audiences')
    .select('id, organization_id')
    .eq('id', id)
    .single();

  if (!audience) return NextResponse.json({ error: 'Audience not found' }, { status: 404 });

  // Verify admin/owner
  const { data: member } = await supabase
    .from('org_members')
    .select('role')
    .eq('organization_id', audience.organization_id)
    .eq('user_id', user.id)
    .single();

  if (!member || !['owner', 'admin'].includes(member.role)) {
    return NextResponse.json({ error: 'Only owners and admins can delete audiences' }, { status: 403 });
  }

  const { error } = await supabase
    .from('ad_audiences')
    .delete()
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
