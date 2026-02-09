import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { publishToConnection } from '@/lib/social/publish';
import type { ConnectionWithTokens } from '@/lib/social/token-manager';
import type { SocialPlatform } from '@/lib/social/types';
import type { Json } from '@/types/database';

const MAX_RETRIES = 3;

async function runScheduledPublish() {
  const supabase = createServiceClient();
  const now = new Date().toISOString();

  // Find scheduled content items that are ready to publish
  const { data: scheduledItems, error } = await supabase
    .from('content_items')
    .select('*, organization_id')
    .eq('status', 'scheduled')
    .lte('scheduled_date', now.split('T')[0]); // scheduled_date <= today

  if (error || !scheduledItems || scheduledItems.length === 0) {
    return { message: 'No items to publish', itemsProcessed: 0, publishedCount: 0, failedCount: 0 };
  }

  // Filter items where scheduled_date + scheduled_time <= now
  const readyItems = scheduledItems.filter(item => {
    const scheduledDateTime = item.scheduled_time
      ? `${item.scheduled_date}T${item.scheduled_time}`
      : `${item.scheduled_date}T00:00:00`;
    return new Date(scheduledDateTime) <= new Date(now);
  });

  let publishedCount = 0;
  let failedCount = 0;

  for (const item of readyItems) {
    // Get all active connections for this org
    const { data: connections } = await supabase
      .from('social_media_connections')
      .select('*')
      .eq('organization_id', item.organization_id)
      .eq('is_active', true);

    if (!connections || connections.length === 0) continue;

    // Check for any platform preferences on the item
    const targetPlatforms = item.platforms && item.platforms.length > 0
      ? connections.filter(c => item.platforms.includes(c.platform))
      : connections;

    for (const connection of targetPlatforms) {
      // Check if already published via this connection
      const { data: existing } = await supabase
        .from('published_posts')
        .select('id, publish_status, retry_count')
        .eq('content_item_id', item.id)
        .eq('connection_id', connection.id)
        .single();

      // Skip if already published successfully
      if (existing?.publish_status === 'published') continue;

      // Skip if max retries exceeded
      if (existing && existing.retry_count >= MAX_RETRIES) continue;

      const publishedPostId = existing?.id;

      // Create or update published_posts record
      if (!publishedPostId) {
        const { data: newPost } = await supabase
          .from('published_posts')
          .insert({
            content_item_id: item.id,
            organization_id: item.organization_id,
            connection_id: connection.id,
            platform: connection.platform as SocialPlatform,
            publish_status: 'publishing',
          })
          .select('id')
          .single();

        if (!newPost) continue;

        const itemForPublish = {
          ...item,
          utm_parameters: (item.utm_parameters || null) as Record<string, string> | null,
        };

        const result = await publishToConnection(
          connection as unknown as ConnectionWithTokens,
          itemForPublish
        );

        if (result.result.success) {
          await supabase
            .from('published_posts')
            .update({
              publish_status: 'published',
              platform_post_id: result.result.platformPostId || null,
              post_url: result.result.postUrl || null,
              published_at: new Date().toISOString(),
              metadata: (result.result.metadata || {}) as unknown as Json,
            })
            .eq('id', newPost.id);
          publishedCount++;
        } else {
          console.error(`[Scheduled Publish] Failed for item ${item.id} on ${connection.platform}:`, result.result.error);
          await supabase
            .from('published_posts')
            .update({
              publish_status: 'failed',
              error_message: result.result.error || 'Unknown error',
              retry_count: 1,
            })
            .eq('id', newPost.id);
          failedCount++;
        }
      } else {
        // Retry existing failed post
        await supabase
          .from('published_posts')
          .update({ publish_status: 'publishing' })
          .eq('id', publishedPostId);

        const retryItemForPublish = {
          ...item,
          utm_parameters: (item.utm_parameters || null) as Record<string, string> | null,
        };

        const result = await publishToConnection(
          connection as unknown as ConnectionWithTokens,
          retryItemForPublish
        );

        if (result.result.success) {
          await supabase
            .from('published_posts')
            .update({
              publish_status: 'published',
              platform_post_id: result.result.platformPostId || null,
              post_url: result.result.postUrl || null,
              published_at: new Date().toISOString(),
              metadata: (result.result.metadata || {}) as unknown as Json,
            })
            .eq('id', publishedPostId);
          publishedCount++;
        } else {
          console.error(`[Scheduled Publish] Retry failed for item ${item.id} on ${connection.platform}:`, result.result.error);
          await supabase
            .from('published_posts')
            .update({
              publish_status: 'failed',
              error_message: result.result.error || 'Unknown error',
              retry_count: (existing.retry_count || 0) + 1,
            })
            .eq('id', publishedPostId);
          failedCount++;
        }
      }
    }

    // Update content item status if at least one platform published
    const { data: publishedPosts } = await supabase
      .from('published_posts')
      .select('publish_status')
      .eq('content_item_id', item.id)
      .eq('publish_status', 'published');

    if (publishedPosts && publishedPosts.length > 0) {
      await supabase
        .from('content_items')
        .update({
          status: 'published',
          published_at: new Date().toISOString(),
        })
        .eq('id', item.id);
    }
  }

  return {
    message: 'Scheduled publish complete',
    itemsProcessed: readyItems.length,
    publishedCount,
    failedCount,
  };
}

// Vercel crons send GET requests
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const result = await runScheduledPublish();
  return NextResponse.json(result);
}

// Keep POST for backward compatibility
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const result = await runScheduledPublish();
  return NextResponse.json(result);
}
