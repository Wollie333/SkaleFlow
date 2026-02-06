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

  // Get user details
  const { data: userData } = await supabase
    .from('users')
    .select('full_name, email')
    .eq('id', user.id)
    .single();

  // Get organization and brand progress
  const { data: membership } = await supabase
    .from('org_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .single();

  let brandProgress = undefined;
  let contentStats = undefined;

  if (membership?.organization_id) {
    // Get brand phases progress
    const { data: phases } = await supabase
      .from('brand_phases')
      .select('phase_number, status')
      .eq('organization_id', membership.organization_id)
      .order('sort_order');

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

    // Get pending content count
    const { count } = await supabase
      .from('content_items')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', membership.organization_id)
      .in('status', ['idea', 'scripted']);

    contentStats = { pending: count || 0 };
  }

  return (
    <div className="min-h-screen bg-cream">
      <Header user={{ email: user.email!, full_name: userData?.full_name }} />
      <Sidebar brandProgress={brandProgress} contentStats={contentStats} />
      <main className="ml-60 pt-16 min-h-screen">
        <div className="p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
