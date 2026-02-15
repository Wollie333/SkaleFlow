import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { checkAuthorityAccess } from '@/lib/authority/auth';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const organizationId = request.nextUrl.searchParams.get('organizationId');
  if (!organizationId) return NextResponse.json({ error: 'organizationId required' }, { status: 400 });

  // Verify membership (super_admin bypass)
  const access = await checkAuthorityAccess(supabase, user.id, organizationId);
  if (!access.authorized) return NextResponse.json({ error: 'Not authorized' }, { status: 403 });

  // Use service client to bypass RLS (auth already verified)
  const svc = createServiceClient();
  const { data } = await svc
    .from('authority_press_kit')
    .select('*')
    .eq('organization_id', organizationId)
    .maybeSingle();

  return NextResponse.json(data || null);
}

export async function PUT(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { organizationId, ...fields } = body;
  if (!organizationId) return NextResponse.json({ error: 'organizationId required' }, { status: 400 });

  // Verify membership (super_admin bypass)
  const access = await checkAuthorityAccess(supabase, user.id, organizationId);
  if (!access.authorized || !['owner', 'admin'].includes(access.role!)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Use service client to bypass RLS (auth already verified)
  const svc = createServiceClient();

  // Check if exists
  const { data: existing } = await svc
    .from('authority_press_kit')
    .select('id')
    .eq('organization_id', organizationId)
    .maybeSingle();

  if (existing) {
    const { data, error } = await svc
      .from('authority_press_kit')
      .update({ ...fields, updated_at: new Date().toISOString() })
      .eq('organization_id', organizationId)
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } else {
    const { data, error } = await svc
      .from('authority_press_kit')
      .insert({ organization_id: organizationId, created_by: user.id, ...fields })
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  }
}
