import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isOrgOwnerOrAdmin } from '@/lib/permissions';
import { getPendingChangeRequests } from '@/lib/change-requests';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || undefined;
    const feature = searchParams.get('feature') || undefined;

    const { data: membership } = await supabase
      .from('org_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .single();

    if (!membership) return NextResponse.json({ error: 'No organization' }, { status: 404 });
    const orgId = membership.organization_id;

    const isAdmin = await isOrgOwnerOrAdmin(orgId, user.id);

    const changeRequests = await getPendingChangeRequests(orgId, {
      status,
      feature,
      requestedBy: isAdmin ? undefined : user.id,
    });

    return NextResponse.json({ changeRequests });
  } catch (error) {
    console.error('GET /api/change-requests error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
