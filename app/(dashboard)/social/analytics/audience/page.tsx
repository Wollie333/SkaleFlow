import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AudienceInsightsClient } from './audience-insights-client';

export const metadata = {
  title: 'Audience Insights | SkaleFlow',
  description: 'Understand your social media audience',
};

export default async function AudienceInsightsPage() {
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

  const organizationId = membership.organization_id;

  // Get active connections
  const { data: connections } = await supabase
    .from('social_media_connections')
    .select('id, platform, platform_username, platform_page_name, is_active')
    .eq('organization_id', organizationId)
    .eq('is_active', true);

  return (
    <AudienceInsightsClient
      organizationId={organizationId}
      connections={connections || []}
    />
  );
}
