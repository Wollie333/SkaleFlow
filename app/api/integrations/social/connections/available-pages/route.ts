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
    console.log('Fetching Facebook pages from API...');
    const url = `${GRAPH_API_BASE}/me/accounts?access_token=${accessToken}`;
    const pagesRes = await fetch(url);
    const pagesData = await pagesRes.json();

    console.log('Facebook API response:', {
      status: pagesRes.status,
      hasError: !!pagesData.error,
      error: pagesData.error,
      dataCount: pagesData.data?.length || 0,
      data: pagesData.data,
    });

    if (pagesData.error) {
      console.error('Facebook API error:', pagesData.error);
      throw new Error(`Facebook API error: ${pagesData.error.message || JSON.stringify(pagesData.error)}`);
    }

    const pages = (pagesData.data || []).map((p: { id: string; name: string; access_token: string; category?: string }) => ({
      id: p.id,
      name: p.name,
      access_token: p.access_token,
      category: p.category || null,
    }));

    console.log(`Found ${pages.length} Facebook pages`);
    return pages;
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

  // Fetch ANY connection for this platform (try profile first, then any)
  let { data: profileConn } = await supabase
    .from('social_media_connections')
    .select('id, access_token, metadata, account_type, platform_username, platform_page_name')
    .eq('organization_id', membership.organization_id)
    .eq('platform', platformTyped)
    .eq('is_active', true)
    .order('account_type', { ascending: true }) // 'page' comes before 'profile'
    .limit(1)
    .single();

  if (!profileConn) {
    console.error(`No connection found for ${platformTyped}`);
    return NextResponse.json({ error: 'No connection found for this platform' }, { status: 404 });
  }

  console.log(`Found ${platformTyped} connection:`, {
    id: profileConn.id,
    accountType: profileConn.account_type,
    username: profileConn.platform_username,
    pageName: profileConn.platform_page_name,
    hasToken: !!profileConn.access_token,
    tokenPrefix: profileConn.access_token?.substring(0, 10) + '...',
    hasMetadata: !!profileConn.metadata,
  });

  const metadata = (profileConn.metadata || {}) as Record<string, unknown>;
  let availablePages = (metadata.pages || []) as PageInfo[];
  let fetchError: string | null = null;

  console.log(`Metadata pages: ${availablePages.length}`);

  // If no pages in metadata or empty, fetch them from the API
  if (availablePages.length === 0 && profileConn.access_token) {
    try {
      console.log(`Fetching pages from ${platformTyped} API...`);
      if (platformTyped === 'facebook') {
        availablePages = await fetchFacebookPages(profileConn.access_token);
      } else if (platformTyped === 'instagram') {
        availablePages = await fetchInstagramAccounts(profileConn.access_token);
      } else if (platformTyped === 'linkedin') {
        // Fetch LinkedIn organizations (company pages)
        availablePages = await fetchLinkedInOrganizations(profileConn.access_token);
      }

      console.log(`Fetched ${availablePages.length} pages from ${platformTyped}`);

      // Update metadata with fetched pages
      if (availablePages.length > 0) {
        const updatedMetadata = { ...metadata, pages: availablePages } as unknown as Record<string, Json>;
        await supabase
          .from('social_media_connections')
          .update({ metadata: updatedMetadata })
          .eq('id', profileConn.id);
        console.log('Updated metadata with fetched pages');
      }
    } catch (error) {
      fetchError = error instanceof Error ? error.message : 'Unknown error fetching pages';
      console.error('Error fetching pages:', fetchError);
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

  console.log(`Returning ${pages.length} pages to client, error: ${fetchError || 'none'}`);

  // If no pages found (with or without error), provide helpful hint
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
    error: fetchError, // Include error even if we have pages (partial success)
  });
}
