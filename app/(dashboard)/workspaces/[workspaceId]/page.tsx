import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { isWorkspaceAdmin, isOrgOwnerOrAdmin } from '@/lib/permissions';
import { WorkspaceSettingsForm } from '@/components/workspaces/workspace-settings-form';

export default async function WorkspaceSettingsPage({
  params,
}: {
  params: { workspaceId: string };
}) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Check if user can manage this workspace
  const [canManage, workspace] = await Promise.all([
    (async () => {
      const isWsAdmin = await isWorkspaceAdmin(params.workspaceId, user.id);
      if (isWsAdmin) return true;

      const { data: ws } = await supabase
        .from('workspaces')
        .select('organization_id')
        .eq('id', params.workspaceId)
        .single();

      if (!ws) return false;
      return await isOrgOwnerOrAdmin(ws.organization_id, user.id);
    })(),
    supabase
      .from('workspaces')
      .select(`
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
      `)
      .eq('id', params.workspaceId)
      .single(),
  ]);

  if (!canManage || !workspace.data) {
    redirect('/workspaces');
  }

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-charcoal mb-2">Workspace Settings</h1>
          <p className="text-stone">Manage workspace details and team members</p>
        </div>

        {/* Settings Form */}
        <WorkspaceSettingsForm workspace={workspace.data} />
      </div>
    </div>
  );
}
