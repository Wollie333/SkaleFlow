import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Header } from '@/components/layout/header';
import { Sidebar } from '@/components/layout/sidebar';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();

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
      .select('organization_id')
      .eq('user_id', user.id)
      .single(),
  ]);

  let brandProgress = undefined;
  let contentStats = undefined;
  let tierName: string | undefined = undefined;
  let pipelineCount = 0;
  let contentEngineEnabled = false;
  let notificationCount = 0;

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

    // Run ALL queries in parallel (org-scoped + global)
    const [orgResult, subscriptionResult, phasesResult, contentCountResult, notifResult, pipelineResult] = await Promise.all([
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
  } else {
    const [notifResult, pipelineResult] = await Promise.all([
      notificationPromise,
      pipelinePromise,
    ]);
    pipelineCount = pipelineResult?.count || 0;
    notificationCount = notifResult.count || 0;
  }

  return (
    <div className="min-h-screen bg-cream">
      <Header user={{ email: user.email!, full_name: userData?.full_name }} initialUnreadCount={notificationCount || 0} organizationId={membership?.organization_id} />
      <Sidebar brandProgress={brandProgress} contentStats={contentStats} userRole={userData?.role} tierName={tierName} pipelineCount={pipelineCount} contentEngineEnabled={contentEngineEnabled} notificationCount={notificationCount || 0} />
      <main className="ml-60 pt-16 min-h-screen overflow-x-hidden">
        <div className="p-6 lg:p-8 max-w-[calc(100vw-15rem)]">
          {children}
        </div>
      </main>
    </div>
  );
}
