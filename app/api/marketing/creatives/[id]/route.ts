import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { Json } from '@/types/database';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = params;

  const { data: creative, error } = await supabase
    .from('ad_creatives')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !creative) return NextResponse.json({ error: 'Creative not found' }, { status: 404 });

  // Verify membership
  const { data: member } = await supabase
    .from('org_members')
    .select('role')
    .eq('organization_id', creative.organization_id)
    .eq('user_id', user.id)
    .single();

  if (!member) return NextResponse.json({ error: 'Not a member of this organization' }, { status: 403 });

  return NextResponse.json(creative);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = params;

  const { data: creative } = await supabase
    .from('ad_creatives')
    .select('id, organization_id')
    .eq('id', id)
    .single();

  if (!creative) return NextResponse.json({ error: 'Creative not found' }, { status: 404 });

  // Verify admin/owner
  const { data: member } = await supabase
    .from('org_members')
    .select('role')
    .eq('organization_id', creative.organization_id)
    .eq('user_id', user.id)
    .single();

  if (!member || !['owner', 'admin'].includes(member.role)) {
    return NextResponse.json({ error: 'Only owners and admins can update creatives' }, { status: 403 });
  }

  const body = await request.json();
  const updateData: Record<string, any> = { updated_at: new Date().toISOString() };

  if (body.name !== undefined) updateData.name = body.name;
  if (body.format !== undefined) updateData.format = body.format;
  if (body.primaryText !== undefined) updateData.primary_text = body.primaryText;
  if (body.primary_text !== undefined) updateData.primary_text = body.primary_text;
  if (body.headline !== undefined) updateData.headline = body.headline;
  if (body.description !== undefined) updateData.description = body.description;
  if (body.ctaType !== undefined) updateData.cta_type = body.ctaType;
  if (body.cta_type !== undefined) updateData.cta_type = body.cta_type;
  if (body.targetUrl !== undefined) updateData.target_url = body.targetUrl;
  if (body.target_url !== undefined) updateData.target_url = body.target_url;
  if (body.utmParameters !== undefined) updateData.utm_parameters = body.utmParameters as unknown as Json;
  if (body.utm_parameters !== undefined) updateData.utm_parameters = body.utm_parameters as unknown as Json;
  if (body.displayLink !== undefined) updateData.display_link = body.displayLink;
  if (body.display_link !== undefined) updateData.display_link = body.display_link;
  if (body.mediaUrls !== undefined) updateData.media_urls = body.mediaUrls;
  if (body.media_urls !== undefined) updateData.media_urls = body.media_urls;
  if (body.adSetId !== undefined) updateData.ad_set_id = body.adSetId;
  if (body.ad_set_id !== undefined) updateData.ad_set_id = body.ad_set_id;
  if (body.status !== undefined) updateData.status = body.status;
  if (body.scriptNotes !== undefined) updateData.script_notes = body.scriptNotes;
  if (body.script_notes !== undefined) updateData.script_notes = body.script_notes;

  const { data: updated, error } = await supabase
    .from('ad_creatives')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(updated);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = params;

  const { data: creative } = await supabase
    .from('ad_creatives')
    .select('id, organization_id')
    .eq('id', id)
    .single();

  if (!creative) return NextResponse.json({ error: 'Creative not found' }, { status: 404 });

  // Verify admin/owner
  const { data: member } = await supabase
    .from('org_members')
    .select('role')
    .eq('organization_id', creative.organization_id)
    .eq('user_id', user.id)
    .single();

  if (!member || !['owner', 'admin'].includes(member.role)) {
    return NextResponse.json({ error: 'Only owners and admins can delete creatives' }, { status: 403 });
  }

  const { error } = await supabase
    .from('ad_creatives')
    .delete()
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
