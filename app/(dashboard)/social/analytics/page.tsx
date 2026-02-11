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
  const { data: userData } = await supabase
    .from('users')
    .select('organization_id')
    .eq('id', user.id)
    .single();

  if (!userData?.organization_id) {
    redirect('/onboarding');
  }

  // Date ranges for comparison
  const now = new Date();
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(now.getDate() - 30);
  const sixtyDaysAgo = new Date(now);
  sixtyDaysAgo.setDate(now.getDate() - 60);

  // Fetch published posts with analytics (last 30 days)
  const { data: recentPosts } = await supabase
    .from('published_posts')
    .select(`
      id,
      platform,
      published_at,
      post_analytics (
        impressions,
        reach,
        likes,
        comments,
        shares,
        engagement_rate
      )
    `)
    .eq('organization_id', userData.organization_id)
    .eq('publish_status', 'published')
    .gte('published_at', thirtyDaysAgo.toISOString())
    .order('published_at', { ascending: false });

  // Fetch previous period for comparison (30-60 days ago)
  const { data: previousPosts } = await supabase
    .from('published_posts')
    .select(`
      id,
      post_analytics (
        impressions,
        reach,
        engagement_rate
      )
    `)
    .eq('organization_id', userData.organization_id)
    .eq('publish_status', 'published')
    .gte('published_at', sixtyDaysAgo.toISOString())
    .lt('published_at', thirtyDaysAgo.toISOString());

  // Calculate aggregate metrics
  const calculateMetrics = (posts: any[]) => {
    if (!posts || posts.length === 0) {
      return {
        totalPosts: 0,
        totalImpressions: 0,
        totalReach: 0,
        totalEngagement: 0,
        avgEngagementRate: 0,
      };
    }

    let totalImpressions = 0;
    let totalReach = 0;
    let totalEngagement = 0;
    let totalEngagementRate = 0;
    let count = 0;

    posts.forEach((post) => {
      const analytics = Array.isArray(post.post_analytics)
        ? post.post_analytics[0]
        : post.post_analytics;

      if (analytics) {
        totalImpressions += analytics.impressions || 0;
        totalReach += analytics.reach || 0;
        totalEngagement += (analytics.likes || 0) + (analytics.comments || 0) + (analytics.shares || 0);
        totalEngagementRate += analytics.engagement_rate || 0;
        count++;
      }
    });

    return {
      totalPosts: posts.length,
      totalImpressions,
      totalReach,
      totalEngagement,
      avgEngagementRate: count > 0 ? totalEngagementRate / count : 0,
    };
  };

  const currentMetrics = calculateMetrics(recentPosts || []);
  const previousMetrics = calculateMetrics(previousPosts || []);

  // Calculate growth percentages
  const calculateGrowth = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  const growth = {
    posts: calculateGrowth(currentMetrics.totalPosts, previousMetrics.totalPosts),
    impressions: calculateGrowth(currentMetrics.totalImpressions, previousMetrics.totalImpressions),
    reach: calculateGrowth(currentMetrics.totalReach, previousMetrics.totalReach),
    engagement: calculateGrowth(currentMetrics.avgEngagementRate, previousMetrics.avgEngagementRate),
  };

  // Fetch top performing posts
  const { data: topPosts } = await supabase
    .from('published_posts')
    .select(`
      id,
      platform,
      published_at,
      post_url,
      content_items!inner(caption),
      post_analytics (
        engagement_rate,
        likes,
        comments,
        shares,
        impressions
      )
    `)
    .eq('organization_id', userData.organization_id)
    .eq('publish_status', 'published')
    .gte('published_at', thirtyDaysAgo.toISOString())
    .not('post_analytics', 'is', null)
    .order('post_analytics(engagement_rate)', { ascending: false })
    .limit(5);

  // Platform breakdown
  const platformMetrics = (recentPosts || []).reduce((acc: any, post: any) => {
    const platform = post.platform;
    const analytics = Array.isArray(post.post_analytics)
      ? post.post_analytics[0]
      : post.post_analytics;

    if (!acc[platform]) {
      acc[platform] = {
        posts: 0,
        impressions: 0,
        engagement: 0,
        engagementRate: 0,
      };
    }

    acc[platform].posts++;
    if (analytics) {
      acc[platform].impressions += analytics.impressions || 0;
      acc[platform].engagement += (analytics.likes || 0) + (analytics.comments || 0) + (analytics.shares || 0);
      acc[platform].engagementRate += analytics.engagement_rate || 0;
    }

    return acc;
  }, {});

  // Average engagement rate per platform
  Object.keys(platformMetrics).forEach((platform) => {
    if (platformMetrics[platform].posts > 0) {
      platformMetrics[platform].engagementRate /= platformMetrics[platform].posts;
    }
  });

  return (
    <AnalyticsOverviewClient
      currentMetrics={currentMetrics}
      previousMetrics={previousMetrics}
      growth={growth}
      topPosts={topPosts || []}
      platformMetrics={platformMetrics}
      organizationId={userData.organization_id}
    />
  );
}
