import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { fetchPagePosts as fetchFacebookPosts } from '@/lib/social/platforms/history/facebook';
import { fetchInstagramPosts } from '@/lib/social/platforms/history/instagram';
import { fetchLinkedInPosts } from '@/lib/social/platforms/history/linkedin';
import type { ConnectionWithTokens } from '@/lib/social/token-manager';
import { ensureValidToken } from '@/lib/social/token-manager';

// Allow up to 60s for this route (fetches from multiple platform APIs)
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
    return NextResponse.json({ message: 'No active social media connections found', posts: [] });
  }

  // For Facebook/Instagram/LinkedIn, only use PAGE-type connections
  const pageConnections = connections.filter(c => {
    if (['facebook', 'instagram', 'linkedin'].includes(c.platform)) {
      return c.account_type === 'page';
    }
    return true;
  });

  if (pageConnections.length === 0) {
    return NextResponse.json({
      message: 'No page connections found. Go to Settings → Social Media Accounts and select pages to connect.',
      posts: [],
      totalPosts: 0,
      connectionsProcessed: 0,
      fetchedCount: 0,
      failedCount: 0,
    });
  }

  // Fetch from all platforms in PARALLEL (not sequential) to avoid timeout
  const results = await Promise.allSettled(
    pageConnections.map(async (connection) => {
      const tokens = await ensureValidToken(connection as unknown as ConnectionWithTokens);

      // Limit to 25 posts per platform to keep response times reasonable
      const limit = 25;

      switch (connection.platform) {
        case 'facebook':
          return {
            platform: connection.platform,
            posts: (await fetchFacebookPosts(tokens, limit)).map(p => ({
              ...p,
              platform: connection.platform,
              connectionId: connection.id,
              accountName: connection.platform_username || connection.platform_page_name || 'Unknown',
            })),
          };
        case 'instagram':
          return {
            platform: connection.platform,
            posts: (await fetchInstagramPosts(tokens, limit)).map(p => ({
              ...p,
              platform: connection.platform,
              connectionId: connection.id,
              accountName: connection.platform_username || connection.platform_page_name || 'Unknown',
            })),
          };
        case 'linkedin':
          return {
            platform: connection.platform,
            posts: (await fetchLinkedInPosts(tokens, limit)).map(p => ({
              ...p,
              platform: connection.platform,
              connectionId: connection.id,
              accountName: connection.platform_username || connection.platform_page_name || 'Unknown',
            })),
          };
        default:
          return { platform: connection.platform, posts: [] };
      }
    })
  );

  const allPosts: any[] = [];
  const errors: Array<{ platform: string; error: string }> = [];
  let fetchedCount = 0;
  let failedCount = 0;

  for (const result of results) {
    if (result.status === 'fulfilled') {
      allPosts.push(...result.value.posts);
      fetchedCount += result.value.posts.length;
    } else {
      const errorMessage = result.reason instanceof Error ? result.reason.message : 'Unknown error';
      // Try to extract platform name from error context
      console.error('Platform fetch failed:', errorMessage);
      errors.push({ platform: 'unknown', error: errorMessage });
      failedCount++;
    }
  }

  // Sort posts by date (newest first)
  allPosts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return NextResponse.json({
    message: allPosts.length > 0
      ? 'Platform posts fetched successfully'
      : errors.length > 0
        ? 'Failed to fetch posts from all platforms'
        : 'No posts found',
    posts: allPosts,
    totalPosts: allPosts.length,
    connectionsProcessed: pageConnections.length,
    fetchedCount,
    failedCount,
    errors: errors.length > 0 ? errors : undefined,
  });
}
