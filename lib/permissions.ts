import { createServiceClient } from '@/lib/supabase/server';
import type { FeatureType, OrgMemberRole } from '@/types/database';

export interface FeaturePermissions {
  access?: boolean;
  // Brand Engine
  chat?: boolean;
  edit_variables?: boolean;
  // Content Engine
  create?: boolean;
  edit?: boolean;
  schedule?: boolean;
  publish?: boolean;
  // Pipeline
  manage_contacts?: boolean;
  send_emails?: boolean;
}

/**
 * Get the org role for a user in a specific organization.
 */
export async function getOrgRole(
  orgId: string,
  userId: string
): Promise<OrgMemberRole | null> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from('org_members')
    .select('role')
    .eq('organization_id', orgId)
    .eq('user_id', userId)
    .single();
  return (data?.role as OrgMemberRole) || null;
}

/**
 * Check if user is org owner or admin.
 */
export async function isOrgOwnerOrAdmin(
  orgId: string,
  userId: string
): Promise<boolean> {
  const role = await getOrgRole(orgId, userId);
  return role === 'owner' || role === 'admin';
}

/**
 * Get all team permissions for a user across all features.
 */
export async function getTeamPermissions(
  orgId: string,
  userId: string
): Promise<Record<string, FeaturePermissions>> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from('team_permissions')
    .select('feature, permissions')
    .eq('organization_id', orgId)
    .eq('user_id', userId);

  const result: Record<string, FeaturePermissions> = {};
  if (data) {
    for (const row of data) {
      result[row.feature] = (row.permissions || {}) as FeaturePermissions;
    }
  }
  return result;
}

/**
 * Check if a user has access to a specific feature.
 * Owner/admin always have full access.
 * Members/viewers require explicit team_permissions rows.
 */
export async function hasFeatureAccess(
  orgId: string,
  userId: string,
  feature: FeatureType
): Promise<boolean> {
  // Owner/admin always have full access
  if (await isOrgOwnerOrAdmin(orgId, userId)) {
    return true;
  }

  const supabase = createServiceClient();
  const { data } = await supabase
    .from('team_permissions')
    .select('permissions')
    .eq('organization_id', orgId)
    .eq('user_id', userId)
    .eq('feature', feature)
    .single();

  if (!data) return false;
  const perms = (data.permissions || {}) as FeaturePermissions;
  return perms.access === true;
}

/**
 * Check a specific permission for a user on a feature.
 */
export async function hasPermission(
  orgId: string,
  userId: string,
  feature: FeatureType,
  permission: keyof FeaturePermissions
): Promise<boolean> {
  if (await isOrgOwnerOrAdmin(orgId, userId)) {
    return true;
  }

  const supabase = createServiceClient();
  const { data } = await supabase
    .from('team_permissions')
    .select('permissions')
    .eq('organization_id', orgId)
    .eq('user_id', userId)
    .eq('feature', feature)
    .single();

  if (!data) return false;
  const perms = (data.permissions || {}) as FeaturePermissions;
  return perms.access === true && perms[permission] === true;
}

/**
 * Set permissions for a team member on a specific feature.
 */
export async function setTeamPermissions(
  orgId: string,
  userId: string,
  feature: FeatureType,
  permissions: FeaturePermissions
): Promise<void> {
  const supabase = createServiceClient();
  await supabase
    .from('team_permissions')
    .upsert(
      {
        organization_id: orgId,
        user_id: userId,
        feature,
        permissions: permissions as Record<string, unknown>,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'organization_id,user_id,feature' }
    );
}

/**
 * Get list of features a user can access.
 */
export async function getAccessibleFeatures(
  orgId: string,
  userId: string
): Promise<FeatureType[]> {
  if (await isOrgOwnerOrAdmin(orgId, userId)) {
    return ['brand_engine', 'content_engine', 'pipeline', 'ad_campaigns'];
  }

  const supabase = createServiceClient();
  const { data } = await supabase
    .from('team_permissions')
    .select('feature, permissions')
    .eq('organization_id', orgId)
    .eq('user_id', userId);

  if (!data) return [];
  return data
    .filter(row => {
      const perms = (row.permissions || {}) as FeaturePermissions;
      return perms.access === true;
    })
    .map(row => row.feature as FeatureType);
}
