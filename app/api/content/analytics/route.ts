import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { SocialPlatform } from '@/types/database';

function pctChange(current: number, previous: number): number | null {
  if (previous === 0) return current > 0 ? 100 : null;
  return Math.round(((current - previous) / previous) * 100);
}

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

  // Calculate previous period for comparison
  const fromDate = new Date(dateFrom);
  const toDate = new Date(dateTo);
  const periodLengthMs = toDate.getTime() - fromDate.getTime();
  const prevFrom = new Date(fromDate.getTime() - periodLengthMs - 86400000).toISOString().split('T')[0];
  const prevTo = new Date(fromDate.getTime() - 86400000).toISOString().split('T')[0];

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

  // Previous period posts query
  let prevPostsQuery = supabase
    .from('published_posts')
    .select(`
      id, platform, platform_post_id, post_url, published_at, publish_status,
      content_items!inner (topic, hook, caption, calendar_id),
      post_analytics (likes, comments, shares, saves, impressions, reach, clicks, video_views, engagement_rate, synced_at)
    `)
    .eq('organization_id', orgId)
    .eq('publish_status', 'published')
    .gte('published_at', `${prevFrom}T00:00:00`)
    .lte('published_at', `${prevTo}T23:59:59`);

  if (calendarId && calendarId !== 'all') {
    prevPostsQuery = prevPostsQuery.eq('content_items.calendar_id', calendarId);
  }

  // Also fetch connected platforms for tab rendering
  const connectionsPromise = supabase
    .from('social_media_connections')
    .select('platform')
    .eq('organization_id', orgId)
    .eq('is_active', true);

  // Fetch follower growth data
  const followerPromise = supabase
    .from('social_account_metrics')
    .select('connection_id, metric_date, followers_count, following_count, posts_count, social_media_connections!inner(platform, platform_page_name, platform_username)')
    .eq('organization_id', orgId)
    .gte('metric_date', dateFrom)
    .lte('metric_date', dateTo)
    .order('metric_date', { ascending: true });

  // Run ALL fetches in parallel
  const [
    { data: posts, error },
    { data: prevPosts },
    { data: connections },
    { data: followerData },
  ] = await Promise.all([
    postsQuery,
    prevPostsQuery,
    connectionsPromise,
    followerPromise,
  ]);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Deduplicate connected platforms
  const connectedPlatforms: SocialPlatform[] = Array.from(
    new Set((connections || []).map(c => c.platform as SocialPlatform))
  );

  // --- Aggregate current period ---
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

  // Engagement heatmap data
  const heatmapRaw: Array<{ day: number; hour: number; value: number }> = [];

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

    // Heatmap: day-of-week + hour
    if (post.published_at) {
      const d = new Date(post.published_at);
      const day = d.getDay(); // 0=Sun
      const hour = d.getHours();
      const engagement = likes + comments + shares;
      heatmapRaw.push({ day, hour, value: engagement });
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

  // --- Aggregate previous period ---
  let prevTotalLikes = 0;
  let prevTotalComments = 0;
  let prevTotalShares = 0;
  let prevTotalSaves = 0;
  let prevTotalImpressions = 0;
  let prevTotalReach = 0;
  let prevTotalClicks = 0;
  let prevTotalVideoViews = 0;
  let prevTotalEngagementRate = 0;
  let prevPostsWithAnalytics = 0;

  for (const post of prevPosts || []) {
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

    const likes = analytics?.likes || 0;
    const comments = analytics?.comments || 0;
    const shares = analytics?.shares || 0;
    const saves = analytics?.saves || 0;
    const impressions = analytics?.impressions || 0;
    const reach = analytics?.reach || 0;
    const clicks = analytics?.clicks || 0;
    const videoViews = analytics?.video_views || 0;
    const engRate = analytics?.engagement_rate || 0;

    prevTotalLikes += likes;
    prevTotalComments += comments;
    prevTotalShares += shares;
    prevTotalSaves += saves;
    prevTotalImpressions += impressions;
    prevTotalReach += reach;
    prevTotalClicks += clicks;
    prevTotalVideoViews += videoViews;
    if (engRate > 0) {
      prevTotalEngagementRate += engRate;
      prevPostsWithAnalytics++;
    }
  }

  // Calculated engagement rate for current period
  const engagementRate = totalImpressions > 0
    ? ((totalLikes + totalComments + totalShares) / totalImpressions) * 100
    : 0;

  // Calculated engagement rate for previous period
  const prevEngagementRate = prevTotalImpressions > 0
    ? ((prevTotalLikes + prevTotalComments + prevTotalShares) / prevTotalImpressions) * 100
    : 0;

  const overview = {
    totalPosts: (posts || []).length,
    totalEngagement: totalLikes + totalComments + totalShares,
    totalImpressions,
    avgEngagementRate: postsWithAnalytics > 0 ? totalEngagementRate / postsWithAnalytics : 0,
    engagementRate,
    totalReach,
    totalClicks,
    totalSaves,
    totalVideoViews,
    totalLikes,
    totalComments,
    totalShares,
  };

  const prevOverview = {
    totalPosts: (prevPosts || []).length,
    totalEngagement: prevTotalLikes + prevTotalComments + prevTotalShares,
    totalImpressions: prevTotalImpressions,
    avgEngagementRate: prevPostsWithAnalytics > 0 ? prevTotalEngagementRate / prevPostsWithAnalytics : 0,
    engagementRate: prevEngagementRate,
    totalReach: prevTotalReach,
    totalClicks: prevTotalClicks,
    totalSaves: prevTotalSaves,
    totalVideoViews: prevTotalVideoViews,
    totalLikes: prevTotalLikes,
    totalComments: prevTotalComments,
    totalShares: prevTotalShares,
  };

  const changes = {
    totalPosts: pctChange(overview.totalPosts, prevOverview.totalPosts),
    totalEngagement: pctChange(overview.totalEngagement, prevOverview.totalEngagement),
    totalImpressions: pctChange(overview.totalImpressions, prevOverview.totalImpressions),
    avgEngagementRate: pctChange(overview.avgEngagementRate, prevOverview.avgEngagementRate),
    totalReach: pctChange(overview.totalReach, prevOverview.totalReach),
    totalClicks: pctChange(overview.totalClicks, prevOverview.totalClicks),
    totalSaves: pctChange(overview.totalSaves, prevOverview.totalSaves),
    totalVideoViews: pctChange(overview.totalVideoViews, prevOverview.totalVideoViews),
  };

  // --- Engagement heatmap ---
  const heatmapAgg: Record<string, { total: number; count: number }> = {};
  for (const entry of heatmapRaw) {
    const key = `${entry.day}-${entry.hour}`;
    if (!heatmapAgg[key]) heatmapAgg[key] = { total: 0, count: 0 };
    heatmapAgg[key].total += entry.value;
    heatmapAgg[key].count++;
  }

  const engagementHeatmap = Object.entries(heatmapAgg).map(([key, val]) => {
    const [day, hour] = key.split('-').map(Number);
    return { day, hour, avgEngagement: val.count > 0 ? Math.round(val.total / val.count) : 0 };
  });

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
    overview,
    previousPeriod: prevOverview,
    changes,
    timeSeries,
    topPosts: topPosts.sort((a, b) => b.engagementRate - a.engagementRate).slice(0, 20),
    platformSummary,
    connectedPlatforms,
    followerGrowth: followerData || [],
    engagementHeatmap,
  });
}
