import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { exchangeCode, getRedirectUri, isValidPlatform } from '@/lib/social/auth';
import { cookies } from 'next/headers';
import type { Json } from '@/types/database';

export async function GET(
  request: NextRequest,
  { params }: { params: { platform: string } }
) {
  const { platform } = params;
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  if (!isValidPlatform(platform)) {
    return NextResponse.redirect(`${baseUrl}/settings?social=error&message=Invalid+platform`);
  }

  if (error) {
    return NextResponse.redirect(`${baseUrl}/settings?social=error&message=${encodeURIComponent(error)}`);
  }

  if (!code) {
    return NextResponse.redirect(`${baseUrl}/settings?social=error&message=No+authorization+code`);
  }

  const cookieStore = cookies();

  // Verify state (CSRF protection)
  const storedState = cookieStore.get(`social_oauth_state_${platform}`)?.value;
  if (!storedState || storedState !== state) {
    return NextResponse.redirect(`${baseUrl}/settings?social=error&message=Invalid+state`);
  }

  // Get org ID from cookie
  const orgId = cookieStore.get(`social_oauth_org_${platform}`)?.value;
  if (!orgId) {
    return NextResponse.redirect(`${baseUrl}/settings?social=error&message=Missing+organization`);
  }

  // Clean up cookies
  cookieStore.delete(`social_oauth_state_${platform}`);
  cookieStore.delete(`social_oauth_org_${platform}`);

  // Check auth
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(`${baseUrl}/login`);
  }

  try {
    const redirectUri = getRedirectUri(platform);
    const tokenData = await exchangeCode(platform, code, redirectUri);

    // Upsert connection (one per platform per org)
    const { error: upsertError } = await supabase
      .from('social_media_connections')
      .upsert(
        {
          organization_id: orgId,
          user_id: user.id,
          platform,
          access_token: tokenData.accessToken,
          refresh_token: tokenData.refreshToken,
          token_expires_at: tokenData.expiresAt?.toISOString() || null,
          platform_user_id: tokenData.platformUserId || null,
          platform_username: tokenData.platformUsername || null,
          platform_page_id: tokenData.platformPageId || null,
          platform_page_name: tokenData.platformPageName || null,
          scopes: tokenData.scopes || null,
          is_active: true,
          connected_at: new Date().toISOString(),
          metadata: (tokenData.metadata || {}) as Json,
        },
        { onConflict: 'organization_id,platform' }
      );

    if (upsertError) {
      console.error('Failed to save social connection:', upsertError);
      return NextResponse.redirect(`${baseUrl}/settings?social=error&message=Failed+to+save+connection`);
    }

    return NextResponse.redirect(`${baseUrl}/settings?social=connected&platform=${platform}`);
  } catch (err) {
    console.error(`OAuth callback error for ${platform}:`, err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.redirect(`${baseUrl}/settings?social=error&message=${encodeURIComponent(message)}`);
  }
}
