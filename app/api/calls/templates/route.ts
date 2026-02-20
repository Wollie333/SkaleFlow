import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

// GET — list templates (system + org)
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: member } = await supabase
    .from('org_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .single();

  // Get system templates + org templates
  const { data, error } = await supabase
    .from('call_templates')
    .select('*')
    .or(`is_system.eq.true,organization_id.eq.${member?.organization_id || '00000000-0000-0000-0000-000000000000'}`)
    .eq('is_active', true)
    .order('is_system', { ascending: false })
    .order('name');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// POST — create custom or system template
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();

  // Super admin can create system templates
  if (body.isSystem) {
    const sc = createServiceClient();
    const { data: userData } = await sc.from('users').select('role').eq('id', user.id).single();
    if (userData?.role !== 'super_admin') {
      return NextResponse.json({ error: 'Only super admins can create system templates' }, { status: 403 });
    }

    const { data, error } = await sc
      .from('call_templates')
      .insert({
        organization_id: null,
        is_system: true,
        name: body.name,
        description: body.description || null,
        call_type: body.callType || 'custom',
        phases: body.phases || [],
        opening_script: body.openingScript || null,
        closing_script: body.closingScript || null,
        objection_bank: body.objectionBank || [],
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data, { status: 201 });
  }

  // Normal org template creation
  const { data: member } = await supabase
    .from('org_members')
    .select('organization_id, role')
    .eq('user_id', user.id)
    .single();
  if (!member || !['owner', 'admin'].includes(member.role)) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
  }

  const { data, error } = await supabase
    .from('call_templates')
    .insert({
      organization_id: member.organization_id,
      name: body.name,
      description: body.description || null,
      call_type: body.callType || 'custom',
      phases: body.phases || [],
      opening_script: body.openingScript || null,
      closing_script: body.closingScript || null,
      objection_bank: body.objectionBank || [],
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
