import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { SocialPlatform, Json } from '@/types/database';

interface PageInfo {
  id: string;
  name: string;
  access_token: string;
  category?: string | null;
}

const VALID_PLATFORMS = ['linkedin', 'facebook', 'instagram', 'twitter', 'tiktok', 'youtube'];
const GRAPH_API_VERSION = 'v21.0';
const GRAPH_API_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

async function fetchFacebookPages(accessToken: string): Promise<PageInfo[]> {
  try {
    const pagesRes = await fetch(`${GRAPH_API_BASE}/me/accounts?access_token=${accessToken}`);
    const pagesData = await pagesRes.json();

    if (pagesData.error) {
      console.error('Facebook API error:', pagesData.error);
      return [];
    }

    return (pagesData.data || []).map((p: { id: string; name: string; access_token: string; category?: string }) => ({
      id: p.id,
      name: p.name,
      access_token: p.access_token,
      category: p.category || null,
    }));
  } catch (error) {
    console.error('Failed to fetch Facebook pages:', error);
    return [];
  }
}

async function fetchInstagramAccounts(accessToken: string): Promise<PageInfo[]> {
  try {
    // For Instagram, we first need to get Facebook pages, then their connected IG accounts
    const pagesRes = await fetch(`${GRAPH_API_BASE}/me/accounts?access_token=${accessToken}`);
    const pagesData = await pagesRes.json();

    if (pagesData.error) {
      console.error('Facebook API error:', pagesData.error);
      return [];
    }

    const igAccounts: PageInfo[] = [];

    for (const page of pagesData.data || []) {
      // Check if this page has an Instagram Business Account
      const igRes = await fetch(`${GRAPH_API_BASE}/${page.id}?fields=instagram_business_account&access_token=${page.access_token}`);
      const igData = await igRes.json();

      if (igData.instagram_business_account) {
        // Get IG account details
        const igAccountRes = await fetch(`${GRAPH_API_BASE}/${igData.instagram_business_account.id}?fields=id,username&access_token=${page.access_token}`);
        const igAccountData = await igAccountRes.json();

        igAccounts.push({
          id: igAccountData.id,
          name: igAccountData.username || page.name,
          access_token: page.access_token,
          category: 'Instagram Business Account',
        });
      }
    }

    return igAccounts;
  } catch (error) {
    console.error('Failed to fetch Instagram accounts:', error);
    return [];
  }
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const platform = request.nextUrl.searchParams.get('platform');
  if (!platform || !VALID_PLATFORMS.includes(platform)) {
    return NextResponse.json({ error: 'Valid platform query param is required' }, { status: 400 });
  }
  const platformTyped = platform as SocialPlatform;

  // Get user's org
  const { data: membership } = await supabase
    .from('org_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .single();

  if (!membership) {
    return NextResponse.json({ error: 'No organization found' }, { status: 404 });
  }

  // Fetch the profile connection for this platform
  const { data: profileConn } = await supabase
    .from('social_media_connections')
    .select('id, access_token, metadata')
    .eq('organization_id', membership.organization_id)
    .eq('platform', platformTyped)
    .eq('account_type', 'profile')
    .single();

  if (!profileConn) {
    return NextResponse.json({ error: 'No profile connection found for this platform' }, { status: 404 });
  }

  const metadata = (profileConn.metadata || {}) as Record<string, unknown>;
  let availablePages = (metadata.pages || []) as PageInfo[];

  // If no pages in metadata or empty, fetch them from the API
  if (availablePages.length === 0 && profileConn.access_token) {
    if (platformTyped === 'facebook') {
      availablePages = await fetchFacebookPages(profileConn.access_token);
    } else if (platformTyped === 'instagram') {
      availablePages = await fetchInstagramAccounts(profileConn.access_token);
    }

    // Update metadata with fetched pages
    if (availablePages.length > 0) {
      const updatedMetadata = { ...metadata, pages: availablePages } as unknown as Record<string, Json>;
      await supabase
        .from('social_media_connections')
        .update({ metadata: updatedMetadata })
        .eq('id', profileConn.id);
    }
  }

  // Fetch existing page connections to mark which are already connected
  const { data: existingPages } = await supabase
    .from('social_media_connections')
    .select('platform_page_id')
    .eq('organization_id', membership.organization_id)
    .eq('platform', platformTyped)
    .eq('account_type', 'page');

  const connectedPageIds = new Set((existingPages || []).map(p => p.platform_page_id));

  const pages = availablePages.map(p => ({
    id: p.id,
    name: p.name,
    category: p.category || null,
    isConnected: connectedPageIds.has(p.id),
  }));

  return NextResponse.json({
    connectionId: profileConn.id,
    pages,
  });
}
