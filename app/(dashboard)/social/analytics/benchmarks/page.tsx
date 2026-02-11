import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { BenchmarksClient } from './benchmarks-client';

export const metadata = {
  title: 'Industry Benchmarks - SkaleFlow',
  description: 'Compare your performance against industry standards',
};

export default async function BenchmarksPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Get user's organization
  const { data: userData } = await supabase
    .from('users')
    .select('organization_id, organizations(industry)')
    .eq('id', user.id)
    .single();

  if (!userData?.organization_id) {
    redirect('/onboarding');
  }

  const organization = Array.isArray(userData.organizations)
    ? userData.organizations[0]
    : userData.organizations;

  // Fetch industry benchmarks
  const { data: benchmarks } = await supabase
    .from('industry_benchmarks')
    .select('*')
    .eq('industry', organization?.industry || 'general')
    .order('metric_name');

  // Calculate organization's metrics (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: orgPosts } = await supabase
    .from('published_posts')
    .select(`
      platform,
      post_analytics (
        engagement_rate,
        impressions,
        reach
      )
    `)
    .eq('organization_id', userData.organization_id)
    .eq('publish_status', 'published')
    .gte('published_at', thirtyDaysAgo.toISOString());

  // Calculate org metrics by platform
  const orgMetrics = (orgPosts || []).reduce((acc: any, post: any) => {
    const platform = post.platform;
    const analytics = Array.isArray(post.post_analytics)
      ? post.post_analytics[0]
      : post.post_analytics;

    if (!acc[platform]) {
      acc[platform] = {
        totalPosts: 0,
        totalEngagement: 0,
        totalImpressions: 0,
        totalReach: 0,
      };
    }

    acc[platform].totalPosts++;
    if (analytics) {
      acc[platform].totalEngagement += analytics.engagement_rate || 0;
      acc[platform].totalImpressions += analytics.impressions || 0;
      acc[platform].totalReach += analytics.reach || 0;
    }

    return acc;
  }, {});

  // Calculate averages
  Object.keys(orgMetrics).forEach((platform) => {
    const metrics = orgMetrics[platform];
    if (metrics.totalPosts > 0) {
      metrics.avgEngagementRate = metrics.totalEngagement / metrics.totalPosts;
      metrics.avgImpressions = metrics.totalImpressions / metrics.totalPosts;
      metrics.avgReach = metrics.totalReach / metrics.totalPosts;
    }
  });

  return (
    <BenchmarksClient
      benchmarks={benchmarks || []}
      orgMetrics={orgMetrics}
      industry={organization?.industry || 'general'}
    />
  );
}
