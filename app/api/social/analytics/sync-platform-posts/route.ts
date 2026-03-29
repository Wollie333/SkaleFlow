import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { fetchPagePosts as fetchFacebookPosts } from '@/lib/social/platforms/history/facebook';
import { fetchInstagramPosts } from '@/lib/social/platforms/history/instagram';
import { fetchLinkedInPosts } from '@/lib/social/platforms/history/linkedin';
import type { ConnectionWithTokens } from '@/lib/social/token-manager';
import { ensureValidToken } from '@/lib/social/token-manager';

// Allow up to 60s for this route
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: membership } = await supabase
    .from('org_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .single();

  if (!membership?.organization_id) {
    return NextResponse.json({ error: 'No organization found' }, { status: 404 });
  }

  const organizationId = membership.organization_id;

  const { data: connections } = await supabase
    .from('social_media_connections')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('is_active', true);

  if (!connections || connections.length === 0) {
    return NextResponse.json({ message: 'No active social media connections found', synced: 0 });
  }

  console.log(`[sync-platform-posts] Active connections: ${connections.map(c => `${c.platform}(type=${c.account_type})`).join(', ')}`);

  let totalSynced = 0;
  let totalErrors = 0;
  const errors: Array<{ platform: string; error: string }> = [];

  // Process each connection
  for (const connection of connections) {
    try {
      const tokens = await ensureValidToken(connection as unknown as ConnectionWithTokens);
      const limit = 100; // Fetch up to 100 posts per platform

      let posts: any[] = [];

      switch (connection.platform) {
        case 'facebook':
          posts = await fetchFacebookPosts(tokens, limit);
          break;
        case 'instagram':
          posts = await fetchInstagramPosts(tokens, limit);
          break;
        case 'linkedin':
          posts = await fetchLinkedInPosts(tokens, limit);
          break;
        default:
          console.log(`[sync-platform-posts] Unsupported platform: ${connection.platform}`);
          continue;
      }

      console.log(`[sync-platform-posts] Fetched ${posts.length} posts from ${connection.platform}`);

      // Upsert posts into platform_posts table
      for (const post of posts) {
        const platformPost = {
          organization_id: organizationId,
          connection_id: connection.id,
          platform: connection.platform,
          platform_post_id: post.postId,
          platform_post_url: post.permalink || null,
          message: post.message || null,
          caption: post.message || null,
          media_url: post.imageUrl || null,
          media_type: post.imageUrl ? 'image' : null,
          created_at_platform: post.createdAt,
          author_name: connection.platform_username || connection.platform_page_name || null,
          is_skaleflow_post: false, // Default to false, will be updated if matched
          likes: post.likes || 0,
          comments: post.comments || 0,
          shares: post.shares || 0,
          saves: 0, // Not available from most platforms
          impressions: post.impressions || 0,
          reach: post.reach || 0,
          clicks: 0, // Not available from most platforms
          video_views: 0, // Not available in current implementation
          engagement_rate: post.engagementRate || 0,
          last_synced_at: new Date().toISOString(),
        };

        // Upsert (insert or update if exists)
        const { error: upsertError } = await supabase
          .from('platform_posts')
          .upsert(platformPost, {
            onConflict: 'platform,platform_post_id,organization_id',
            ignoreDuplicates: false,
          });

        if (upsertError) {
          console.error(`[sync-platform-posts] Error upserting post ${post.postId}:`, upsertError);
          totalErrors++;
        } else {
          totalSynced++;
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[sync-platform-posts] ${connection.platform} sync failed:`, errorMessage);
      errors.push({ platform: connection.platform, error: errorMessage });
      totalErrors++;
    }
  }

  // Try to match SkaleFlow posts with platform posts
  try {
    // Find published posts from SkaleFlow that have platform_post_id
    const { data: publishedPosts } = await supabase
      .from('published_posts')
      .select('platform_post_id, platform')
      .eq('organization_id', organizationId)
      .not('platform_post_id', 'is', null);

    if (publishedPosts && publishedPosts.length > 0) {
      // Update platform_posts to mark SkaleFlow-created posts
      for (const pp of publishedPosts) {
        await supabase
          .from('platform_posts')
          .update({ is_skaleflow_post: true })
          .eq('organization_id', organizationId)
          .eq('platform', pp.platform)
          .eq('platform_post_id', pp.platform_post_id);
      }
    }
  } catch (matchError) {
    console.error('[sync-platform-posts] Error matching SkaleFlow posts:', matchError);
  }

  return NextResponse.json({
    message: `Synced ${totalSynced} posts from ${connections.length} platform(s)`,
    totalSynced,
    totalErrors,
    connectionsProcessed: connections.length,
    errors: errors.length > 0 ? errors : undefined,
  });
}
