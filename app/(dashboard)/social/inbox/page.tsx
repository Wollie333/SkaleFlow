import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { InboxClient } from './inbox-client';

export const metadata = {
  title: 'Social Inbox | SkaleFlow',
  description: 'Manage all your social media interactions in one place',
};

export default async function SocialInboxPage({
  searchParams,
}: {
  searchParams: { type?: string; platform?: string; sentiment?: string; status?: string };
}) {
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Get user's organization from org_members table
  const { data: membership } = await supabase
    .from('org_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .single();

  if (!membership?.organization_id) {
    redirect('/dashboard');
  }

  const organizationId = membership.organization_id;

  // Get filter values
  const type = searchParams.type || 'all';
  const platform = searchParams.platform || 'all';
  const sentiment = searchParams.sentiment || 'all';
  const status = searchParams.status || 'all';

  return (
    <InboxClient
      organizationId={organizationId}
      initialFilters={{
        type,
        platform,
        sentiment,
        status,
      }}
    />
  );
}
