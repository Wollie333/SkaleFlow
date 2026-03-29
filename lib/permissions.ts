import { createServiceClient } from '@/lib/supabase/server';
import type { FeatureType, OrgMemberRole, Json } from '@/types/database';

export interface FeaturePermissions {
  access?: boolean;
  // Brand Engine
  chat?: boolean;
  edit_variables?: boolean;
  // Content Engine
  create?: boolean;
  edit?: boolean;
  edit_others?: boolean;          // Can edit others' posts
  delete?: boolean;               // Can delete posts
  upload_media?: boolean;         // Can upload media
  request_approval?: boolean;     // Can send for review
  approve?: boolean;              // Can approve posts
  reject?: boolean;               // Can reject posts
  request_revision?: boolean;     // Can request revisions
  schedule?: boolean;
  change_schedule?: boolean;      // Can change schedules
  publish?: boolean;
  comment?: boolean;              // Can comment
  mention?: boolean;              // Can @mention
  view_analytics?: boolean;       // Can view analytics
  view_revisions?: boolean;       // Can view revision history
  revert?: boolean;               // Can revert to previous versions
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
        permissions: permissions as unknown as Json,
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

// =====================================================
// WORKSPACE PERMISSION FUNCTIONS
// =====================================================

export interface Workspace {
  id: string;
  organization_id: string;
  name: string;
  slug: string;
  description?: string;
  logo_url?: string;
  color: string;
  is_default: boolean;
  brand_engine_status?: string;
  content_engine_enabled?: boolean;
  created_at: string;
  updated_at: string;
}

export type WorkspaceRole = 'admin' | 'member' | 'viewer';

/**
 * Get the workspace role for a user in a specific workspace.
 */
export async function getWorkspaceRole(
  workspaceId: string,
  userId: string
): Promise<WorkspaceRole | null> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', workspaceId)
    .eq('user_id', userId)
    .single();
  return (data?.role as WorkspaceRole) || null;
}

/**
 * Check if user is workspace admin.
 */
export async function isWorkspaceAdmin(
  workspaceId: string,
  userId: string
): Promise<boolean> {
  const role = await getWorkspaceRole(workspaceId, userId);
  return role === 'admin';
}

/**
 * Check if user has access to a workspace.
 */
export async function hasWorkspaceAccess(
  workspaceId: string,
  userId: string
): Promise<boolean> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from('workspace_members')
    .select('id')
    .eq('workspace_id', workspaceId)
    .eq('user_id', userId)
    .single();
  return !!data;
}

/**
 * Get all workspaces a user has access to in an organization.
 * Org admins see all workspaces, members see only assigned workspaces.
 */
export async function getUserWorkspaces(
  orgId: string,
  userId: string
): Promise<Workspace[]> {
  const supabase = createServiceClient();

  // Check if user is org owner/admin (can see all)
  const isOrgAdmin = await isOrgOwnerOrAdmin(orgId, userId);

  if (isOrgAdmin) {
    const { data } = await supabase
      .from('workspaces')
      .select('*')
      .eq('organization_id', orgId)
      .order('is_default', { ascending: false })
      .order('name');
    return (data || []) as Workspace[];
  }

  // Regular users see only their assigned workspaces
  const { data } = await supabase
    .from('workspace_members')
    .select(`
      workspace:workspaces(
        id,
        organization_id,
        name,
        slug,
        description,
        logo_url,
        color,
        is_default,
        brand_engine_status,
        content_engine_enabled,
        created_at,
        updated_at
      )
    `)
    .eq('user_id', userId)
    .eq('organization_id', orgId);

  if (!data) return [];

  // Extract workspaces from the nested structure
  const workspaces = data
    .map(item => (item as any).workspace)
    .filter(Boolean);

  // Sort: default first, then by name
  return workspaces.sort((a: any, b: any) => {
    if (a.is_default && !b.is_default) return -1;
    if (!a.is_default && b.is_default) return 1;
    return a.name.localeCompare(b.name);
  });
}

/**
 * Check if user has access to a specific feature within a workspace.
 * Workspace admin always has access.
 */
export async function hasFeatureAccessInWorkspace(
  workspaceId: string,
  userId: string,
  feature: FeatureType
): Promise<boolean> {
  // Workspace admin always has access
  if (await isWorkspaceAdmin(workspaceId, userId)) {
    return true;
  }

  // Get workspace to check org-level permissions
  const supabase = createServiceClient();
  const { data: workspace } = await supabase
    .from('workspaces')
    .select('organization_id')
    .eq('id', workspaceId)
    .single();

  if (!workspace) return false;

  // Org owner/admin has access
  if (await isOrgOwnerOrAdmin(workspace.organization_id, userId)) {
    return true;
  }

  // Check workspace-specific team permissions
  const { data } = await supabase
    .from('team_permissions')
    .select('permissions')
    .eq('workspace_id', workspaceId)
    .eq('user_id', userId)
    .eq('feature', feature)
    .single();

  if (!data) return false;
  const perms = (data.permissions || {}) as FeaturePermissions;
  return perms.access === true;
}

/**
 * Get the workspace limit for a user.
 * Checks user-specific limit first, then org default, then returns 3.
 */
export async function getWorkspaceLimit(
  orgId: string,
  userId: string
): Promise<number> {
  const supabase = createServiceClient();

  // Check user-specific limit
  const { data: userLimit } = await supabase
    .from('workspace_limits')
    .select('max_workspaces')
    .eq('organization_id', orgId)
    .eq('user_id', userId)
    .single();

  if (userLimit) return userLimit.max_workspaces;

  // Fall back to org default
  const { data: orgLimit } = await supabase
    .from('workspace_limits')
    .select('max_workspaces')
    .eq('organization_id', orgId)
    .is('user_id', null)
    .single();

  return orgLimit?.max_workspaces || 3; // Default to 3
}

/**
 * Check if user can create a new workspace.
 * Returns { allowed: boolean, reason?: string }
 */
export async function canCreateWorkspace(
  orgId: string,
  userId: string
): Promise<{ allowed: boolean; reason?: string }> {
  const supabase = createServiceClient();

  // Only org owner/admin can create workspaces
  if (!(await isOrgOwnerOrAdmin(orgId, userId))) {
    return {
      allowed: false,
      reason: 'Only organization owners and admins can create workspaces.',
    };
  }

  // Check current workspace count
  const { count } = await supabase
    .from('workspaces')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', orgId);

  // Get user's limit
  const limit = await getWorkspaceLimit(orgId, userId);

  if ((count || 0) >= limit) {
    return {
      allowed: false,
      reason: `Workspace limit reached (${limit}). Contact admin to increase your limit.`,
    };
  }

  return { allowed: true };
}

/**
 * Check if user can approve content in a workspace
 */
export async function canApproveContent(
  workspaceId: string,
  userId: string
): Promise<boolean> {
  if (await isWorkspaceAdmin(workspaceId, userId)) {
    return true;
  }

  const supabase = createServiceClient();
  const { data: workspace } = await supabase
    .from('workspaces')
    .select('organization_id')
    .eq('id', workspaceId)
    .single();

  if (!workspace) return false;

  if (await isOrgOwnerOrAdmin(workspace.organization_id, userId)) {
    return true;
  }

  const { data } = await supabase
    .from('team_permissions')
    .select('permissions')
    .eq('workspace_id', workspaceId)
    .eq('user_id', userId)
    .eq('feature', 'content_engine')
    .single();

  if (!data) return false;
  const perms = data.permissions as FeaturePermissions;
  return perms.access === true && perms.approve === true;
}

/**
 * Check if user can edit a specific post
 */
export async function canEditPost(
  workspaceId: string,
  userId: string,
  postOwnerId: string
): Promise<boolean> {
  const isOwner = userId === postOwnerId;

  if (await isWorkspaceAdmin(workspaceId, userId)) {
    return true;
  }

  const supabase = createServiceClient();
  const { data: workspace } = await supabase
    .from('workspaces')
    .select('organization_id')
    .eq('id', workspaceId)
    .single();

  if (!workspace) return false;

  if (await isOrgOwnerOrAdmin(workspace.organization_id, userId)) {
    return true;
  }

  const { data } = await supabase
    .from('team_permissions')
    .select('permissions')
    .eq('workspace_id', workspaceId)
    .eq('user_id', userId)
    .eq('feature', 'content_engine')
    .single();

  if (!data) return false;
  const perms = data.permissions as FeaturePermissions;

  if (isOwner && perms.edit) return true;
  if (perms.edit_others) return true;

  return false;
}

/**
 * Check if user can revert post revisions
 */
export async function canRevertPost(
  workspaceId: string,
  userId: string
): Promise<boolean> {
  if (await isWorkspaceAdmin(workspaceId, userId)) {
    return true;
  }

  const supabase = createServiceClient();
  const { data: workspace } = await supabase
    .from('workspaces')
    .select('organization_id')
    .eq('id', workspaceId)
    .single();

  if (!workspace) return false;

  if (await isOrgOwnerOrAdmin(workspace.organization_id, userId)) {
    return true;
  }

  const { data } = await supabase
    .from('team_permissions')
    .select('permissions')
    .eq('workspace_id', workspaceId)
    .eq('user_id', userId)
    .eq('feature', 'content_engine')
    .single();

  if (!data) return false;
  const perms = data.permissions as FeaturePermissions;
  return perms.access === true && perms.revert === true;
}

/**
 * Get content permissions for a user in a workspace
 */
export async function getContentPermissions(
  workspaceId: string,
  userId: string
): Promise<FeaturePermissions> {
  if (await isWorkspaceAdmin(workspaceId, userId)) {
    return {
      access: true,
      create: true,
      edit: true,
      edit_others: true,
      delete: true,
      upload_media: true,
      request_approval: true,
      approve: true,
      reject: true,
      request_revision: true,
      schedule: true,
      change_schedule: true,
      publish: true,
      comment: true,
      mention: true,
      view_analytics: true,
      view_revisions: true,
      revert: true,
    };
  }

  const supabase = createServiceClient();
  const { data: workspace } = await supabase
    .from('workspaces')
    .select('organization_id')
    .eq('id', workspaceId)
    .single();

  if (!workspace) return { access: false };

  if (await isOrgOwnerOrAdmin(workspace.organization_id, userId)) {
    return {
      access: true,
      create: true,
      edit: true,
      edit_others: true,
      delete: true,
      upload_media: true,
      request_approval: true,
      approve: true,
      reject: true,
      request_revision: true,
      schedule: true,
      change_schedule: true,
      publish: true,
      comment: true,
      mention: true,
      view_analytics: true,
      view_revisions: true,
      revert: true,
    };
  }

  const { data } = await supabase
    .from('team_permissions')
    .select('permissions')
    .eq('workspace_id', workspaceId)
    .eq('user_id', userId)
    .eq('feature', 'content_engine')
    .single();

  if (!data) return { access: false };
  return (data.permissions || {}) as FeaturePermissions;
}
