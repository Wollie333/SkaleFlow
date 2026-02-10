import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isOrgOwnerOrAdmin, setTeamPermissions, getTeamPermissions } from '@/lib/permissions';
import type { FeatureType } from '@/types/database';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    // Get user's org
    const { data: membership } = await supabase
      .from('org_members')
      .select('organization_id, role')
      .eq('user_id', user.id)
      .single();

    if (!membership) return NextResponse.json({ error: 'No organization' }, { status: 404 });
    const orgId = membership.organization_id;

    // If requesting specific user, must be owner/admin
    if (userId && userId !== user.id) {
      if (!await isOrgOwnerOrAdmin(orgId, user.id)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      const perms = await getTeamPermissions(orgId, userId);
      return NextResponse.json({ permissions: perms });
    }

    // Owner/admin can see all member permissions
    if (await isOrgOwnerOrAdmin(orgId, user.id)) {
      const { data: members } = await supabase
        .from('org_members')
        .select('user_id, role, users:user_id(full_name, email)')
        .eq('organization_id', orgId)
        .in('role', ['member', 'viewer']);

      const result = [];
      for (const member of members || []) {
        const perms = await getTeamPermissions(orgId, member.user_id);
        result.push({
          userId: member.user_id,
          role: member.role,
          user: member.users,
          permissions: perms,
        });
      }
      return NextResponse.json({ members: result });
    }

    // Regular user: get own permissions
    const perms = await getTeamPermissions(orgId, user.id);
    return NextResponse.json({ permissions: perms });
  } catch (error) {
    console.error('GET /api/team/permissions error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { userId, feature, permissions } = await request.json();
    if (!userId || !feature || !permissions) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data: membership } = await supabase
      .from('org_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .single();

    if (!membership) return NextResponse.json({ error: 'No organization' }, { status: 404 });
    const orgId = membership.organization_id;

    if (!await isOrgOwnerOrAdmin(orgId, user.id)) {
      return NextResponse.json({ error: 'Only owners and admins can manage permissions' }, { status: 403 });
    }

    await setTeamPermissions(orgId, userId, feature as FeatureType, permissions);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('PUT /api/team/permissions error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
