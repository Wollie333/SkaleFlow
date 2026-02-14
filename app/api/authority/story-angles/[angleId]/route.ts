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

  const { data, error } = await db
    .from('authority_story_angles')
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq('id', angleId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
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
