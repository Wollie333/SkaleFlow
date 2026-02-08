import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { disconnectAdAccount } from '@/lib/marketing/auth';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = params;

  // Get the ad account to find its org
  const { data: account, error: fetchError } = await supabase
    .from('ad_accounts')
    .select('id, organization_id')
    .eq('id', id)
    .single();

  if (fetchError || !account) {
    return NextResponse.json({ error: 'Ad account not found' }, { status: 404 });
  }

  // Verify user is owner or admin of the org
  const { data: member } = await supabase
    .from('org_members')
    .select('role')
    .eq('organization_id', account.organization_id)
    .eq('user_id', user.id)
    .single();

  if (!member || !['owner', 'admin'].includes(member.role)) {
    return NextResponse.json({ error: 'Only owners and admins can disconnect ad accounts' }, { status: 403 });
  }

  try {
    await disconnectAdAccount(id);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Failed to disconnect ad account:', err);
    return NextResponse.json({ error: 'Failed to disconnect ad account' }, { status: 500 });
  }
}
