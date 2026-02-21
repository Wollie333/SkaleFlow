import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { publishToConnection } from '@/lib/social/publish';
import type { ConnectionWithTokens } from '@/lib/social/token-manager';
import type { SocialPlatform } from '@/lib/social/types';
import type { Json } from '@/types/database';

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { contentItemId, platforms, connectionIds, retry, retryConnectionId } = body as {
    contentItemId: string;
    platforms?: string[];
    connectionIds?: string[];
    retry?: boolean;
    retryConnectionId?: string;
  };

  if (!contentItemId || (!platforms?.length && !connectionIds?.length && !retry)) {
    return NextResponse.json({ error: 'contentItemId and platforms (or connectionIds) are required' }, { status: 400 });
  }

  // Get user's org
  const { data: membership } = await supabase
    .from('org_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .single();

  if (!membership) {
    return NextResponse.json({ error: 'No organization found' }, { status: 404 });
  }

  // Get content item
  const { data: contentItem, error: itemError } = await supabase
    .from('content_items')
    .select('*')
    .eq('id', contentItemId)
    .eq('organization_id', membership.organization_id)
    .single();

  if (itemError || !contentItem) {
    return NextResponse.json({ error: 'Content item not found' }, { status: 404 });
  }

  // Handle retry of a specific failed publish
  if (retry && retryConnectionId) {
    const { data: failedPost } = await supabase
      .from('published_posts')
      .select('*, social_media_connections!inner(*)')
      .eq('content_item_id', contentItemId)
      .eq('connection_id', retryConnectionId)
      .eq('publish_status', 'failed')
      .single();

    if (!failedPost) {
      return NextResponse.json({ error: 'No failed publish found for this connection' }, { status: 404 });
    }

    // Reset and retry
    await supabase
      .from('published_posts')
      .update({ publish_status: 'publishing', retry_count: 0 })
      .eq('id', failedPost.id);

    const connection = failedPost.social_media_connections as unknown;
    const publishResult = await publishToConnection(
      connection as ConnectionWithTokens,
      { ...contentItem, utm_parameters: (contentItem.utm_parameters || null) as Record<string, string> | null }
    );

    if (publishResult.result.success) {
      await supabase
        .from('published_posts')
        .update({
          publish_status: 'published',
          platform_post_id: publishResult.result.platformPostId || null,
          post_url: publishResult.result.postUrl || null,
          published_at: new Date().toISOString(),
          metadata: (publishResult.result.metadata || {}) as unknown as Json,
          error_message: null,
        })
        .eq('id', failedPost.id);

      return NextResponse.json({ results: [{ platform: failedPost.platform, success: true, postUrl: publishResult.result.postUrl }] });
    } else {
      await supabase
        .from('published_posts')
        .update({
          publish_status: 'failed',
          error_message: publishResult.result.error || 'Retry failed',
          retry_count: (failedPost.retry_count || 0) + 1,
        })
        .eq('id', failedPost.id);

      return NextResponse.json({ results: [{ platform: failedPost.platform, success: false, error: publishResult.result.error }] });
    }
  }

  // Get connections — by specific IDs or by platform
  let connectionsQuery = supabase
    .from('social_media_connections')
    .select('*')
    .eq('organization_id', membership.organization_id)
    .eq('is_active', true);

  if (connectionIds && connectionIds.length > 0) {
    connectionsQuery = connectionsQuery.in('id', connectionIds);
  } else if (platforms && platforms.length > 0) {
    connectionsQuery = connectionsQuery.in('platform', platforms as SocialPlatform[]);
  }

  const { data: allConnections } = await connectionsQuery;

  // Filter out profile connections for Facebook (only use page connections)
  const connections = (allConnections || []).filter(conn => {
    // For Facebook, only use page connections (those with platform_page_id set)
    if (conn.platform === 'facebook') {
      return conn.platform_page_id !== null;
    }
    // For other platforms, include all connections
    return true;
  });

  if (!connections || connections.length === 0) {
    // Provide helpful error message if Facebook was requested but no pages are connected
    if (platforms && platforms.includes('facebook') && allConnections && allConnections.some(c => c.platform === 'facebook')) {
      return NextResponse.json({
        error: 'No Facebook Pages connected. Please add a Facebook Page in your social media connections.'
      }, { status: 400 });
    }
    return NextResponse.json({ error: 'No active connections found for selected platforms' }, { status: 400 });
  }

  const results: Array<{
    platform: string;
    success: boolean;
    postUrl?: string;
    error?: string;
  }> = [];

  for (const connection of connections) {
    // Create published_posts record as 'publishing'
    const { data: publishedPost } = await supabase
      .from('published_posts')
      .insert({
        content_item_id: contentItemId,
        organization_id: membership.organization_id,
        connection_id: connection.id,
        platform: connection.platform as SocialPlatform,
        publish_status: 'publishing',
      })
      .select('id')
      .single();

    if (!publishedPost) {
      results.push({ platform: connection.platform as SocialPlatform, success: false, error: 'Failed to create publish record' });
      continue;
    }

    // Publish
    const publishResult = await publishToConnection(
      connection as unknown as ConnectionWithTokens,
      {
        ...contentItem,
        utm_parameters: (contentItem.utm_parameters || null) as Record<string, string> | null,
      }
    );

    if (publishResult.result.success) {
      // Update to published
      await supabase
        .from('published_posts')
        .update({
          publish_status: 'published',
          platform_post_id: publishResult.result.platformPostId || null,
          post_url: publishResult.result.postUrl || null,
          published_at: new Date().toISOString(),
          metadata: (publishResult.result.metadata || {}) as unknown as Json,
        })
        .eq('id', publishedPost.id);

      results.push({
        platform: connection.platform,
        success: true,
        postUrl: publishResult.result.postUrl,
      });
    } else {
      // Update to failed
      await supabase
        .from('published_posts')
        .update({
          publish_status: 'failed',
          error_message: publishResult.result.error || 'Unknown error',
          retry_count: 0,
        })
        .eq('id', publishedPost.id);

      results.push({
        platform: connection.platform,
        success: false,
        error: publishResult.result.error,
      });
    }
  }

  // If at least one platform succeeded, update content item status
  const anySuccess = results.some(r => r.success);
  if (anySuccess) {
    await supabase
      .from('content_items')
      .update({
        status: 'published',
        published_at: new Date().toISOString(),
      })
      .eq('id', contentItemId);
  }

  return NextResponse.json({ results });
}
