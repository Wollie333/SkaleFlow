import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Pipeline',
};

export default async function PipelineLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Allow super_admin, org owners, and org admins
  const [{ data: userData }, { data: member }] = await Promise.all([
    supabase.from('users').select('role').eq('id', user.id).single(),
    supabase.from('org_members').select('role').eq('user_id', user.id).single(),
  ]);

  const isSuperAdmin = userData?.role === 'super_admin';
  const isOwnerOrAdmin = member && ['owner', 'admin'].includes(member.role);

  if (!isSuperAdmin && !isOwnerOrAdmin) {
    redirect('/dashboard');
  }

  return <>{children}</>;
}
