import { NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { isOrgOwnerOrAdmin, setTeamPermissions } from '@/lib/permissions';
import { logTeamActivity } from '@/lib/team-activity';
import type { FeatureType } from '@/types/database';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { roleId, userIds, workspaceId } = await request.json();
    if (!roleId || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json({ error: 'roleId and userIds are required' }, { status: 400 });
    }

    const { data: membership } = await supabase
      .from('org_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .single();

    if (!membership) return NextResponse.json({ error: 'No organization' }, { status: 404 });
    const orgId = membership.organization_id;

    if (!await isOrgOwnerOrAdmin(orgId, user.id)) {
      return NextResponse.json({ error: 'Only owners and admins can apply roles' }, { status: 403 });
    }

    // Fetch role
    const serviceClient = createServiceClient();
    const { data: role } = await serviceClient
      .from('team_roles')
      .select('id, name, permissions')
      .eq('id', roleId)
      .single();

    if (!role) return NextResponse.json({ error: 'Role not found' }, { status: 404 });

    const permissions = role.permissions as Record<string, Record<string, boolean>>;
    const features = Object.keys(permissions) as FeatureType[];

    // Apply to each user
    for (const userId of userIds) {
      // Apply permissions
      for (const feature of features) {
        await setTeamPermissions(orgId, userId, feature, permissions[feature]);
      }

      // Create role assignment record for audit trail
      await serviceClient
        .from('team_role_assignments')
        .insert({
          user_id: userId,
          workspace_id: workspaceId || null,
          organization_id: orgId,
          role_id: role.id,
          applied_by: user.id,
          permissions_snapshot: permissions,
        });

      // Log activity
      logTeamActivity(orgId, user.id, 'permission_updated', userId, {
        roleId: role.id,
        roleName: role.name,
      }).catch(() => {});
    }

    return NextResponse.json({ success: true, applied: userIds.length });
  } catch (error) {
    console.error('POST /api/team/roles/apply error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
