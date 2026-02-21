import { NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

// PATCH — Update a custom org template
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { name, description, permissions } = await request.json();

    const { data: membership } = await supabase
      .from('org_members')
      .select('organization_id, role')
      .eq('user_id', user.id)
      .single();

    if (!membership || !['owner', 'admin'].includes(membership.role)) {
      return NextResponse.json({ error: 'Only owners and admins can update templates' }, { status: 403 });
    }

    const serviceClient = createServiceClient();

    // Verify template belongs to org and is not system
    const { data: existing } = await serviceClient
      .from('permission_templates')
      .select('id, is_system, organization_id')
      .eq('id', id)
      .single();

    if (!existing) return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    if (existing.is_system) return NextResponse.json({ error: 'Cannot modify system templates' }, { status: 403 });
    if (existing.organization_id !== membership.organization_id) {
      return NextResponse.json({ error: 'Template not in your organization' }, { status: 403 });
    }

    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (permissions !== undefined) updateData.permissions = permissions;

    const { error } = await serviceClient
      .from('permission_templates')
      .update(updateData)
      .eq('id', id);

    if (error) {
      console.error('Failed to update template:', error);
      return NextResponse.json({ error: 'Failed to update template' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('PATCH /api/team/permission-templates/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE — Remove a custom org template
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: membership } = await supabase
      .from('org_members')
      .select('organization_id, role')
      .eq('user_id', user.id)
      .single();

    if (!membership || !['owner', 'admin'].includes(membership.role)) {
      return NextResponse.json({ error: 'Only owners and admins can delete templates' }, { status: 403 });
    }

    const serviceClient = createServiceClient();

    const { data: existing } = await serviceClient
      .from('permission_templates')
      .select('id, is_system, organization_id')
      .eq('id', id)
      .single();

    if (!existing) return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    if (existing.is_system) return NextResponse.json({ error: 'Cannot delete system templates' }, { status: 403 });
    if (existing.organization_id !== membership.organization_id) {
      return NextResponse.json({ error: 'Template not in your organization' }, { status: 403 });
    }

    const { error } = await serviceClient
      .from('permission_templates')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Failed to delete template:', error);
      return NextResponse.json({ error: 'Failed to delete template' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/team/permission-templates/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
