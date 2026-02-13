import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthUrl, getRedirectUri, isValidPlatform } from '@/lib/social/auth';
import { cookies } from 'next/headers';

const GRAPH_API_VERSION = 'v21.0';
const GRAPH_API_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ platform: string }> }
) {
  const { platform } = await params;

  if (!isValidPlatform(platform)) {
    return NextResponse.json({ error: 'Invalid platform' }, { status: 400 });
  }

  const supabase = await createClient();

  // Check auth
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check org membership (must be owner or admin)
  const { data: membership } = await supabase
    .from('org_members')
    .select('organization_id, role')
    .eq('user_id', user.id)
    .single();

  if (!membership || !['owner', 'admin'].includes(membership.role)) {
    return NextResponse.json({ error: 'Only org owners and admins can connect social accounts' }, { status: 403 });
  }

  // For Facebook/Instagram: revoke existing app permissions BEFORE redirecting to OAuth.
  // This forces Facebook to show a completely fresh consent dialog with the full
  // page-selection screen. Without this, Facebook remembers which pages the user
  // previously granted and silently reuses that selection — so newly created pages
  // or pages the user forgot to check won't appear in /me/accounts.
  if (platform === 'facebook' || platform === 'instagram') {
    try {
      const { data: existingConn } = await supabase
        .from('social_media_connections')
        .select('access_token')
        .eq('organization_id', membership.organization_id)
        .eq('platform', platform)
        .eq('account_type', 'profile')
        .eq('is_active', true)
        .limit(1)
        .single();

      if (existingConn?.access_token) {
        console.log(`[auth] Revoking existing ${platform} permissions before OAuth...`);
        const revokeRes = await fetch(
          `${GRAPH_API_BASE}/me/permissions?access_token=${existingConn.access_token}`,
          { method: 'DELETE' }
        );
        console.log(`[auth] Revoke response: ${revokeRes.status}`);
      }
    } catch (err) {
      // Non-fatal — if revocation fails, OAuth still works (just might not show page picker)
      console.warn(`[auth] Failed to revoke ${platform} permissions (continuing):`, err);
    }
  }

  // Generate state for CSRF protection
  const state = crypto.randomUUID();

  // Store state in cookie for verification on callback
  const cookieStore = await cookies();
  cookieStore.set(`social_oauth_state_${platform}`, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600, // 10 minutes
    path: '/',
  });

  // Store org ID in cookie so callback can associate the connection
  cookieStore.set(`social_oauth_org_${platform}`, membership.organization_id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600,
    path: '/',
  });

  // For Twitter PKCE: store state as code_verifier in cookie
  if (platform === 'twitter') {
    cookieStore.set(`social_oauth_pkce_${platform}`, state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600,
      path: '/',
    });
  }

  const redirectUri = getRedirectUri(platform);
  const authUrl = getAuthUrl(platform, state, redirectUri);

  return NextResponse.redirect(authUrl);
}
