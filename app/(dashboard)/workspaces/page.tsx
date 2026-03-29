import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getUserWorkspaces, isOrgOwnerOrAdmin } from '@/lib/permissions';
import { getUserWorkspaceLimitInfo } from '@/lib/workspace-limits';
import { WorkspaceList } from '@/components/workspaces/workspace-list';
import { Button } from '@/components/ui';
import Link from 'next/link';

export default async function WorkspacesPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: membership } = await supabase
    .from('org_members')
    .select('organization_id, role')
    .eq('user_id', user.id)
    .single();

  if (!membership) redirect('/dashboard');

  // Get workspaces and limit info
  const [workspaces, limitInfo, isAdmin] = await Promise.all([
    getUserWorkspaces(membership.organization_id, user.id),
    getUserWorkspaceLimitInfo(membership.organization_id, user.id),
    isOrgOwnerOrAdmin(membership.organization_id, user.id),
  ]);

  // Get member counts for each workspace
  const workspacesWithStats = await Promise.all(
    workspaces.map(async (workspace) => {
      const { count: memberCount } = await supabase
        .from('workspace_members')
        .select('*', { count: 'exact', head: true })
        .eq('workspace_id', workspace.id);

      const { count: postCount } = await supabase
        .from('content_posts')
        .select('*', { count: 'exact', head: true })
        .eq('workspace_id', workspace.id);

      return {
        ...workspace,
        member_count: memberCount || 0,
        content_count: postCount || 0,
      };
    })
  );

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        {/* Error message */}
        {searchParams.error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
            {decodeURIComponent(searchParams.error)}
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-charcoal mb-2">Workspaces</h1>
            <p className="text-stone">
              Manage your brands and businesses. Using {limitInfo.current} of {limitInfo.limit} workspaces.
            </p>
          </div>
          {limitInfo.canCreate && (
            <Link href="/workspaces/new">
              <Button variant="primary">Create Workspace</Button>
            </Link>
          )}
        </div>

        {/* Workspace limit warning */}
        {!limitInfo.canCreate && limitInfo.reason && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg">
            <p className="font-medium">Workspace Limit Reached</p>
            <p className="text-sm mt-1">{limitInfo.reason}</p>
          </div>
        )}

        {/* Workspace List */}
        {workspacesWithStats.length > 0 ? (
          <WorkspaceList workspaces={workspacesWithStats} isAdmin={isAdmin} />
        ) : (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-stone/10 mb-4">
              <svg
                className="w-8 h-8 text-stone"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-charcoal mb-2">No workspaces yet</h3>
            <p className="text-stone mb-6">Create your first workspace to get started.</p>
            {limitInfo.canCreate && (
              <Link href="/workspaces/new">
                <Button variant="primary">Create Workspace</Button>
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
