import { NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { publishToConnection } from '@/lib/social/publish';
import type { ConnectionWithTokens } from '@/lib/social/token-manager';
import type { SocialPlatform } from '@/lib/social/types';
import type { Json } from '@/types/database';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const MAX_RETRIES = 3;
const DEFAULT_TZ_OFFSET = '+02:00';

/**
 * Lightweight publish check — called by the dashboard while a user is active.
 * Only publishes items for the authenticated user's organization.
 */
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get user's org
  const serviceClient = createServiceClient();
  const { data: userRow } = await serviceClient
    .from('users')
    .select('organization_id')
    .eq('id', user.id)
    .single();

  if (!userRow?.organization_id) {
    return NextResponse.json({ published: 0 });
  }

  const orgId = userRow.organization_id;
  const now = new Date();
  const todayDate = now.toISOString().split('T')[0];

  // Find scheduled items for this org that are due
  const { data: scheduledItems, error } = await serviceClient
    .from('content_items')
    .select('*, organization_id')
    .eq('status', 'scheduled')
    .eq('organization_id', orgId)
    .lte('scheduled_date', todayDate);

  if (error || !scheduledItems || scheduledItems.length === 0) {
    return NextResponse.json({ published: 0 });
  }

  // Filter items where scheduled datetime (SA time) has passed
  const readyItems = scheduledItems.filter(item => {
    const timeStr = item.scheduled_time || '00:00:00';
    const scheduledDate = new Date(`${item.scheduled_date}T${timeStr}${DEFAULT_TZ_OFFSET}`);
    return scheduledDate <= now;
  });

  if (readyItems.length === 0) {
    return NextResponse.json({ published: 0 });
  }

  let publishedCount = 0;

  for (const item of readyItems) {
    const { data: connections } = await serviceClient
      .from('social_media_connections')
      .select('*')
      .eq('organization_id', orgId)
      .eq('is_active', true);

    if (!connections || connections.length === 0) continue;

    const targetPlatforms = item.platforms && item.platforms.length > 0
      ? connections.filter(c => item.platforms.includes(c.platform))
      : connections;

    for (const connection of targetPlatforms) {
      const { data: existing } = await serviceClient
        .from('published_posts')
        .select('id, publish_status, retry_count')
        .eq('content_item_id', item.id)
        .eq('connection_id', connection.id)
        .single();

      if (existing?.publish_status === 'published') continue;
      if (existing && existing.retry_count >= MAX_RETRIES) continue;

      const publishedPostId = existing?.id;

      if (!publishedPostId) {
        const { data: newPost } = await serviceClient
          .from('published_posts')
          .insert({
            content_item_id: item.id,
            organization_id: orgId,
            connection_id: connection.id,
            platform: connection.platform as SocialPlatform,
            publish_status: 'publishing',
          })
          .select('id')
          .single();

        if (!newPost) continue;

        try {
          const result = await publishToConnection(
            connection as unknown as ConnectionWithTokens,
            { ...item, utm_parameters: (item.utm_parameters || null) as Record<string, string> | null }
          );

          if (result.result.success) {
            await serviceClient.from('published_posts').update({
              publish_status: 'published',
              platform_post_id: result.result.platformPostId || null,
              post_url: result.result.postUrl || null,
              published_at: new Date().toISOString(),
              metadata: (result.result.metadata || {}) as unknown as Json,
            }).eq('id', newPost.id);
            publishedCount++;
          } else {
            await serviceClient.from('published_posts').update({
              publish_status: 'failed',
              error_message: result.result.error || 'Unknown error',
              retry_count: 1,
            }).eq('id', newPost.id);
          }
        } catch (err) {
          await serviceClient.from('published_posts').update({
            publish_status: 'failed',
            error_message: err instanceof Error ? err.message : 'Unknown error',
            retry_count: 1,
          }).eq('id', newPost.id);
        }
      } else {
        // Retry failed post
        await serviceClient.from('published_posts').update({ publish_status: 'publishing' }).eq('id', publishedPostId);

        try {
          const result = await publishToConnection(
            connection as unknown as ConnectionWithTokens,
            { ...item, utm_parameters: (item.utm_parameters || null) as Record<string, string> | null }
          );

          if (result.result.success) {
            await serviceClient.from('published_posts').update({
              publish_status: 'published',
              platform_post_id: result.result.platformPostId || null,
              post_url: result.result.postUrl || null,
              published_at: new Date().toISOString(),
              metadata: (result.result.metadata || {}) as unknown as Json,
            }).eq('id', publishedPostId);
            publishedCount++;
          } else {
            await serviceClient.from('published_posts').update({
              publish_status: 'failed',
              error_message: result.result.error || 'Unknown error',
              retry_count: (existing.retry_count || 0) + 1,
            }).eq('id', publishedPostId);
          }
        } catch (err) {
          await serviceClient.from('published_posts').update({
            publish_status: 'failed',
            error_message: err instanceof Error ? err.message : 'Unknown error',
            retry_count: (existing.retry_count || 0) + 1,
          }).eq('id', publishedPostId);
        }
      }
    }

    // Update content item status
    const { data: publishedPosts } = await serviceClient
      .from('published_posts')
      .select('publish_status')
      .eq('content_item_id', item.id)
      .eq('publish_status', 'published');

    if (publishedPosts && publishedPosts.length > 0) {
      await serviceClient.from('content_items').update({
        status: 'published',
        published_at: new Date().toISOString(),
      }).eq('id', item.id);
    }
  }

  return NextResponse.json({ published: publishedCount });
}
