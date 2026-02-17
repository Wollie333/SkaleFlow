import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function CrmApplicationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (userData?.role !== 'super_admin') {
    redirect('/crm');
  }

  return <>{children}</>;
}
