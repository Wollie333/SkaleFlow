import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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

  const searchParams = request.nextUrl.searchParams;
  const format = searchParams.get('format') || 'csv';
  const dateFrom = searchParams.get('dateFrom') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const dateTo = searchParams.get('dateTo') || new Date().toISOString().split('T')[0];

  const { data: posts, error } = await supabase
    .from('published_posts')
    .select(`
      id, platform, platform_post_id, post_url, published_at, publish_status,
      content_items!inner (topic, hook, caption),
      post_analytics (likes, comments, shares, saves, impressions, reach, clicks, video_views, engagement_rate, synced_at)
    `)
    .eq('organization_id', membership.organization_id)
    .eq('publish_status', 'published')
    .gte('published_at', `${dateFrom}T00:00:00`)
    .lte('published_at', `${dateTo}T23:59:59`)
    .order('published_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = (posts || []).map(post => {
    const content = post.content_items as unknown as { topic: string | null; hook: string | null; caption: string | null };
    const analytics = (post.post_analytics as Array<Record<string, unknown>>)?.[0] || {};
    return {
      platform: post.platform,
      topic: content?.topic || '',
      hook: content?.hook || '',
      published_at: post.published_at || '',
      post_url: post.post_url || '',
      likes: (analytics.likes as number) || 0,
      comments: (analytics.comments as number) || 0,
      shares: (analytics.shares as number) || 0,
      saves: (analytics.saves as number) || 0,
      impressions: (analytics.impressions as number) || 0,
      reach: (analytics.reach as number) || 0,
      clicks: (analytics.clicks as number) || 0,
      video_views: (analytics.video_views as number) || 0,
      engagement_rate: (analytics.engagement_rate as number) || 0,
    };
  });

  if (format === 'json') {
    return NextResponse.json({ data: rows, dateRange: { from: dateFrom, to: dateTo } });
  }

  // CSV format
  const headers = ['Platform', 'Topic', 'Hook', 'Published At', 'Post URL', 'Likes', 'Comments', 'Shares', 'Saves', 'Impressions', 'Reach', 'Clicks', 'Video Views', 'Engagement Rate'];
  const csvRows = [headers.join(',')];
  for (const row of rows) {
    csvRows.push([
      row.platform,
      `"${(row.topic || '').replace(/"/g, '""')}"`,
      `"${(row.hook || '').replace(/"/g, '""')}"`,
      row.published_at,
      row.post_url,
      row.likes,
      row.comments,
      row.shares,
      row.saves,
      row.impressions,
      row.reach,
      row.clicks,
      row.video_views,
      row.engagement_rate,
    ].join(','));
  }

  return new NextResponse(csvRows.join('\n'), {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="analytics-${dateFrom}-to-${dateTo}.csv"`,
    },
  });
}
