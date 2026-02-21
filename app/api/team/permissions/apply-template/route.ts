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

    const { templateId, userIds } = await request.json();
    if (!templateId || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json({ error: 'templateId and userIds are required' }, { status: 400 });
    }

    const { data: membership } = await supabase
      .from('org_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .single();

    if (!membership) return NextResponse.json({ error: 'No organization' }, { status: 404 });
    const orgId = membership.organization_id;

    if (!await isOrgOwnerOrAdmin(orgId, user.id)) {
      return NextResponse.json({ error: 'Only owners and admins can apply templates' }, { status: 403 });
    }

    // Fetch template
    const serviceClient = createServiceClient();
    const { data: template } = await serviceClient
      .from('permission_templates')
      .select('id, name, permissions')
      .eq('id', templateId)
      .single();

    if (!template) return NextResponse.json({ error: 'Template not found' }, { status: 404 });

    const permissions = template.permissions as Record<string, Record<string, boolean>>;
    const features = Object.keys(permissions) as FeatureType[];

    // Apply to each user
    for (const userId of userIds) {
      for (const feature of features) {
        await setTeamPermissions(orgId, userId, feature, permissions[feature]);
      }

      logTeamActivity(orgId, user.id, 'permission_updated', userId, {
        templateId: template.id,
        templateName: template.name,
      }).catch(() => {});
    }

    return NextResponse.json({ success: true, applied: userIds.length });
  } catch (error) {
    console.error('POST /api/team/permissions/apply-template error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
