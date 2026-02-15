import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { checkAuthorityAccess } from '@/lib/authority/auth';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ angleId: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { angleId } = await params;
  const body = await request.json();

  // Look up organization_id from the record (service client to avoid RLS issues)
  const svc = createServiceClient();
  const { data: record } = await svc.from('authority_story_angles').select('organization_id').eq('id', angleId).single();
  if (!record) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const access = await checkAuthorityAccess(supabase, user.id, record.organization_id);
  if (!access.authorized) return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  const db = access.queryClient;

  // Map client field names to DB column names (accept both old and new names)
  const updateFields: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (body.title !== undefined) updateFields.title = body.title;
  if (body.description !== undefined) updateFields.description = body.description;
  // target_outlets (client) -> suggested_outlets (DB)
  if (body.suggested_outlets !== undefined) updateFields.suggested_outlets = body.suggested_outlets;
  if (body.target_outlets !== undefined) updateFields.suggested_outlets = body.target_outlets;
  // recommended_format (client) -> category (DB)
  if (body.category !== undefined) updateFields.category = body.category;
  if (body.recommended_format !== undefined) updateFields.category = body.recommended_format;
  if (body.target_audience !== undefined) updateFields.target_audience = body.target_audience;
  if (body.is_active !== undefined) updateFields.is_active = body.is_active;

  const { data, error } = await db
    .from('authority_story_angles')
    .update(updateFields)
    .eq('id', angleId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Map back for client
  const mapped = {
    ...data,
    target_outlets: (data as Record<string, unknown>).suggested_outlets ?? null,
    recommended_format: (data as Record<string, unknown>).category ?? null,
  };
  return NextResponse.json(mapped);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ angleId: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { angleId } = await params;

  // Look up organization_id from the record (service client to avoid RLS issues)
  const svc = createServiceClient();
  const { data: record } = await svc.from('authority_story_angles').select('organization_id').eq('id', angleId).single();
  if (!record) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const access = await checkAuthorityAccess(supabase, user.id, record.organization_id);
  if (!access.authorized) return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  const db = access.queryClient;

  const { error } = await db
    .from('authority_story_angles')
    .delete()
    .eq('id', angleId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
