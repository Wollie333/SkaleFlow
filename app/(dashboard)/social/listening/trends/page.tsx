import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { TrendsClient } from './trends-client';

export const metadata = {
  title: 'Trending Topics | SkaleFlow',
  description: 'Discover trending topics and hashtags relevant to your brand',
};

export default async function TrendsPage() {
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

  // Fetch trends for all three time periods in parallel
  const [res24h, res7d, res30d] = await Promise.all([
    supabase
      .from('social_listening_trends')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('time_period', '24h')
      .order('mention_count', { ascending: false })
      .limit(50),
    supabase
      .from('social_listening_trends')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('time_period', '7d')
      .order('mention_count', { ascending: false })
      .limit(50),
    supabase
      .from('social_listening_trends')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('time_period', '30d')
      .order('mention_count', { ascending: false })
      .limit(50),
  ]);

  return (
    <TrendsClient
      trends24h={(res24h.data || []) as any[]}
      trends7d={(res7d.data || []) as any[]}
      trends30d={(res30d.data || []) as any[]}
      organizationId={organizationId}
    />
  );
}
