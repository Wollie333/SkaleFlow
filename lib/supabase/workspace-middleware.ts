import { createClient, createServiceClient } from '@/lib/supabase/server';
import { hasWorkspaceAccess } from '@/lib/permissions';

/**
 * Get the current workspace ID for a user in an organization.
 * Uses the user_workspace_context table to remember last active workspace.
 * Falls back to first available workspace if context is invalid.
 */
export async function getCurrentWorkspace(
  userId: string,
  orgId: string
): Promise<string | null> {
  const supabase = await createServiceClient();

  // Check user's current workspace context
  const { data: context } = await supabase
    .from('user_workspace_context')
    .select('current_workspace_id')
    .eq('user_id', userId)
    .eq('organization_id', orgId)
    .single();

  if (context?.current_workspace_id) {
    // Verify user still has access to this workspace
    const hasAccess = await hasWorkspaceAccess(context.current_workspace_id, userId);

    if (hasAccess) {
      return context.current_workspace_id;
    }
  }

  // Fall back to first available workspace (prioritize default)
  const { data: firstWorkspace } = await supabase
    .from('workspace_members')
    .select(`
      workspace_id,
      workspace:workspaces!inner(is_default)
    `)
    .eq('user_id', userId)
    .eq('organization_id', orgId)
    .order('workspace(is_default)', { ascending: false })
    .limit(1)
    .single();

  return firstWorkspace?.workspace_id || null;
}

/**
 * Set the current workspace for a user.
 * Updates the user_workspace_context table.
 */
export async function setCurrentWorkspace(
  userId: string,
  orgId: string,
  workspaceId: string
): Promise<void> {
  const supabase = await createServiceClient();

  // Verify user has access to this workspace
  const hasAccess = await hasWorkspaceAccess(workspaceId, userId);
  if (!hasAccess) {
    throw new Error('User does not have access to this workspace');
  }

  // Update or insert context
  await supabase
    .from('user_workspace_context')
    .upsert(
      {
        user_id: userId,
        organization_id: orgId,
        current_workspace_id: workspaceId,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'user_id,organization_id',
      }
    );
}

/**
 * Get workspace context with full workspace details.
 * Returns the workspace object for the current context.
 */
export async function getWorkspaceContext(userId: string, orgId: string) {
  const workspaceId = await getCurrentWorkspace(userId, orgId);

  if (!workspaceId) {
    return null;
  }

  const supabase = await createServiceClient();
  const { data: workspace } = await supabase
    .from('workspaces')
    .select('*')
    .eq('id', workspaceId)
    .single();

  return workspace;
}

/**
 * Middleware helper to ensure workspace context exists.
 * Creates default workspace if none exists.
 */
export async function ensureWorkspaceContext(
  userId: string,
  orgId: string
): Promise<string> {
  let workspaceId = await getCurrentWorkspace(userId, orgId);

  if (!workspaceId) {
    // User has no workspace access - check if they're a member of the org
    const supabase = await createServiceClient();
    const { data: orgMember } = await supabase
      .from('org_members')
      .select('id')
      .eq('user_id', userId)
      .eq('organization_id', orgId)
      .single();

    if (!orgMember) {
      throw new Error('User is not a member of this organization');
    }

    // Get default workspace
    const { data: defaultWorkspace } = await supabase
      .from('workspaces')
      .select('id')
      .eq('organization_id', orgId)
      .eq('is_default', true)
      .single();

    if (!defaultWorkspace) {
      throw new Error('No default workspace found for organization');
    }

    workspaceId = defaultWorkspace.id;

    // Set as current workspace
    await setCurrentWorkspace(userId, orgId, workspaceId);
  }

  return workspaceId;
}
