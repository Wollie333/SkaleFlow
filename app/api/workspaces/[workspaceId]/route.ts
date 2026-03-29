import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  hasWorkspaceAccess,
  isWorkspaceAdmin,
  isOrgOwnerOrAdmin,
} from '@/lib/permissions';

/**
 * GET /api/workspaces/[workspaceId]
 * Returns workspace details with members.
 */
export async function GET(
  request: Request,
  { params }: { params: { workspaceId: string } }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user has access to workspace
    if (!(await hasWorkspaceAccess(params.workspaceId, user.id))) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { data: workspace, error } = await supabase
      .from('workspaces')
      .select(
        `
        *,
        workspace_members (
          id,
          role,
          added_at,
          user:users (
            id,
            full_name,
            email,
            avatar_url
          )
        )
      `
      )
      .eq('id', params.workspaceId)
      .single();

    if (error || !workspace) {
      return NextResponse.json(
        { error: 'Workspace not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ workspace });
  } catch (error) {
    console.error('Error fetching workspace:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/workspaces/[workspaceId]
 * Updates workspace details.
 */
export async function PATCH(
  request: Request,
  { params }: { params: { workspaceId: string } }
) {
  try {
    const updates = await request.json();
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user can update workspace (must be workspace admin or org admin)
    const canUpdate =
      (await isWorkspaceAdmin(params.workspaceId, user.id)) ||
      (await (async () => {
        const { data: workspace } = await supabase
          .from('workspaces')
          .select('organization_id')
          .eq('id', params.workspaceId)
          .single();
        if (!workspace) return false;
        return await isOrgOwnerOrAdmin(workspace.organization_id, user.id);
      })());

    if (!canUpdate) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    // Prevent updating is_default or organization_id
    const allowedUpdates = {
      name: updates.name,
      description: updates.description,
      color: updates.color,
      logo_url: updates.logo_url,
      brand_engine_status: updates.brand_engine_status,
      content_engine_enabled: updates.content_engine_enabled,
      settings: updates.settings,
      updated_at: new Date().toISOString(),
    };

    // Remove undefined values
    Object.keys(allowedUpdates).forEach((key) =>
      (allowedUpdates as any)[key] === undefined
        ? delete (allowedUpdates as any)[key]
        : {}
    );

    const { data: workspace, error: updateError } = await supabase
      .from('workspaces')
      .update(allowedUpdates)
      .eq('id', params.workspaceId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating workspace:', updateError);
      return NextResponse.json(
        { error: 'Failed to update workspace' },
        { status: 500 }
      );
    }

    return NextResponse.json({ workspace });
  } catch (error) {
    console.error('Error updating workspace:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/workspaces/[workspaceId]
 * Deletes a workspace (cannot delete default workspace).
 */
export async function DELETE(
  request: Request,
  { params }: { params: { workspaceId: string } }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get workspace to check permissions and is_default status
    const { data: workspace } = await supabase
      .from('workspaces')
      .select('organization_id, is_default, name')
      .eq('id', params.workspaceId)
      .single();

    if (!workspace) {
      return NextResponse.json(
        { error: 'Workspace not found' },
        { status: 404 }
      );
    }

    // Cannot delete default workspace
    if (workspace.is_default) {
      return NextResponse.json(
        { error: 'Cannot delete default workspace' },
        { status: 400 }
      );
    }

    // Only org owner/admin can delete workspaces
    if (!(await isOrgOwnerOrAdmin(workspace.organization_id, user.id))) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    // Delete workspace (cascade will handle related records)
    const { error: deleteError } = await supabase
      .from('workspaces')
      .delete()
      .eq('id', params.workspaceId);

    if (deleteError) {
      console.error('Error deleting workspace:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete workspace' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Workspace "${workspace.name}" deleted successfully`,
    });
  } catch (error) {
    console.error('Error deleting workspace:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
