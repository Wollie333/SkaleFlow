import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { PostsPerformanceClient } from './posts-performance-client';

export const metadata = {
  title: 'Post Performance | SkaleFlow',
  description: 'Analyze individual post performance metrics',
};

export default async function PostPerformancePage() {
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
    <PostsPerformanceClient
      organizationId={organizationId}
      connections={(connections || []).map(c => ({ ...c, platform_username: c.platform_username ?? undefined, platform_page_name: c.platform_page_name ?? undefined }))}
    />
  );
}
