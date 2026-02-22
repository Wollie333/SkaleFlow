import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { SavedRepliesClient } from './saved-replies-client';

export const metadata = {
  title: 'Saved Replies | SkaleFlow',
  description: 'Manage quick response templates for social media',
};

export default async function SavedRepliesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: membership } = await supabase
    .from('org_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .single();

  if (!membership?.organization_id) {
    redirect('/dashboard');
  }

  return <SavedRepliesClient organizationId={membership.organization_id} />;
}
