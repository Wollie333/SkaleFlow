import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient, createServiceClient } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Applications',
};

export default async function CrmApplicationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [{ data: userData }, { data: membership }] = await Promise.all([
    supabase.from('users').select('role').eq('id', user.id).single(),
    supabase.from('org_members').select('organization_id').eq('user_id', user.id).single(),
  ]);

  // Allow super_admin directly
  if (userData?.role === 'super_admin') {
    return <>{children}</>;
  }

  // Allow team members of an org that has a super_admin
  if (membership?.organization_id) {
    const serviceClient = createServiceClient();
    const { count } = await serviceClient
      .from('org_members')
      .select('user_id, users!inner(role)', { count: 'exact', head: true })
      .eq('organization_id', membership.organization_id)
      .eq('users.role', 'super_admin');

    if ((count || 0) > 0) {
      return <>{children}</>;
    }
  }

  redirect('/crm');
}
