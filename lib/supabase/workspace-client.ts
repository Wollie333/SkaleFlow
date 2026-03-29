import { createClient } from '@/lib/supabase/client';

/**
 * Client-side: Get the current workspace ID for a user in an organization.
 * Uses the user_workspace_context table to remember last active workspace.
 * Falls back to first available workspace if context is invalid.
 */
export async function getCurrentWorkspaceClient(
  userId: string,
  orgId: string
): Promise<string | null> {
  const supabase = createClient();

  // Check user's current workspace context
  const { data: context, error: contextError } = await supabase
    .from('user_workspace_context')
    .select('current_workspace_id')
    .eq('user_id', userId)
    .eq('organization_id', orgId)
    .maybeSingle();

  if (contextError) {
    console.error('[Workspace Client] Error fetching context:', contextError);
  }

  if (context?.current_workspace_id) {
    // Verify user still has access to this workspace via workspace_members
    const { data: member } = await supabase
      .from('workspace_members')
      .select('id')
      .eq('workspace_id', context.current_workspace_id)
      .eq('user_id', userId)
      .maybeSingle();

    if (member) {
      return context.current_workspace_id;
    }
  }

  // Fall back to first available workspace
  // First try to get default workspace
  const { data: defaultMembership } = await supabase
    .from('workspace_members')
    .select('workspace_id, workspaces!inner(is_default)')
    .eq('user_id', userId)
    .eq('organization_id', orgId)
    .eq('workspaces.is_default', true)
    .limit(1)
    .maybeSingle();

  if (defaultMembership?.workspace_id) {
    // Set this as the current context for next time
    await setCurrentWorkspaceClient(userId, orgId, defaultMembership.workspace_id);
    return defaultMembership.workspace_id;
  }

  // If no default workspace, get any workspace the user is a member of
  const { data: anyMembership } = await supabase
    .from('workspace_members')
    .select('workspace_id')
    .eq('user_id', userId)
    .eq('organization_id', orgId)
    .limit(1)
    .maybeSingle();

  if (anyMembership?.workspace_id) {
    // Set this as the current context for next time
    await setCurrentWorkspaceClient(userId, orgId, anyMembership.workspace_id);
    return anyMembership.workspace_id;
  }

  console.error('[Workspace Client] No workspace found for user:', { userId, orgId });
  return null;
}

/**
 * Client-side: Set the current workspace for a user.
 * Updates the user_workspace_context table.
 */
export async function setCurrentWorkspaceClient(
  userId: string,
  orgId: string,
  workspaceId: string
): Promise<void> {
  const supabase = createClient();

  // Verify user has access to this workspace
  const { data: member } = await supabase
    .from('workspace_members')
    .select('id')
    .eq('workspace_id', workspaceId)
    .eq('user_id', userId)
    .maybeSingle();

  if (!member) {
    console.error('[Workspace Client] User does not have access to workspace:', { userId, workspaceId });
    throw new Error('User does not have access to this workspace');
  }

  // Update or insert context
  const { error } = await supabase
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

  if (error) {
    console.error('[Workspace Client] Error setting workspace context:', error);
    throw error;
  }
}
