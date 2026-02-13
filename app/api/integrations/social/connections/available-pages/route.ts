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
    // Fetch ALL pages (handle pagination)
    let allPages: PageInfo[] = [];
    let nextUrl = `${GRAPH_API_BASE}/me/accounts?access_token=${accessToken}`;
    let pageCount = 0;

    while (nextUrl && pageCount < 10) { // Safety limit of 10 pages
      pageCount++;
      const pagesRes = await fetch(nextUrl);
      const pagesData = await pagesRes.json();

      if (pagesData.error) {
        console.error('Facebook API error:', pagesData.error);
        throw new Error(`Facebook API error: ${pagesData.error.message || JSON.stringify(pagesData.error)}`);
      }

      const pagesBatch = (pagesData.data || []).map((p: { id: string; name: string; access_token: string; category?: string }) => ({
        id: p.id,
        name: p.name,
        access_token: p.access_token,
        category: p.category || null,
      }));

      allPages = [...allPages, ...pagesBatch];

      // Check if there's a next page
      nextUrl = pagesData.paging?.next || null;
    }

    return allPages;
  } catch (error) {
    console.error('Failed to fetch Facebook pages:', error);
    throw error;
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

async function fetchLinkedInOrganizations(accessToken: string): Promise<PageInfo[]> {
  try {
    console.log('Fetching LinkedIn organizations from API...');
    const LINKEDIN_API_BASE = 'https://api.linkedin.com';

    const orgsRes = await fetch(
      `${LINKEDIN_API_BASE}/rest/organizationAcls?q=roleAssignee&role=ADMINISTRATOR&projection=(elements*(organization~(id,localizedName)))`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'LinkedIn-Version': '202601',
          'X-Restli-Protocol-Version': '2.0.0',
        },
      }
    );

    console.log('LinkedIn API response:', {
      status: orgsRes.status,
      ok: orgsRes.ok,
    });

    if (!orgsRes.ok) {
      const errorText = await orgsRes.text();
      console.error('LinkedIn API error:', errorText);
      return [];
    }

    const orgsData = await orgsRes.json();
    console.log('LinkedIn organizations data:', {
      hasElements: !!orgsData.elements,
      elementCount: orgsData.elements?.length || 0,
    });

    const elements = orgsData.elements || [];
    const organizations: PageInfo[] = [];

    for (const el of elements) {
      const org = el['organization~'];
      if (org) {
        organizations.push({
          id: String(org.id),
          name: org.localizedName || 'Organization',
          access_token: accessToken,
          category: 'Company Page',
        });
      }
    }

    console.log(`Found ${organizations.length} LinkedIn organizations`);
    return organizations;
  } catch (error) {
    console.error('Failed to fetch LinkedIn organizations:', error);
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

  // Try to find the profile connection first (has user-scoped token for page discovery)
  let { data: profileConn } = await supabase
    .from('social_media_connections')
    .select('id, access_token, metadata, account_type, platform_username, platform_page_name')
    .eq('organization_id', membership.organization_id)
    .eq('platform', platformTyped)
    .eq('is_active', true)
    .eq('account_type', 'profile')
    .limit(1)
    .single();

  // Fallback: if no profile connection, try any active connection
  if (!profileConn) {
    const { data: anyConn } = await supabase
      .from('social_media_connections')
      .select('id, access_token, metadata, account_type, platform_username, platform_page_name')
      .eq('organization_id', membership.organization_id)
      .eq('platform', platformTyped)
      .eq('is_active', true)
      .limit(1)
      .single();
    profileConn = anyConn;
  }

  if (!profileConn) {
    console.error(`No connection found for ${platformTyped}`);
    return NextResponse.json({ error: 'No connection found for this platform' }, { status: 404 });
  }

  console.log(`[available-pages] Found ${platformTyped} connection: type=${profileConn.account_type}, user=${profileConn.platform_username}`);

  const metadata = (profileConn.metadata || {}) as Record<string, unknown>;
  let availablePages = (metadata.pages || []) as PageInfo[];
  let fetchError: string | null = null;

  console.log(`[available-pages] Metadata pages for ${platformTyped}: count=${availablePages.length}`);

  // Only try API fetch with a PROFILE (user-scoped) token.
  // Page-scoped tokens CANNOT call /me/accounts — Facebook returns:
  //   "(#100) Tried accessing nonexisting field (accounts) on node type (Page)"
  const canFetchFromApi = profileConn.account_type === 'profile' && !!profileConn.access_token;

  // If no pages in metadata, fetch them from the platform API
  if (availablePages.length === 0 && canFetchFromApi) {
    try {
      console.log(`[available-pages] Fetching pages from ${platformTyped} API (profile token)...`);
      if (platformTyped === 'facebook') {
        availablePages = await fetchFacebookPages(profileConn.access_token);
      } else if (platformTyped === 'instagram') {
        availablePages = await fetchInstagramAccounts(profileConn.access_token);
      } else if (platformTyped === 'linkedin') {
        availablePages = await fetchLinkedInOrganizations(profileConn.access_token);
      }

      console.log(`[available-pages] Fetched ${availablePages.length} pages from ${platformTyped} API`);

      // Cache fetched pages in profile metadata for next time
      if (availablePages.length > 0) {
        const updatedMetadata = { ...metadata, pages: availablePages } as unknown as Record<string, Json>;
        await supabase
          .from('social_media_connections')
          .update({ metadata: updatedMetadata })
          .eq('id', profileConn.id);
      }
    } catch (error) {
      fetchError = error instanceof Error ? error.message : 'Unknown error fetching pages';
      console.error('[available-pages] Error fetching pages from API:', fetchError);
    }
  } else if (availablePages.length === 0 && profileConn.account_type === 'page') {
    console.log(`[available-pages] Skipping API fetch — connection is page type, cannot discover pages`);
    fetchError = 'Profile connection not found. Your connected pages are shown below.';
  }

  // Fetch existing page connections — these are pages the user already connected
  const { data: existingPageConns } = await supabase
    .from('social_media_connections')
    .select('platform_page_id, platform_page_name, metadata')
    .eq('organization_id', membership.organization_id)
    .eq('platform', platformTyped)
    .eq('account_type', 'page')
    .eq('is_active', true);

  const connectedPageIds = new Set((existingPageConns || []).map(p => p.platform_page_id));

  // Build page list from metadata/API results
  const pages = availablePages.map(p => ({
    id: p.id,
    name: p.name,
    category: p.category || null,
    isConnected: connectedPageIds.has(p.id),
  }));

  // Merge in any connected pages NOT already in the metadata/API list.
  // This ensures already-connected pages always show even if metadata is empty.
  for (const pc of existingPageConns || []) {
    if (pc.platform_page_id && !pages.find(p => p.id === pc.platform_page_id)) {
      const meta = (pc.metadata || {}) as Record<string, unknown>;
      pages.push({
        id: pc.platform_page_id,
        name: pc.platform_page_name || pc.platform_page_id,
        category: (meta.category as string) || null,
        isConnected: true,
      });
    }
  }

  console.log(`[available-pages] Returning ${pages.length} pages (${connectedPageIds.size} connected)`);

  // If no pages found at all, provide helpful hint
  if (pages.length === 0) {
    const errorMsg = fetchError || 'No pages found for this account';
    const hint = platformTyped === 'facebook'
      ? 'You need to create a Facebook Page first. Personal profiles cannot be used for posting via API. Visit facebook.com/pages/create to create a Page, then reconnect your account.'
      : platformTyped === 'instagram'
        ? 'You need a Facebook Page connected to an Instagram Business Account.'
        : platformTyped === 'linkedin'
          ? 'No LinkedIn Company Pages found. You must be an Administrator of a LinkedIn Company Page to post on its behalf. Make sure you have admin access to a Company Page and reconnect your account with organization permissions enabled.'
          : 'No pages available for this account.';

    return NextResponse.json({
      connectionId: profileConn.id,
      pages: [],
      error: errorMsg,
      hint,
    });
  }

  return NextResponse.json({
    connectionId: profileConn.id,
    pages,
  });
}
