import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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

  const { data: accounts, error } = await supabase
    .from('ad_accounts')
    .select('id, organization_id, platform, account_name, platform_account_id, scopes, is_active, token_expires_at, connected_by, metadata, created_at, updated_at')
    .eq('organization_id', organizationId)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(accounts || []);
}
