import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import type { SocialPlatform, Json } from '@/types/database';

interface PageInfo {
  id: string;
  name: string;
  access_token: string;
  category?: string | null;
}

const VALID_PLATFORMS = ['linkedin', 'facebook', 'instagram', 'twitter', 'tiktok', 'youtube'];
const GRAPH_API_VERSION = 'v22.0';
const GRAPH_API_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

async function fetchFacebookPages(accessToken: string): Promise<PageInfo[]> {
  try {
    // Fetch ALL pages from /me/accounts (handle pagination)
    let allPages: PageInfo[] = [];
    let nextUrl: string | null = `${GRAPH_API_BASE}/me/accounts?fields=id,name,access_token,category&limit=100&access_token=${accessToken}`;
    let batchCount = 0;

    while (nextUrl && batchCount < 10) {
      batchCount++;
      const pagesRes: Response = await fetch(nextUrl);
      const pagesData: Record<string, unknown> = await pagesRes.json();

      if (pagesData.error) {
        console.error('[fetchFacebookPages] API error:', pagesData.error);
        throw new Error(`Facebook API error: ${(pagesData.error as Record<string, string>).message || JSON.stringify(pagesData.error)}`);
      }

      const pagesBatch = ((pagesData.data || []) as Array<{ id: string; name: string; access_token: string; category?: string }>).map(p => ({
        id: p.id,
        name: p.name,
        access_token: p.access_token,
        category: p.category || null,
      }));

      console.log(`[fetchFacebookPages] Batch ${batchCount}: ${pagesBatch.length} pages — ${pagesBatch.map(p => p.name).join(', ')}`);
      allPages = [...allPages, ...pagesBatch];
      nextUrl = (pagesData.paging as Record<string, string> | undefined)?.next || null;
    }

    console.log(`[fetchFacebookPages] /me/accounts total: ${allPages.length} pages`);

    // Also fetch pages via Business Manager
    const knownPageIds = new Set(allPages.map(p => p.id));
    try {
      const bizRes = await fetch(`${GRAPH_API_BASE}/me/businesses?access_token=${accessToken}`);
      const bizData = await bizRes.json();
      const businesses = bizData.data || [];
      console.log(`[fetchFacebookPages] Found ${businesses.length} businesses`);

      for (const biz of businesses) {
        try {
          // Fetch owned pages
          let bizPagesUrl: string | null = `${GRAPH_API_BASE}/${biz.id}/owned_pages?fields=id,name,access_token,category&limit=100&access_token=${accessToken}`;
          while (bizPagesUrl) {
            const bpRes: Response = await fetch(bizPagesUrl);
            const bpData: Record<string, unknown> = await bpRes.json();
            if (bpData.error) break;
            for (const p of (bpData.data || []) as Array<{ id: string; name: string; access_token: string; category?: string }>) {
              if (!knownPageIds.has(p.id) && p.access_token) {
                allPages.push({ id: p.id, name: p.name, access_token: p.access_token, category: p.category || null });
                knownPageIds.add(p.id);
                console.log(`[fetchFacebookPages] + Business owned page: ${p.name} (${p.id})`);
              }
            }
            bizPagesUrl = (bpData.paging as Record<string, string> | undefined)?.next || null;
          }

          // Fetch client pages
          let clientPagesUrl: string | null = `${GRAPH_API_BASE}/${biz.id}/client_pages?fields=id,name,access_token,category&limit=100&access_token=${accessToken}`;
          while (clientPagesUrl) {
            const cpRes: Response = await fetch(clientPagesUrl);
            const cpData: Record<string, unknown> = await cpRes.json();
            if (cpData.error) break;
            for (const p of (cpData.data || []) as Array<{ id: string; name: string; access_token: string; category?: string }>) {
              if (!knownPageIds.has(p.id) && p.access_token) {
                allPages.push({ id: p.id, name: p.name, access_token: p.access_token, category: p.category || null });
                knownPageIds.add(p.id);
                console.log(`[fetchFacebookPages] + Business client page: ${p.name} (${p.id})`);
              }
            }
            clientPagesUrl = (cpData.paging as Record<string, string> | undefined)?.next || null;
          }
        } catch (bizErr) {
          console.error(`[fetchFacebookPages] Error processing business ${biz.id}:`, bizErr);
        }
      }
    } catch (err) {
      console.error('[fetchFacebookPages] Error fetching businesses:', err);
    }

    console.log(`[fetchFacebookPages] Total pages (accounts + businesses): ${allPages.length}`);
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
  const LINKEDIN_API_BASE = 'https://api.linkedin.com';
  const organizations: PageInfo[] = [];
  const knownOrgIds = new Set<string>();

  const headers = {
    Authorization: `Bearer ${accessToken}`,
    'LinkedIn-Version': '202401',
    'X-Restli-Protocol-Version': '2.0.0',
  };

  // Approach 1: ADMINISTRATOR role
  try {
    console.log('[fetchLinkedInOrgs] Trying ADMINISTRATOR role...');
    const orgsRes = await fetch(
      `${LINKEDIN_API_BASE}/rest/organizationAcls?q=roleAssignee&role=ADMINISTRATOR&projection=(elements*(organization~(id,localizedName)))`,
      { headers }
    );
    console.log('[fetchLinkedInOrgs] ADMINISTRATOR status:', orgsRes.status);
    if (orgsRes.ok) {
      const orgsData = await orgsRes.json();
      for (const el of orgsData.elements || []) {
        const org = el['organization~'];
        if (org && !knownOrgIds.has(String(org.id))) {
          organizations.push({ id: String(org.id), name: org.localizedName || 'Organization', access_token: accessToken, category: 'Company Page' });
          knownOrgIds.add(String(org.id));
        }
      }
    }
  } catch (err) {
    console.error('[fetchLinkedInOrgs] ADMINISTRATOR error:', err);
  }

  // Approach 2: DIRECT_SPONSORED_CONTENT_POSTER role
  try {
    const orgsRes = await fetch(
      `${LINKEDIN_API_BASE}/rest/organizationAcls?q=roleAssignee&role=DIRECT_SPONSORED_CONTENT_POSTER&projection=(elements*(organization~(id,localizedName)))`,
      { headers }
    );
    if (orgsRes.ok) {
      const orgsData = await orgsRes.json();
      for (const el of orgsData.elements || []) {
        const org = el['organization~'];
        if (org && !knownOrgIds.has(String(org.id))) {
          organizations.push({ id: String(org.id), name: org.localizedName || 'Organization', access_token: accessToken, category: 'Company Page' });
          knownOrgIds.add(String(org.id));
        }
      }
    }
  } catch { /* skip */ }

  // Approach 3: No role filter (get all associations)
  if (organizations.length === 0) {
    try {
      console.log('[fetchLinkedInOrgs] Trying without role filter...');
      const orgsRes = await fetch(
        `${LINKEDIN_API_BASE}/rest/organizationAcls?q=roleAssignee&projection=(elements*(organization~(id,localizedName),role))`,
        { headers }
      );
      console.log('[fetchLinkedInOrgs] No-role-filter status:', orgsRes.status);
      if (orgsRes.ok) {
        const orgsData = await orgsRes.json();
        for (const el of orgsData.elements || []) {
          const org = el['organization~'];
          if (org && !knownOrgIds.has(String(org.id))) {
            organizations.push({ id: String(org.id), name: org.localizedName || 'Organization', access_token: accessToken, category: 'Company Page' });
            knownOrgIds.add(String(org.id));
          }
        }
      } else {
        console.log('[fetchLinkedInOrgs] No-role-filter error:', await orgsRes.text());
      }
    } catch (err) {
      console.error('[fetchLinkedInOrgs] No-role-filter exception:', err);
    }
  }

  console.log(`[fetchLinkedInOrgs] Found ${organizations.length} LinkedIn organizations`);
  return organizations;
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

  // Use service client to bypass RLS — profile connection may have been inserted by service role
  const serviceClient = createServiceClient();

  // Try to find the profile connection first (has user-scoped token for page discovery)
  let { data: profileConn } = await serviceClient
    .from('social_media_connections')
    .select('id, access_token, metadata, account_type, platform_username, platform_page_name, platform_user_id')
    .eq('organization_id', membership.organization_id)
    .eq('platform', platformTyped)
    .eq('is_active', true)
    .eq('account_type', 'profile')
    .limit(1)
    .single();

  // Fallback: if no profile connection, try any active connection
  if (!profileConn) {
    const { data: anyConn } = await serviceClient
      .from('social_media_connections')
      .select('id, access_token, metadata, account_type, platform_username, platform_page_name, platform_user_id')
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

  // ALWAYS try to fetch fresh pages from the platform API (metadata may be stale)
  if (canFetchFromApi) {
    try {
      console.log(`[available-pages] Fetching FRESH pages from ${platformTyped} API (profile token)...`);
      let freshPages: PageInfo[] = [];
      if (platformTyped === 'facebook') {
        freshPages = await fetchFacebookPages(profileConn.access_token);
      } else if (platformTyped === 'instagram') {
        freshPages = await fetchInstagramAccounts(profileConn.access_token);
      } else if (platformTyped === 'linkedin') {
        freshPages = await fetchLinkedInOrganizations(profileConn.access_token);
      }

      console.log(`[available-pages] Fetched ${freshPages.length} fresh pages from ${platformTyped} API`);

      if (freshPages.length > 0) {
        // Merge: fresh API pages + any metadata-only pages not in API results
        const freshIds = new Set(freshPages.map(p => p.id));
        const metadataOnlyPages = availablePages.filter(p => !freshIds.has(p.id));
        availablePages = [...freshPages, ...metadataOnlyPages];

        // Update metadata cache
        const updatedMetadata = { ...metadata, pages: availablePages } as unknown as Record<string, Json>;
        await serviceClient
          .from('social_media_connections')
          .update({ metadata: updatedMetadata })
          .eq('id', profileConn.id);
      } else if (availablePages.length === 0) {
        // API returned nothing AND metadata is empty
        console.log(`[available-pages] API returned 0 pages and metadata is empty`);
      }
      // If API returned nothing but metadata has pages, keep using metadata (don't clear cache)
    } catch (error) {
      fetchError = error instanceof Error ? error.message : 'Unknown error fetching pages';
      console.error('[available-pages] Error fetching pages from API:', fetchError);
      // Fall back to metadata pages on API error
    }
  } else if (profileConn.account_type === 'page') {
    console.log(`[available-pages] Skipping API fetch — connection is page type, cannot discover pages`);
    fetchError = 'Profile connection not found. Your connected pages are shown below.';
  }

  // Fetch existing page connections — these are pages the user already connected
  const { data: existingPageConns } = await serviceClient
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

  // For LinkedIn: add personal profile as an option (industry standard — post as person or org)
  if (platformTyped === 'linkedin' && profileConn.platform_user_id && profileConn.platform_username) {
    const personalId = profileConn.platform_user_id;
    if (!pages.find(p => p.id === personalId)) {
      pages.unshift({
        id: personalId,
        name: profileConn.platform_username,
        category: 'Personal Profile',
        isConnected: connectedPageIds.has(personalId),
      });
    }
  }

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
