import { NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

export async function POST() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check org membership (must be owner or admin)
  const { data: membership } = await supabase
    .from('org_members')
    .select('organization_id, role')
    .eq('user_id', user.id)
    .single();

  if (!membership || !['owner', 'admin'].includes(membership.role)) {
    return NextResponse.json({ error: 'Only org owners and admins can disconnect Canva' }, { status: 403 });
  }

  const serviceClient = createServiceClient();
  const { error } = await serviceClient
    .from('canva_connections')
    .delete()
    .eq('organization_id', membership.organization_id);

  if (error) {
    console.error('[canva-disconnect] Failed to delete connection:', error);
    return NextResponse.json({ error: 'Failed to disconnect' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
