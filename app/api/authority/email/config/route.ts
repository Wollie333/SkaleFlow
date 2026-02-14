import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkAuthorityAccess } from '@/lib/authority/auth';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const orgId = request.nextUrl.searchParams.get('organizationId');
  if (!orgId) return NextResponse.json({ error: 'organizationId required' }, { status: 400 });

  // Verify membership (super_admin bypass)
  const access = await checkAuthorityAccess(supabase, user.id, orgId);
  if (!access.authorized) return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  const db = access.queryClient;

  const { data } = await db
    .from('authority_email_config')
    .select('*')
    .eq('organization_id', orgId)
    .single();

  return NextResponse.json(data || { bcc_address: '', bcc_enabled: false });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { organizationId, bcc_enabled } = body;

  if (!organizationId) return NextResponse.json({ error: 'organizationId required' }, { status: 400 });

  // Verify admin/owner (super_admin bypass)
  const access = await checkAuthorityAccess(supabase, user.id, organizationId);
  if (!access.authorized || !['owner', 'admin'].includes(access.role!)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const db = access.queryClient;

  // Check if config exists
  const { data: existing } = await db
    .from('authority_email_config')
    .select('id')
    .eq('organization_id', organizationId)
    .single();

  if (existing) {
    const { data, error } = await db
      .from('authority_email_config')
      .update({
        bcc_enabled: bcc_enabled ?? false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } else {
    // Generate a BCC address
    const bccAddress = `authority+${organizationId.slice(0, 8)}@inbound.skaleflow.com`;

    const { data, error } = await db
      .from('authority_email_config')
      .insert({
        organization_id: organizationId,
        bcc_address: bccAddress,
        bcc_enabled: bcc_enabled ?? true,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  }
}
