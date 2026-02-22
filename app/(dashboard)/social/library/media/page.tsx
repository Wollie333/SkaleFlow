import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { MediaLibraryClient } from './media-library-client';

export const metadata = {
  title: 'Media Library | SkaleFlow',
  description: 'Organize and manage your social media assets',
};

export default async function MediaLibraryPage() {
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

  return (
    <MediaLibraryClient organizationId={membership.organization_id} />
  );
}
