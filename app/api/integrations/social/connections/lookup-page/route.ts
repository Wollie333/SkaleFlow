import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import type { SocialPlatform } from '@/types/database';

const GRAPH_API_VERSION = 'v22.0';
const GRAPH_API_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

export async function GET(request: NextRequest) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const query = request.nextUrl.searchParams.get('q')?.trim();
  const platform = request.nextUrl.searchParams.get('platform');

  if (!query || !platform) {
    return NextResponse.json({ error: 'q and platform params required' }, { status: 400 });
  }

  // Get org
  const { data: membership } = await supabase
    .from('org_members')
    .select('organization_id, role')
    .eq('user_id', user.id)
    .single();

  if (!membership || !['owner', 'admin'].includes(membership.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Get profile connection for access token
  const serviceClient = createServiceClient();
  const { data: profileConn } = await serviceClient
    .from('social_media_connections')
    .select('access_token')
    .eq('organization_id', membership.organization_id)
    .eq('platform', platform as SocialPlatform)
    .eq('account_type', 'profile')
    .eq('is_active', true)
    .limit(1)
    .single();

  if (!profileConn) {
    return NextResponse.json({ error: 'No Facebook profile connection found. Connect Facebook first.' }, { status: 404 });
  }

  const accessToken = profileConn.access_token;

  // Try to look up the page directly by ID or name
  // First check if the query looks like a numeric page ID or a URL
  let pageId: string | null = null;

  // Extract page ID from URL: facebook.com/pagename or facebook.com/profile.php?id=123
  const urlMatch = query.match(/facebook\.com\/(?:profile\.php\?id=)?(\d+)|facebook\.com\/([a-zA-Z0-9._-]+)/);
  if (urlMatch) {
    pageId = urlMatch[1] || urlMatch[2];
  } else if (/^\d+$/.test(query)) {
    pageId = query;
  }

  const results: Array<{ id: string; name: string; category: string | null; access_token: string }> = [];

  // Direct page lookup by ID or vanity name
  if (pageId) {
    try {
      const res = await fetch(`${GRAPH_API_BASE}/${pageId}?fields=id,name,category,access_token&access_token=${accessToken}`);
      const data = await res.json();
      if (!data.error && data.id) {
        results.push({
          id: data.id,
          name: data.name,
          category: data.category || null,
          access_token: data.access_token || '',
        });
      } else {
        console.log(`[lookup-page] Direct lookup failed for "${pageId}":`, data.error?.message);
      }
    } catch (err) {
      console.error('[lookup-page] Direct lookup error:', err);
    }
  }

  // Also try direct lookup by vanity name (user might type "manamarketingsa" directly)
  if (results.length === 0 && !pageId) {
    try {
      console.log(`[lookup-page] Trying vanity name lookup: "${query}"`);
      const res = await fetch(`${GRAPH_API_BASE}/${encodeURIComponent(query)}?fields=id,name,category,access_token&access_token=${accessToken}`);
      const data = await res.json();
      if (!data.error && data.id) {
        results.push({
          id: data.id,
          name: data.name,
          category: data.category || null,
          access_token: data.access_token || '',
        });
        console.log(`[lookup-page] Vanity name found: ${data.name} (${data.id})`);
      } else {
        console.log(`[lookup-page] Vanity name lookup failed:`, data.error?.message);
      }
    } catch (err) {
      console.error('[lookup-page] Vanity name lookup error:', err);
    }
  }

  // Search by name using /pages/search (public search, no page token needed)
  if (results.length === 0) {
    try {
      const searchRes = await fetch(
        `${GRAPH_API_BASE}/pages/search?q=${encodeURIComponent(query)}&fields=id,name,category,location&limit=10&access_token=${accessToken}`
      );
      const searchData = await searchRes.json();

      if (searchData.data && searchData.data.length > 0) {
        for (const p of searchData.data) {
          // For each search result, try to get a page access token (only works if user is admin)
          try {
            const tokenRes = await fetch(`${GRAPH_API_BASE}/${p.id}?fields=id,name,category,access_token&access_token=${accessToken}`);
            const tokenData = await tokenRes.json();
            if (tokenData.access_token) {
              results.push({
                id: tokenData.id,
                name: tokenData.name,
                category: tokenData.category || null,
                access_token: tokenData.access_token,
              });
            } else {
              // Include in results but mark as no token (user isn't admin)
              results.push({
                id: p.id,
                name: p.name,
                category: p.category || null,
                access_token: '',
              });
            }
          } catch {
            results.push({
              id: p.id,
              name: p.name,
              category: p.category || null,
              access_token: '',
            });
          }
        }
      } else {
        console.log(`[lookup-page] Search returned no results for "${query}":`, searchData.error?.message || 'empty');
      }
    } catch (err) {
      console.error('[lookup-page] Search error:', err);
    }
  }

  console.log(`[lookup-page] Found ${results.length} results for "${query}"`);

  return NextResponse.json({
    pages: results.map(p => ({
      id: p.id,
      name: p.name,
      category: p.category,
      hasToken: !!p.access_token,
    })),
    // Include full data with tokens for the add-page flow
    _pageData: results,
  });
}
