import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { fetchPagePosts as fetchFacebookPosts } from '@/lib/social/platforms/history/facebook';
import { fetchInstagramPosts } from '@/lib/social/platforms/history/instagram';
import { fetchLinkedInPosts } from '@/lib/social/platforms/history/linkedin';
import type { ConnectionWithTokens } from '@/lib/social/token-manager';
import { ensureValidToken } from '@/lib/social/token-manager';

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

  // Get all active connections for this organization
  const { data: connections } = await supabase
    .from('social_media_connections')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('is_active', true);

  if (!connections || connections.length === 0) {
    return NextResponse.json({ message: 'No active social media connections found', posts: [] });
  }

  const allPosts: any[] = [];
  let fetchedCount = 0;
  let failedCount = 0;
  const errors: Array<{ platform: string; error: string }> = [];

  // For Facebook/Instagram/LinkedIn, only use PAGE-type connections (not profile).
  // Profile connections don't have page IDs and can't fetch page analytics.
  const pageConnections = connections.filter(c => {
    if (['facebook', 'instagram', 'linkedin'].includes(c.platform)) {
      return c.account_type === 'page';
    }
    return true; // Other platforms use profile connections
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

  // Fetch posts from each connected platform page
  for (const connection of pageConnections) {
    try {
      console.log(`Fetching posts for ${connection.platform}:`, {
        platform: connection.platform,
        accountType: connection.account_type,
        pageId: connection.platform_page_id,
        username: connection.platform_username,
        pageName: connection.platform_page_name,
      });

      const tokens = await ensureValidToken(connection as unknown as ConnectionWithTokens);
      let platformPosts: any[] = [];

      switch (connection.platform) {
        case 'facebook':
          platformPosts = await fetchFacebookPosts(tokens, 50);
          break;
        case 'instagram':
          platformPosts = await fetchInstagramPosts(tokens, 50);
          break;
        case 'linkedin':
          platformPosts = await fetchLinkedInPosts(tokens, 50);
          break;
        default:
          console.log(`Skipping unsupported platform: ${connection.platform}`);
          continue;
      }

      console.log(`Fetched ${platformPosts.length} posts from ${connection.platform}`);

      // Add platform and connection info to each post
      const postsWithMeta = platformPosts.map((post) => ({
        ...post,
        platform: connection.platform,
        connectionId: connection.id,
        accountName: connection.platform_username || connection.platform_page_name || 'Unknown',
      }));

      allPosts.push(...postsWithMeta);
      fetchedCount += platformPosts.length;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Failed to fetch ${connection.platform} posts:`, errorMessage, error);
      errors.push({ platform: connection.platform, error: errorMessage });
      failedCount++;
    }
  }

  // Sort posts by date (newest first)
  allPosts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  console.log(`Total posts fetched: ${allPosts.length}, Errors: ${errors.length}`);

  return NextResponse.json({
    message: allPosts.length > 0
      ? 'Platform posts fetched successfully'
      : errors.length > 0
        ? 'Failed to fetch posts from all platforms'
        : 'No posts found',
    posts: allPosts,
    totalPosts: allPosts.length,
    connectionsProcessed: connections.length,
    fetchedCount,
    failedCount,
    errors: errors.length > 0 ? errors : undefined,
  });
}
