import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ questId: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { questId } = await params;
  const body = await request.json();

  // Get quest
  const { data: quest } = await supabase
    .from('authority_quests')
    .select('organization_id')
    .eq('id', questId)
    .single();
  if (!quest) return NextResponse.json({ error: 'Quest not found' }, { status: 404 });

  // Verify admin/owner
  const { data: member } = await supabase
    .from('org_members')
    .select('role')
    .eq('organization_id', quest.organization_id)
    .eq('user_id', user.id)
    .single();
  if (!member || !['owner', 'admin'].includes(member.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (body.target_completion_date !== undefined) updates.target_completion_date = body.target_completion_date;
  if (body.is_current !== undefined) updates.is_current = body.is_current;

  const { data, error } = await supabase
    .from('authority_quests')
    .update(updates)
    .eq('id', questId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
