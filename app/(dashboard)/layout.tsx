import { redirect } from 'next/navigation';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { DashboardLayoutClient } from './layout-client';
import { checkCredits } from '@/lib/ai/server';
import type { FeaturePermissions } from '@/lib/permissions';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch user details and org membership in parallel
  const [{ data: userData }, { data: membership }] = await Promise.all([
    supabase
      .from('users')
      .select('full_name, email, role')
      .eq('id', user.id)
      .single(),
    supabase
      .from('org_members')
      .select('organization_id, role')
      .eq('user_id', user.id)
      .single(),
  ]);

  let brandProgress = undefined;
  let contentStats = undefined;
  let tierName: string | undefined = undefined;
  let pipelineCount = 0;
  let contentEngineEnabled = false;
  let notificationCount = 0;
  let pendingReviewCount = 0;
  let draftCount = 0;
  const orgRole = (membership?.role || null) as string | null;
  let teamPermissions: Record<string, FeaturePermissions> = {};

  // Prepare promises that run regardless of org membership
  const notificationPromise = supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('is_read', false);

  const pipelinePromise = userData?.role === 'super_admin'
    ? supabase
        .from('applications')
        .select('*', { count: 'exact', head: true })
        .eq('pipeline_stage', 'application')
    : null;

  if (membership?.organization_id) {
    const orgId = membership.organization_id;
    const isAdmin = orgRole === 'owner' || orgRole === 'admin';

    try {
      // Prepare team permissions query for non-admin users
      const teamPermsPromise = !isAdmin
        ? supabase
            .from('team_permissions')
            .select('feature, permissions')
            .eq('organization_id', orgId)
            .eq('user_id', user.id)
        : null;

      // Prepare pending review count for admins
      const serviceClient = createServiceClient();
      const pendingReviewPromise = isAdmin
        ? serviceClient
            .from('change_requests')
            .select('*', { count: 'exact', head: true })
            .eq('organization_id', orgId)
            .in('status', ['pending', 'revision_requested'])
        : null;

      // Draft count query
      const draftCountPromise = supabase
        .from('content_items')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', orgId)
        .eq('status', 'scripted');

      // Run ALL queries in parallel (org-scoped + global)
      const [orgResult, subscriptionResult, phasesResult, contentCountResult, notifResult, pipelineResult, teamPermsResult, pendingReviewResult, draftCountResult] = await Promise.all([
        supabase
          .from('organizations')
          .select('content_engine_enabled')
          .eq('id', orgId)
          .single(),
        supabase
          .from('subscriptions')
          .select('*, tier:subscription_tiers(name)')
          .eq('organization_id', orgId)
          .limit(1)
          .single(),
        supabase
          .from('brand_phases')
          .select('phase_number, status')
          .eq('organization_id', orgId)
          .order('sort_order'),
        supabase
          .from('content_items')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', orgId)
          .in('status', ['idea', 'scripted']),
        notificationPromise,
        pipelinePromise,
        teamPermsPromise,
        pendingReviewPromise,
        draftCountPromise,
      ]);

      contentEngineEnabled = orgResult.data?.content_engine_enabled ?? false;

      const tierData = (subscriptionResult.data as Record<string, unknown>)?.tier as { name: string } | null;
      tierName = tierData?.name ?? undefined;

      const phases = phasesResult.data;
      if (phases && phases.length > 0) {
        const completedPhases = phases.filter(p => p.status === 'locked' || p.status === 'completed').length;
        const currentPhase = phases.find(p => p.status === 'in_progress')?.phase_number ||
          phases.find(p => p.status === 'not_started')?.phase_number;

        brandProgress = {
          currentPhase,
          completedPhases,
          totalPhases: phases.length,
        };
      }

      contentStats = { pending: contentCountResult.count || 0 };
      pipelineCount = pipelineResult?.count || 0;
      notificationCount = notifResult.count || 0;
      pendingReviewCount = pendingReviewResult?.count || 0;
      draftCount = draftCountResult?.count || 0;

      // Build team permissions map for non-admin users
      if (teamPermsResult?.data) {
        for (const row of teamPermsResult.data) {
          teamPermissions[row.feature] = (row.permissions || {}) as FeaturePermissions;
        }
      }
    } catch (layoutError) {
      console.error('Dashboard layout query error:', layoutError);
      // Fallback: run only the essential queries (notifications + pipeline)
      try {
        const [notifResult, pipelineResult] = await Promise.all([
          notificationPromise,
          pipelinePromise,
        ]);
        pipelineCount = pipelineResult?.count || 0;
        notificationCount = notifResult.count || 0;
      } catch (fallbackError) {
        console.error('Dashboard layout fallback query error:', fallbackError);
      }
    }
  } else {
    const [notifResult, pipelineResult] = await Promise.all([
      notificationPromise,
      pipelinePromise,
    ]);
    pipelineCount = pipelineResult?.count || 0;
    notificationCount = notifResult.count || 0;
  }

  // Fetch credit balance for super admin warning banner
  let creditBalance = null;
  if (membership?.organization_id) {
    try {
      const balance = await checkCredits(
        membership.organization_id,
        0,
        user.id
      );
      creditBalance = {
        totalRemaining: balance.totalRemaining,
        isSuperAdmin: balance.isSuperAdmin || false,
      };
    } catch {
      // Silently fail - warning banner is optional
    }
  }

  return (
    <DashboardLayoutClient
      headerProps={{
        user: { email: user.email!, full_name: userData?.full_name },
        initialUnreadCount: notificationCount || 0,
        organizationId: membership?.organization_id,
        draftCount: draftCount,
      }}
      sidebarProps={{
        brandProgress,
        contentStats,
        userRole: userData?.role,
        orgRole,
        tierName,
        pipelineCount,
        contentEngineEnabled,
        notificationCount: notificationCount || 0,
        pendingReviewCount,
        teamPermissions,
      }}
      creditBalance={creditBalance}
    >
      {children}
    </DashboardLayoutClient>
  );
}
