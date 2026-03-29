import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { canCreateWorkspace } from '@/lib/permissions';
import { getUserWorkspaceLimitInfo } from '@/lib/workspace-limits';
import { WorkspaceCreateForm } from '@/components/workspaces/workspace-create-form';

export default async function NewWorkspacePage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: membership } = await supabase
    .from('org_members')
    .select('organization_id, role')
    .eq('user_id', user.id)
    .single();

  if (!membership) redirect('/dashboard');

  // Check if user can create workspace
  const canCreateResult = await canCreateWorkspace(membership.organization_id, user.id);

  if (!canCreateResult.allowed) {
    redirect('/workspaces?error=' + encodeURIComponent(canCreateResult.reason || 'Cannot create workspace'));
  }

  // Get workspace limit info
  const limitInfo = await getUserWorkspaceLimitInfo(membership.organization_id, user.id);

  return (
    <div className="p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-charcoal mb-2">Create Workspace</h1>
          <p className="text-stone">
            Create a new workspace for your brand or business. You're using {limitInfo.current} of {limitInfo.limit} workspaces.
          </p>
        </div>

        {/* Form */}
        <WorkspaceCreateForm organizationId={membership.organization_id} />
      </div>
    </div>
  );
}
