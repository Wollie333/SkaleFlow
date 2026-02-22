import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ListeningReportsClient } from './listening-reports-client';

export const metadata = {
  title: 'Listening Reports | SkaleFlow',
  description: 'Social listening summary and insights',
};

export default async function ReportsPage() {
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

  // Fetch keywords
  const { data: keywords } = await supabase
    .from('social_listening_keywords')
    .select('*')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false });

  // Fetch mentions for different time periods
  const now = new Date();
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: recentMentions } = await supabase
    .from('social_listening_mentions')
    .select('*')
    .eq('organization_id', organizationId)
    .gte('discovered_at', thirtyDaysAgo.toISOString())
    .order('published_at', { ascending: false })
    .limit(200);

  // Fetch trends
  const { data: trends } = await supabase
    .from('social_listening_trends')
    .select('*')
    .eq('organization_id', organizationId)
    .order('mention_count', { ascending: false })
    .limit(20);

  return (
    <ListeningReportsClient
      keywords={keywords || []}
      mentions={recentMentions || []}
      trends={trends || []}
      organizationId={organizationId}
    />
  );
}
