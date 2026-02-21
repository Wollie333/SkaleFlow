import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { publishToConnection } from '@/lib/social/publish';
import type { ConnectionWithTokens } from '@/lib/social/token-manager';
import type { SocialPlatform } from '@/lib/social/types';
import type { Json } from '@/types/database';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const MAX_RETRIES = 3;

// Default timezone offset for South Africa (UTC+2)
const DEFAULT_TZ_OFFSET = '+02:00';

async function runScheduledPublish() {
  const supabase = createServiceClient();
  const now = new Date();
  const nowISO = now.toISOString();
  const todayDate = nowISO.split('T')[0]; // YYYY-MM-DD in UTC

  console.log(`[Scheduled Publish] Running at ${nowISO}`);

  // Find scheduled content items where scheduled_date <= today
  // We use lte with today to catch items from today and earlier
  const { data: scheduledItems, error } = await supabase
    .from('content_items')
    .select('*, organization_id')
    .eq('status', 'scheduled')
    .lte('scheduled_date', todayDate);

  if (error) {
    console.error('[Scheduled Publish] DB query failed:', error.message);
    return { message: `Query failed: ${error.message}`, itemsProcessed: 0, publishedCount: 0, failedCount: 0 };
  }

  if (!scheduledItems || scheduledItems.length === 0) {
    console.log('[Scheduled Publish] No scheduled items found');
    return { message: 'No items to publish', itemsProcessed: 0, publishedCount: 0, failedCount: 0 };
  }

  console.log(`[Scheduled Publish] Found ${scheduledItems.length} candidate items`);

  // Filter items where scheduled datetime (in SA time) has passed
  const readyItems = scheduledItems.filter(item => {
    // Build a timezone-aware datetime string
    // scheduled_time is stored as HH:MM:SS in user's local time (SA = UTC+2)
    const timeStr = item.scheduled_time || '00:00:00';
    const scheduledDateTimeStr = `${item.scheduled_date}T${timeStr}${DEFAULT_TZ_OFFSET}`;
    const scheduledDate = new Date(scheduledDateTimeStr);

    const isReady = scheduledDate <= now;
    if (!isReady) {
      console.log(`[Scheduled Publish] Item ${item.id} not ready yet (scheduled: ${scheduledDateTimeStr}, now: ${nowISO})`);
    }
    return isReady;
  });

  if (readyItems.length === 0) {
    console.log('[Scheduled Publish] No items ready to publish yet');
    return { message: 'No items ready yet', itemsProcessed: 0, publishedCount: 0, failedCount: 0 };
  }

  console.log(`[Scheduled Publish] ${readyItems.length} items ready to publish`);

  let publishedCount = 0;
  let failedCount = 0;

  for (const item of readyItems) {
    // Get all active connections for this org
    const { data: connections } = await supabase
      .from('social_media_connections')
      .select('*')
      .eq('organization_id', item.organization_id)
      .eq('is_active', true);

    if (!connections || connections.length === 0) {
      console.log(`[Scheduled Publish] No active connections for org ${item.organization_id}, skipping item ${item.id}`);
      continue;
    }

    // Check for any platform preferences on the item
    const targetPlatforms = item.platforms && item.platforms.length > 0
      ? connections.filter(c => item.platforms.includes(c.platform))
      : connections;

    if (targetPlatforms.length === 0) {
      console.log(`[Scheduled Publish] No matching platform connections for item ${item.id}`);
      continue;
    }

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
      if (existing && existing.retry_count >= MAX_RETRIES) {
        console.log(`[Scheduled Publish] Max retries exceeded for item ${item.id} on ${connection.platform}`);
        continue;
      }

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

        try {
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
            console.log(`[Scheduled Publish] Published item ${item.id} to ${connection.platform}`);
          } else {
            console.error(`[Scheduled Publish] Failed item ${item.id} on ${connection.platform}:`, result.result.error);
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
        } catch (err) {
          console.error(`[Scheduled Publish] Exception publishing item ${item.id} on ${connection.platform}:`, err);
          await supabase
            .from('published_posts')
            .update({
              publish_status: 'failed',
              error_message: err instanceof Error ? err.message : 'Unknown exception',
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

        try {
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
            console.log(`[Scheduled Publish] Retry succeeded for item ${item.id} on ${connection.platform}`);
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
        } catch (err) {
          console.error(`[Scheduled Publish] Retry exception for item ${item.id} on ${connection.platform}:`, err);
          await supabase
            .from('published_posts')
            .update({
              publish_status: 'failed',
              error_message: err instanceof Error ? err.message : 'Unknown exception',
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

  const summary = {
    message: 'Scheduled publish complete',
    itemsProcessed: readyItems.length,
    publishedCount,
    failedCount,
  };
  console.log('[Scheduled Publish] Done:', JSON.stringify(summary));
  return summary;
}

// Accept auth via header (Vercel cron) OR query param (external cron services)
function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  // Vercel cron sends Bearer token
  const authHeader = request.headers.get('authorization');
  if (authHeader === `Bearer ${secret}`) return true;
  // External cron services can use ?key= query param
  const keyParam = request.nextUrl.searchParams.get('key');
  if (keyParam === secret) return true;
  return false;
}

// Vercel crons send GET requests
export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    const hasSecret = !!process.env.CRON_SECRET;
    const keyParam = request.nextUrl.searchParams.get('key');
    return NextResponse.json({
      error: 'Unauthorized',
      debug: {
        envVarSet: hasSecret,
        keyParamReceived: !!keyParam,
        keyLength: keyParam?.length || 0,
        secretLength: process.env.CRON_SECRET?.length || 0,
      }
    }, { status: 401 });
  }

  const result = await runScheduledPublish();
  return NextResponse.json(result);
}

// Keep POST for backward compatibility
export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const result = await runScheduledPublish();
  return NextResponse.json(result);
}
