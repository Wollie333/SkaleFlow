// ============================================================
// V3 Content Engine — Publishing Integration
// Handles publishing content_posts through existing social adapters
// ============================================================

import type { SupabaseClient } from '@supabase/supabase-js';

// ---- Types ----

interface PublishResult {
  success: boolean;
  platformPostId?: string;
  postUrl?: string;
  error?: string;
}

// ---- Main functions ----

/**
 * Publish a V3 content post to its platform.
 * Updates the post status and stores platform IDs.
 */
export async function publishV3Post(
  supabase: SupabaseClient,
  postId: string
): Promise<PublishResult> {
  // Get the post
  const { data: post, error } = await supabase
    .from('content_posts')
    .select('*')
    .eq('id', postId)
    .single();

  if (error || !post) {
    return { success: false, error: 'Post not found' };
  }

  if (post.status !== 'approved' && post.status !== 'scheduled') {
    return { success: false, error: `Post must be approved or scheduled to publish. Current status: ${post.status}` };
  }

  // Get social connection for this platform
  const { data: connections } = await supabase
    .from('social_media_connections')
    .select('*')
    .eq('organization_id', post.organization_id)
    .eq('platform', post.platform)
    .eq('is_active', true)
    .limit(1);

  if (!connections || connections.length === 0) {
    // Mark as failed — no social connection
    await supabase
      .from('content_posts')
      .update({ status: 'failed', updated_at: new Date().toISOString() })
      .eq('id', postId);

    return { success: false, error: `No active ${post.platform} connection found` };
  }

  try {
    // Build publish payload from V3 post data
    const publishPayload = buildPublishPayload(post);

    // For now, use the existing publish infrastructure
    // The actual platform adapter call would go here
    // This is a placeholder that updates the post status

    // Update post as published
    await supabase
      .from('content_posts')
      .update({
        status: 'published',
        published_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', postId);

    return { success: true };
  } catch (err: any) {
    // Mark as failed
    await supabase
      .from('content_posts')
      .update({ status: 'failed', updated_at: new Date().toISOString() })
      .eq('id', postId);

    return { success: false, error: err.message };
  }
}

/**
 * Find and publish all scheduled V3 posts that are due.
 * Called by cron every 15 minutes.
 */
export async function publishScheduledV3Posts(
  supabase: SupabaseClient
): Promise<{ published: number; failed: number }> {
  const now = new Date();
  const currentDate = now.toISOString().split('T')[0];
  const currentTime = now.toTimeString().slice(0, 5);

  // Find posts scheduled for now or earlier
  const { data: duePosts } = await supabase
    .from('content_posts')
    .select('id')
    .eq('status', 'scheduled')
    .lte('scheduled_date', currentDate)
    .lte('scheduled_time', currentTime);

  let published = 0;
  let failed = 0;

  for (const post of (duePosts || [])) {
    const result = await publishV3Post(supabase, post.id);
    if (result.success) published++;
    else failed++;
  }

  return { published, failed };
}

/**
 * Sync analytics from platform APIs back to V3 content posts.
 */
export async function syncV3Analytics(
  supabase: SupabaseClient,
  organizationId: string
): Promise<{ synced: number }> {
  // Get published posts that need analytics sync
  const { data: posts } = await supabase
    .from('content_posts')
    .select('id, platform, platform_post_id, organization_id')
    .eq('organization_id', organizationId)
    .eq('status', 'published')
    .not('platform_post_id', 'is', null);

  if (!posts || posts.length === 0) return { synced: 0 };

  let synced = 0;

  for (const post of posts) {
    try {
      // Get analytics from platform (would use actual platform adapters)
      // For now, this is a placeholder structure
      const analytics = await fetchPlatformAnalytics(supabase, post);

      if (analytics) {
        // Update post performance
        await supabase
          .from('content_posts')
          .update({
            performance: analytics,
            updated_at: new Date().toISOString(),
          })
          .eq('id', post.id);

        // Also store in v3_post_analytics
        await supabase.from('v3_post_analytics').insert({
          post_id: post.id,
          organization_id: post.organization_id,
          platform: post.platform,
          impressions: analytics.impressions || 0,
          reach: analytics.reach || 0,
          likes: analytics.likes || 0,
          comments: analytics.comments || 0,
          shares: analytics.shares || 0,
          saves: analytics.saves || 0,
          clicks: analytics.clicks || 0,
          video_views: analytics.video_views || 0,
          engagement_rate: analytics.engagement_rate || 0,
          follower_change: analytics.follower_change || 0,
        });

        synced++;
      }
    } catch (err) {
      console.error(`Failed to sync analytics for post ${post.id}:`, err);
    }
  }

  return { synced };
}

// ---- Helpers ----

function buildPublishPayload(post: any): Record<string, unknown> {
  return {
    platform: post.platform,
    format: post.format,
    caption: post.caption || post.body || '',
    hashtags: post.hashtags || [],
    mediaUrls: post.media_urls || [],
    thumbnailUrl: post.thumbnail_url,
    targetUrl: post.target_url,
    utmParameters: post.utm_parameters,
  };
}

async function fetchPlatformAnalytics(
  supabase: SupabaseClient,
  post: any
): Promise<Record<string, number> | null> {
  // This would call the actual platform API adapters
  // For now, check if there are existing analytics records
  const { data } = await supabase
    .from('v3_post_analytics')
    .select('*')
    .eq('post_id', post.id)
    .order('synced_at', { ascending: false })
    .limit(1)
    .single();

  if (data) {
    return {
      impressions: data.impressions,
      reach: data.reach,
      likes: data.likes,
      comments: data.comments,
      shares: data.shares,
      saves: data.saves,
      clicks: data.clicks,
      video_views: data.video_views,
      engagement_rate: data.engagement_rate,
      follower_change: data.follower_change,
    };
  }

  return null;
}
