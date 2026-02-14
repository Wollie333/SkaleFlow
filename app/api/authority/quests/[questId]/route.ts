import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { checkAuthorityAccess } from '@/lib/authority/auth';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ questId: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { questId } = await params;
  const body = await request.json();

  // Use service client for initial lookup to get organization_id (RLS-safe for super_admin)
  const svc = createServiceClient();
  const { data: quest } = await svc
    .from('authority_quests')
    .select('organization_id')
    .eq('id', questId)
    .single();
  if (!quest) return NextResponse.json({ error: 'Quest not found' }, { status: 404 });

  // Verify admin/owner (super_admin bypass)
  const access = await checkAuthorityAccess(supabase, user.id, quest.organization_id);
  if (!access.authorized || !['owner', 'admin'].includes(access.role!)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const db = access.queryClient;

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (body.target_completion_date !== undefined) updates.target_completion_date = body.target_completion_date;
  if (body.is_current !== undefined) updates.is_current = body.is_current;

  const { data, error } = await db
    .from('authority_quests')
    .update(updates)
    .eq('id', questId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
