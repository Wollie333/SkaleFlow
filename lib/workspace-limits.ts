import { createServiceClient } from '@/lib/supabase/server';
import { isOrgOwnerOrAdmin } from '@/lib/permissions';

export interface WorkspaceLimitInfo {
  current: number;
  limit: number;
  canCreate: boolean;
  reason?: string;
}

/**
 * Get workspace usage information for an organization.
 * Returns current workspace count and limit.
 */
export async function getWorkspaceUsage(orgId: string): Promise<{
  current: number;
  limit: number;
}> {
  const supabase = createServiceClient();

  // Get current workspace count
  const { count } = await supabase
    .from('workspaces')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', orgId);

  // Get org-level limit (user_id IS NULL)
  const { data: limitData } = await supabase
    .from('workspace_limits')
    .select('max_workspaces')
    .eq('organization_id', orgId)
    .is('user_id', null)
    .single();

  return {
    current: count || 0,
    limit: limitData?.max_workspaces || 3, // Default to 3
  };
}

/**
 * Get workspace limit info for a specific user.
 * Includes their current usage and whether they can create more.
 */
export async function getUserWorkspaceLimitInfo(
  orgId: string,
  userId: string
): Promise<WorkspaceLimitInfo> {
  const supabase = createServiceClient();

  // Only org admins can create workspaces
  if (!(await isOrgOwnerOrAdmin(orgId, userId))) {
    const usage = await getWorkspaceUsage(orgId);
    return {
      ...usage,
      canCreate: false,
      reason: 'Only organization owners and admins can create workspaces',
    };
  }

  const usage = await getWorkspaceUsage(orgId);

  if (usage.current >= usage.limit) {
    return {
      ...usage,
      canCreate: false,
      reason: `Workspace limit reached (${usage.limit}). Contact support to increase your limit.`,
    };
  }

  return {
    ...usage,
    canCreate: true,
  };
}

/**
 * Set workspace limit for an organization.
 * Only callable by super admins.
 */
export async function setOrgWorkspaceLimit(
  orgId: string,
  limit: number,
  setBy: string
): Promise<void> {
  const supabase = createServiceClient();

  await supabase
    .from('workspace_limits')
    .upsert(
      {
        organization_id: orgId,
        user_id: null, // Org-level limit
        max_workspaces: limit,
        set_by: setBy,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'organization_id,user_id',
      }
    );
}

/**
 * Set workspace limit for a specific user (overrides org limit).
 * Only callable by super admins.
 */
export async function setUserWorkspaceLimit(
  orgId: string,
  userId: string,
  limit: number,
  setBy: string
): Promise<void> {
  const supabase = createServiceClient();

  await supabase
    .from('workspace_limits')
    .upsert(
      {
        organization_id: orgId,
        user_id: userId,
        max_workspaces: limit,
        set_by: setBy,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'organization_id,user_id',
      }
    );
}

/**
 * Get all workspace limits for an organization.
 * Includes both org-level and user-specific limits.
 */
export async function getOrgWorkspaceLimits(orgId: string) {
  const supabase = createServiceClient();

  const { data } = await supabase
    .from('workspace_limits')
    .select(`
      *,
      user:users(id, full_name, email)
    `)
    .eq('organization_id', orgId)
    .order('user_id', { ascending: true, nullsFirst: true }); // Org limit first

  return data || [];
}

/**
 * Remove a user-specific workspace limit (reverts to org default).
 */
export async function removeUserWorkspaceLimit(
  orgId: string,
  userId: string
): Promise<void> {
  const supabase = createServiceClient();

  await supabase
    .from('workspace_limits')
    .delete()
    .eq('organization_id', orgId)
    .eq('user_id', userId);
}

/**
 * Validate workspace creation request.
 * Throws error if limit reached or user lacks permission.
 */
export async function validateWorkspaceCreation(
  orgId: string,
  userId: string
): Promise<void> {
  const limitInfo = await getUserWorkspaceLimitInfo(orgId, userId);

  if (!limitInfo.canCreate) {
    throw new Error(limitInfo.reason || 'Cannot create workspace');
  }
}
