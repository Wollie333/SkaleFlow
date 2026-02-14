import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const orgId = request.nextUrl.searchParams.get('organizationId');
  if (!orgId) return NextResponse.json({ error: 'organizationId required' }, { status: 400 });

  const { data } = await supabase
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

  // Verify admin/owner
  const { data: member } = await supabase
    .from('org_members')
    .select('role')
    .eq('organization_id', organizationId)
    .eq('user_id', user.id)
    .single();
  if (!member || !['owner', 'admin'].includes(member.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Check if config exists
  const { data: existing } = await supabase
    .from('authority_email_config')
    .select('id')
    .eq('organization_id', organizationId)
    .single();

  if (existing) {
    const { data, error } = await supabase
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

    const { data, error } = await supabase
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
