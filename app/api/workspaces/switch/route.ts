import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { setCurrentWorkspace } from '@/lib/supabase/workspace-middleware';
import { hasWorkspaceAccess } from '@/lib/permissions';

/**
 * POST /api/workspaces/switch
 * Switches the user's current workspace context.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { workspaceId } = body;

    if (!workspaceId) {
      return NextResponse.json(
        { error: 'Workspace ID is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user has access to the workspace
    const hasAccess = await hasWorkspaceAccess(workspaceId, user.id);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get workspace organization
    const { data: workspace } = await supabase
      .from('workspaces')
      .select('organization_id, name')
      .eq('id', workspaceId)
      .single();

    if (!workspace) {
      return NextResponse.json(
        { error: 'Workspace not found' },
        { status: 404 }
      );
    }

    // Update user's workspace context
    await setCurrentWorkspace(user.id, workspace.organization_id, workspaceId);

    return NextResponse.json({
      success: true,
      workspaceId,
      message: `Switched to workspace: ${workspace.name}`,
    });
  } catch (error) {
    console.error('Error switching workspace:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
