import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { AnalyticsOverviewClient } from './analytics-overview-client';

export const metadata = {
  title: 'Analytics Overview - SkaleFlow',
  description: 'Comprehensive social media analytics and performance insights',
};

export default async function AnalyticsOverviewPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Get user's organization
  const { data: membership } = await supabase
    .from('org_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .single();

  if (!membership?.organization_id) {
    redirect('/dashboard');
  }

  const organizationId = membership.organization_id;

  // Get active connections
  const { data: connections } = await supabase
    .from('social_media_connections')
    .select('id, platform, platform_username, platform_page_name, is_active')
    .eq('organization_id', organizationId)
    .eq('is_active', true);

  return (
    <AnalyticsOverviewClient
      organizationId={organizationId}
      connections={connections || []}
    />
  );
}
