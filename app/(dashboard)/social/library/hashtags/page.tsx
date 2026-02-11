import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { HashtagVaultClient } from './hashtag-vault-client';

export const metadata = {
  title: 'Hashtag Vault - SkaleFlow',
  description: 'Save and organize hashtag sets for quick insertion into posts',
};

export default async function HashtagVaultPage() {
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

  // Fetch hashtag sets
  const { data: hashtagSets, error: setsError } = await supabase
    .from('hashtag_sets')
    .select('*')
    .eq('organization_id', organizationId)
    .order('last_used_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false });

  // Fetch hashtag analytics to show performance
  const { data: hashtagAnalytics } = await supabase
    .from('hashtag_analytics')
    .select('*')
    .eq('organization_id', organizationId);

  // Calculate performance metrics for each set
  const setsWithMetrics = (hashtagSets || []).map((set) => {
    const setHashtags = set.hashtags || [];
    const relevantAnalytics = (hashtagAnalytics || []).filter((analytics) =>
      setHashtags.includes(analytics.hashtag)
    );

    const totalUses = relevantAnalytics.reduce((sum, a) => sum + (a.used_count || 0), 0);
    const avgEngagement =
      relevantAnalytics.length > 0
        ? relevantAnalytics.reduce((sum, a) => sum + (a.avg_engagement_rate || 0), 0) /
          relevantAnalytics.length
        : 0;

    return {
      ...set,
      metrics: {
        totalUses,
        avgEngagement: parseFloat(avgEngagement.toFixed(2)),
      },
    };
  });

  return (
    <HashtagVaultClient
      initialHashtagSets={setsWithMetrics}
      organizationId={organizationId}
    />
  );
}
