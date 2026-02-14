import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
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

  // Lazy-seed stages on first access
  const serviceClient = createServiceClient();
  await serviceClient.rpc('seed_authority_stages', { p_org_id: organizationId });

  // Fetch stages
  const { data: stages, error } = await supabase
    .from('authority_pipeline_stages')
    .select('*')
    .eq('organization_id', organizationId)
    .order('stage_order', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(stages || []);
}
