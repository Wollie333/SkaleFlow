import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const supabase = createClient();

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

  const searchParams = request.nextUrl.searchParams;
  const dateFrom = searchParams.get('dateFrom') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const dateTo = searchParams.get('dateTo') || new Date().toISOString().split('T')[0];
  const platformFilter = searchParams.get('platform');
  const calendarId = searchParams.get('calendarId');

  // Get published posts with their latest analytics
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
    .eq('organization_id', membership.organization_id)
    .eq('publish_status', 'published')
    .gte('published_at', `${dateFrom}T00:00:00`)
    .lte('published_at', `${dateTo}T23:59:59`)
    .order('published_at', { ascending: false });

  if (platformFilter && platformFilter !== 'all') {
    postsQuery = postsQuery.eq('platform', platformFilter as 'linkedin' | 'facebook' | 'instagram' | 'twitter' | 'tiktok');
  }

  if (calendarId && calendarId !== 'all') {
    postsQuery = postsQuery.eq('content_items.calendar_id', calendarId);
  }

  const { data: posts, error } = await postsQuery;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Process data
  let totalLikes = 0;
  let totalComments = 0;
  let totalShares = 0;
  let totalImpressions = 0;
  let totalEngagementRate = 0;
  let postsWithAnalytics = 0;

  // Time series data
  const dailyData: Record<string, { engagement: number; impressions: number }> = {};

  // Platform breakdown
  const platformData: Record<string, {
    totalPosts: number;
    totalLikes: number;
    totalComments: number;
    totalShares: number;
    totalImpressions: number;
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
    impressions: number;
    engagementRate: number;
  }> = [];

  for (const post of posts || []) {
    // Get latest analytics for this post
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
    const impressions = analytics?.impressions || 0;
    const engRate = analytics?.engagement_rate || 0;

    totalLikes += likes;
    totalComments += comments;
    totalShares += shares;
    totalImpressions += impressions;
    if (engRate > 0) {
      totalEngagementRate += engRate;
      postsWithAnalytics++;
    }

    // Daily time series
    const date = post.published_at ? post.published_at.split('T')[0] : '';
    if (date) {
      if (!dailyData[date]) dailyData[date] = { engagement: 0, impressions: 0 };
      dailyData[date].engagement += likes + comments + shares;
      dailyData[date].impressions += impressions;
    }

    // Platform breakdown
    if (!platformData[post.platform]) {
      platformData[post.platform] = {
        totalPosts: 0, totalLikes: 0, totalComments: 0,
        totalShares: 0, totalImpressions: 0, totalEngagementRate: 0,
      };
    }
    const pd = platformData[post.platform];
    pd.totalPosts++;
    pd.totalLikes += likes;
    pd.totalComments += comments;
    pd.totalShares += shares;
    pd.totalImpressions += impressions;
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
      impressions,
      engagementRate: engRate,
    });
  }

  // Build time series array sorted by date
  const timeSeries = Object.entries(dailyData)
    .map(([date, data]) => ({ date, ...data }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Build platform summary
  const platformSummary = Object.entries(platformData).map(([platform, data]) => ({
    platform,
    totalPosts: data.totalPosts,
    avgEngagementRate: data.totalPosts > 0 ? data.totalEngagementRate / data.totalPosts : 0,
    totalLikes: data.totalLikes,
    totalComments: data.totalComments,
    totalShares: data.totalShares,
    totalImpressions: data.totalImpressions,
  }));

  return NextResponse.json({
    overview: {
      totalPosts: (posts || []).length,
      totalEngagement: totalLikes + totalComments + totalShares,
      totalImpressions,
      avgEngagementRate: postsWithAnalytics > 0 ? totalEngagementRate / postsWithAnalytics : 0,
    },
    timeSeries,
    topPosts: topPosts.sort((a, b) => b.engagementRate - a.engagementRate).slice(0, 20),
    platformSummary,
  });
}
