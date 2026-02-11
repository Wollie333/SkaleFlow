import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ListeningDashboardClient } from './listening-dashboard-client';

export const metadata = {
  title: 'Social Listening - SkaleFlow',
  description: 'Track brand mentions, sentiment, and trends across social media',
};

export default async function SocialListeningPage() {
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

  // Fetch keywords being tracked
  const { data: keywords } = await supabase
    .from('social_listening_keywords')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  // Fetch recent mentions (last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const { data: mentions } = await supabase
    .from('social_listening_mentions')
    .select('*')
    .eq('organization_id', organizationId)
    .gte('discovered_at', sevenDaysAgo.toISOString())
    .order('published_at', { ascending: false })
    .limit(50);

  // Calculate sentiment distribution
  const sentimentCounts = {
    positive: 0,
    neutral: 0,
    negative: 0,
  };

  (mentions || []).forEach((mention: any) => {
    if (mention.sentiment === 'positive') sentimentCounts.positive++;
    else if (mention.sentiment === 'negative') sentimentCounts.negative++;
    else sentimentCounts.neutral++;
  });

  // Fetch trending topics (last 24 hours)
  const oneDayAgo = new Date();
  oneDayAgo.setDate(oneDayAgo.getDate() - 1);

  const { data: trends } = await supabase
    .from('social_listening_trends')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('time_period', '24h')
    .gte('analyzed_at', oneDayAgo.toISOString())
    .order('mention_count', { ascending: false })
    .limit(10);

  // Fetch competitors for mention comparison
  const { data: competitors } = await supabase
    .from('competitors')
    .select('id, name')
    .eq('organization_id', organizationId)
    .eq('is_active', true)
    .eq('track_mentions', true);

  return (
    <ListeningDashboardClient
      keywords={keywords || []}
      mentions={mentions || []}
      sentimentCounts={sentimentCounts}
      trends={trends || []}
      competitors={competitors || []}
      organizationId={organizationId}
    />
  );
}
