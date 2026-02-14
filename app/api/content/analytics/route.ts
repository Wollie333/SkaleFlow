import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { SocialPlatform } from '@/types/database';

export async function GET(request: NextRequest) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: membership } = await supabase
    .from('org_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .single();

  if (!membership) {
    return NextResponse.json({ error: 'No organization found' }, { status: 404 });
  }

  const orgId = membership.organization_id;
  const searchParams = request.nextUrl.searchParams;
  const dateFrom = searchParams.get('dateFrom') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const dateTo = searchParams.get('dateTo') || new Date().toISOString().split('T')[0];
  const calendarId = searchParams.get('calendarId');

  // Fetch all published posts (no platform filter — client-side filtering for tabs)
  let postsQuery = supabase
    .from('published_posts')
    .select(`
      id,
      content_item_id,
      platform,
      platform_post_id,
      post_url,
      published_at,
      publish_status,
      content_items!inner (
        topic,
        hook,
        caption,
        calendar_id
      ),
      post_analytics (
        likes,
        comments,
        shares,
        saves,
        impressions,
        reach,
        clicks,
        video_views,
        engagement_rate,
        synced_at
      )
    `)
    .eq('organization_id', orgId)
    .eq('publish_status', 'published')
    .gte('published_at', `${dateFrom}T00:00:00`)
    .lte('published_at', `${dateTo}T23:59:59`)
    .order('published_at', { ascending: false });

  if (calendarId && calendarId !== 'all') {
    postsQuery = postsQuery.eq('content_items.calendar_id', calendarId);
  }

  // Also fetch connected platforms for tab rendering
  const connectionsPromise = supabase
    .from('social_media_connections')
    .select('platform')
    .eq('organization_id', orgId)
    .eq('is_active', true);

  const [{ data: posts, error }, { data: connections }] = await Promise.all([
    postsQuery,
    connectionsPromise,
  ]);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Deduplicate connected platforms
  const connectedPlatforms: SocialPlatform[] = Array.from(
    new Set((connections || []).map(c => c.platform as SocialPlatform))
  );

  // Accumulators
  let totalLikes = 0;
  let totalComments = 0;
  let totalShares = 0;
  let totalSaves = 0;
  let totalImpressions = 0;
  let totalReach = 0;
  let totalClicks = 0;
  let totalVideoViews = 0;
  let totalEngagementRate = 0;
  let postsWithAnalytics = 0;

  // Time series — flat + byPlatform
  const dailyData: Record<string, {
    engagement: number;
    impressions: number;
    reach: number;
    clicks: number;
    saves: number;
    videoViews: number;
    likes: number;
    comments: number;
    shares: number;
    byPlatform: Record<string, {
      engagement: number;
      impressions: number;
      reach: number;
      clicks: number;
      saves: number;
      videoViews: number;
      likes: number;
      comments: number;
      shares: number;
    }>;
  }> = {};

  // Platform breakdown
  const platformData: Record<string, {
    totalPosts: number;
    totalLikes: number;
    totalComments: number;
    totalShares: number;
    totalSaves: number;
    totalImpressions: number;
    totalReach: number;
    totalClicks: number;
    totalVideoViews: number;
    totalEngagementRate: number;
  }> = {};

  // Top posts
  const topPosts: Array<{
    id: string;
    contentItemId: string;
    platform: string;
    topic: string | null;
    hook: string | null;
    publishedAt: string;
    postUrl: string | null;
    likes: number;
    comments: number;
    shares: number;
    saves: number;
    impressions: number;
    reach: number;
    clicks: number;
    videoViews: number;
    engagementRate: number;
  }> = [];

  for (const post of posts || []) {
    const analytics = (post.post_analytics as Array<{
      likes: number;
      comments: number;
      shares: number;
      saves: number;
      impressions: number;
      reach: number;
      clicks: number;
      video_views: number;
      engagement_rate: number;
      synced_at: string;
    }>)?.sort((a, b) =>
      new Date(b.synced_at).getTime() - new Date(a.synced_at).getTime()
    )[0];

    const contentItem = post.content_items as unknown as { topic: string | null; hook: string | null; caption: string | null };

    const likes = analytics?.likes || 0;
    const comments = analytics?.comments || 0;
    const shares = analytics?.shares || 0;
    const saves = analytics?.saves || 0;
    const impressions = analytics?.impressions || 0;
    const reach = analytics?.reach || 0;
    const clicks = analytics?.clicks || 0;
    const videoViews = analytics?.video_views || 0;
    const engRate = analytics?.engagement_rate || 0;

    totalLikes += likes;
    totalComments += comments;
    totalShares += shares;
    totalSaves += saves;
    totalImpressions += impressions;
    totalReach += reach;
    totalClicks += clicks;
    totalVideoViews += videoViews;
    if (engRate > 0) {
      totalEngagementRate += engRate;
      postsWithAnalytics++;
    }

    // Daily time series
    const date = post.published_at ? post.published_at.split('T')[0] : '';
    if (date) {
      if (!dailyData[date]) {
        dailyData[date] = {
          engagement: 0, impressions: 0, reach: 0, clicks: 0,
          saves: 0, videoViews: 0, likes: 0, comments: 0, shares: 0,
          byPlatform: {},
        };
      }
      const day = dailyData[date];
      const eng = likes + comments + shares;
      day.engagement += eng;
      day.impressions += impressions;
      day.reach += reach;
      day.clicks += clicks;
      day.saves += saves;
      day.videoViews += videoViews;
      day.likes += likes;
      day.comments += comments;
      day.shares += shares;

      // Per-platform within this day
      const platform = post.platform;
      if (!day.byPlatform[platform]) {
        day.byPlatform[platform] = {
          engagement: 0, impressions: 0, reach: 0, clicks: 0,
          saves: 0, videoViews: 0, likes: 0, comments: 0, shares: 0,
        };
      }
      const pd = day.byPlatform[platform];
      pd.engagement += eng;
      pd.impressions += impressions;
      pd.reach += reach;
      pd.clicks += clicks;
      pd.saves += saves;
      pd.videoViews += videoViews;
      pd.likes += likes;
      pd.comments += comments;
      pd.shares += shares;
    }

    // Platform breakdown
    if (!platformData[post.platform]) {
      platformData[post.platform] = {
        totalPosts: 0, totalLikes: 0, totalComments: 0,
        totalShares: 0, totalSaves: 0, totalImpressions: 0,
        totalReach: 0, totalClicks: 0, totalVideoViews: 0,
        totalEngagementRate: 0,
      };
    }
    const pd = platformData[post.platform];
    pd.totalPosts++;
    pd.totalLikes += likes;
    pd.totalComments += comments;
    pd.totalShares += shares;
    pd.totalSaves += saves;
    pd.totalImpressions += impressions;
    pd.totalReach += reach;
    pd.totalClicks += clicks;
    pd.totalVideoViews += videoViews;
    pd.totalEngagementRate += engRate;

    topPosts.push({
      id: post.id,
      contentItemId: post.content_item_id,
      platform: post.platform,
      topic: contentItem?.topic || null,
      hook: contentItem?.hook || null,
      publishedAt: post.published_at || '',
      postUrl: post.post_url,
      likes,
      comments,
      shares,
      saves,
      impressions,
      reach,
      clicks,
      videoViews,
      engagementRate: engRate,
    });
  }

  // Build time series sorted by date
  const timeSeries = Object.entries(dailyData)
    .map(([date, d]) => ({
      date,
      engagement: d.engagement,
      impressions: d.impressions,
      reach: d.reach,
      clicks: d.clicks,
      saves: d.saves,
      videoViews: d.videoViews,
      likes: d.likes,
      comments: d.comments,
      shares: d.shares,
      byPlatform: d.byPlatform,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Build platform summary
  const platformSummary = Object.entries(platformData).map(([platform, d]) => ({
    platform,
    totalPosts: d.totalPosts,
    avgEngagementRate: d.totalPosts > 0 ? d.totalEngagementRate / d.totalPosts : 0,
    totalLikes: d.totalLikes,
    totalComments: d.totalComments,
    totalShares: d.totalShares,
    totalSaves: d.totalSaves,
    totalImpressions: d.totalImpressions,
    totalReach: d.totalReach,
    totalClicks: d.totalClicks,
    totalVideoViews: d.totalVideoViews,
  }));

  return NextResponse.json({
    overview: {
      totalPosts: (posts || []).length,
      totalEngagement: totalLikes + totalComments + totalShares,
      totalImpressions,
      avgEngagementRate: postsWithAnalytics > 0 ? totalEngagementRate / postsWithAnalytics : 0,
      totalReach,
      totalClicks,
      totalSaves,
      totalVideoViews,
      totalLikes,
      totalComments,
      totalShares,
    },
    timeSeries,
    topPosts: topPosts.sort((a, b) => b.engagementRate - a.engagementRate).slice(0, 20),
    platformSummary,
    connectedPlatforms,
  });
}
