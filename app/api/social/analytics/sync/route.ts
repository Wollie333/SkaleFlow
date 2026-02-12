import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { fetchPostAnalytics } from '@/lib/social/analytics';
import type { ConnectionWithTokens } from '@/lib/social/token-manager';
import type { Json } from '@/types/database';

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  // Authenticate user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get user's organization
  const { data: membership } = await supabase
    .from('org_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .single();

  if (!membership?.organization_id) {
    return NextResponse.json({ error: 'No organization found' }, { status: 404 });
  }

  const organizationId = membership.organization_id;

  // Get published posts from last 90 days for this organization
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();

  const { data: publishedPosts, error } = await supabase
    .from('published_posts')
    .select('id, platform, platform_post_id, connection_id')
    .eq('organization_id', organizationId)
    .eq('publish_status', 'published')
    .not('platform_post_id', 'is', null)
    .gte('published_at', ninetyDaysAgo);

  if (error || !publishedPosts) {
    return NextResponse.json({ error: 'Failed to fetch published posts', details: error?.message }, { status: 500 });
  }

  if (publishedPosts.length === 0) {
    return NextResponse.json({ message: 'No published posts found to sync', synced: 0, failed: 0 });
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
            .upsert({
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
              synced_at: new Date().toISOString(),
            }, {
              onConflict: 'published_post_id',
            });
          synced++;
        } else {
          failed++;
        }
      } catch (err) {
        console.error(`Failed to fetch analytics for post ${post.id}:`, err);
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
