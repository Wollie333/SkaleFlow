import { NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

// GET — List all permission templates (system + org)
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: membership } = await supabase
      .from('org_members')
      .select('organization_id, role')
      .eq('user_id', user.id)
      .single();

    if (!membership) return NextResponse.json({ templates: [] });

    const serviceClient = createServiceClient();

    // System templates + org templates
    const { data: templates } = await serviceClient
      .from('permission_templates')
      .select('*')
      .or(`is_system.eq.true,organization_id.eq.${membership.organization_id}`)
      .order('is_system', { ascending: false })
      .order('name');

    return NextResponse.json({ templates: templates || [] });
  } catch (error) {
    console.error('GET /api/team/permission-templates error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST — Create a custom org template
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { name, description, permissions } = await request.json();
    if (!name || !permissions) {
      return NextResponse.json({ error: 'Name and permissions are required' }, { status: 400 });
    }

    const { data: membership } = await supabase
      .from('org_members')
      .select('organization_id, role')
      .eq('user_id', user.id)
      .single();

    if (!membership || !['owner', 'admin'].includes(membership.role)) {
      return NextResponse.json({ error: 'Only owners and admins can create templates' }, { status: 403 });
    }

    const serviceClient = createServiceClient();
    const { data: template, error } = await serviceClient
      .from('permission_templates')
      .insert({
        name,
        description: description || null,
        permissions,
        is_system: false,
        organization_id: membership.organization_id,
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to create template:', error);
      return NextResponse.json({ error: 'Failed to create template' }, { status: 500 });
    }

    return NextResponse.json({ template });
  } catch (error) {
    console.error('POST /api/team/permission-templates error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
