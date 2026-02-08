import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { fetchPostAnalytics } from '@/lib/social/analytics';
import type { ConnectionWithTokens } from '@/lib/social/token-manager';
import type { Json } from '@/types/database';

export async function POST(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createServiceClient();

  // Get published posts from last 30 days that have platform_post_ids
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const { data: publishedPosts, error } = await supabase
    .from('published_posts')
    .select('id, platform, platform_post_id, connection_id, organization_id')
    .eq('publish_status', 'published')
    .not('platform_post_id', 'is', null)
    .gte('published_at', thirtyDaysAgo);

  if (error || !publishedPosts) {
    return NextResponse.json({ error: 'Failed to fetch published posts', details: error?.message }, { status: 500 });
  }

  let synced = 0;
  let failed = 0;

  // Group by connection to minimize token refreshes
  const byConnection: Record<string, typeof publishedPosts> = {};
  for (const post of publishedPosts) {
    if (!byConnection[post.connection_id]) {
      byConnection[post.connection_id] = [];
    }
    byConnection[post.connection_id].push(post);
  }

  for (const [connectionId, posts] of Object.entries(byConnection)) {
    // Get connection details
    const { data: connection } = await supabase
      .from('social_media_connections')
      .select('*')
      .eq('id', connectionId)
      .eq('is_active', true)
      .single();

    if (!connection) continue;

    for (const post of posts) {
      try {
        const result = await fetchPostAnalytics(
          connection as unknown as ConnectionWithTokens,
          post.platform_post_id!
        );

        if (result.data) {
          await supabase
            .from('post_analytics')
            .insert({
              published_post_id: post.id,
              likes: result.data.likes,
              comments: result.data.comments,
              shares: result.data.shares,
              saves: result.data.saves,
              impressions: result.data.impressions,
              reach: result.data.reach,
              clicks: result.data.clicks,
              video_views: result.data.videoViews,
              engagement_rate: result.data.engagementRate,
              metadata: (result.data.metadata || {}) as unknown as Json,
            });
          synced++;
        } else {
          failed++;
        }
      } catch {
        failed++;
      }
    }
  }

  return NextResponse.json({
    message: 'Analytics sync complete',
    postsProcessed: publishedPosts.length,
    synced,
    failed,
  });
}
