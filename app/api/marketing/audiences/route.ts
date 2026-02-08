import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { Json } from '@/types/database';

export async function GET(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const organizationId = searchParams.get('organizationId');
  if (!organizationId) return NextResponse.json({ error: 'organizationId required' }, { status: 400 });

  // Verify membership
  const { data: member } = await supabase
    .from('org_members')
    .select('role')
    .eq('organization_id', organizationId)
    .eq('user_id', user.id)
    .single();

  if (!member) return NextResponse.json({ error: 'Not a member of this organization' }, { status: 403 });

  const { data: audiences, error } = await supabase
    .from('ad_audiences')
    .select('*')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(audiences || []);
}

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const {
    organizationId,
    name,
    description,
    platform,
    audienceType,
    targetingSpec,
    sourcePipelineId,
    sourceStageIds,
    sourceTagIds,
  } = body;

  if (!organizationId || !name || !platform || !audienceType) {
    return NextResponse.json({ error: 'organizationId, name, platform, and audienceType are required' }, { status: 400 });
  }

  // Verify admin/owner
  const { data: member } = await supabase
    .from('org_members')
    .select('role')
    .eq('organization_id', organizationId)
    .eq('user_id', user.id)
    .single();

  if (!member || !['owner', 'admin'].includes(member.role)) {
    return NextResponse.json({ error: 'Only owners and admins can create audiences' }, { status: 403 });
  }

  const { data: audience, error } = await supabase
    .from('ad_audiences')
    .insert({
      organization_id: organizationId,
      name,
      description: description || null,
      platform,
      audience_type: audienceType,
      targeting_spec: (targetingSpec || {}) as unknown as Json,
      source_pipeline_id: sourcePipelineId || null,
      source_stage_ids: sourceStageIds || [],
      source_tag_ids: sourceTagIds || [],
      size: 0,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) {
    console.error('Failed to create audience:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(audience, { status: 201 });
}
