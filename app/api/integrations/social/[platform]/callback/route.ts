import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { exchangeCode, getRedirectUri, isValidPlatform } from '@/lib/social/auth';
import { cookies } from 'next/headers';
import type { Json } from '@/types/database';

// TikTok sends a POST to verify webhook support during setup
export async function POST() {
  return NextResponse.json({ message: 'ok' }, { status: 200 });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ platform: string }> }
) {
  const { platform } = await params;
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

  const cookieStore = await cookies();

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

  // Get PKCE code verifier for Twitter
  const codeVerifier = cookieStore.get(`social_oauth_pkce_${platform}`)?.value;

  // Clean up cookies
  cookieStore.delete(`social_oauth_state_${platform}`);
  cookieStore.delete(`social_oauth_org_${platform}`);
  cookieStore.delete(`social_oauth_pkce_${platform}`);

  // Check auth
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(`${baseUrl}/login`);
  }

  try {
    const redirectUri = getRedirectUri(platform);
    const tokenData = await exchangeCode(platform, code, redirectUri, codeVerifier);

    console.log(`OAuth callback for ${platform}:`, {
      hasAccessToken: !!tokenData.accessToken,
      platformUserId: tokenData.platformUserId,
      platformUsername: tokenData.platformUsername,
      accountType: tokenData.accountType,
      hasMetadata: !!tokenData.metadata,
      metadataKeys: tokenData.metadata ? Object.keys(tokenData.metadata) : [],
      pagesCount: (tokenData.metadata?.pages as unknown[])?.length || 0,
    });

    // Delete existing profile connection for this org+platform (replace with fresh one)
    await supabase
      .from('social_media_connections')
      .delete()
      .eq('organization_id', orgId)
      .eq('platform', platform)
      .is('platform_page_id', null);

    // Insert fresh profile connection
    const { error: insertError } = await supabase
      .from('social_media_connections')
      .insert({
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
        account_type: tokenData.accountType || 'profile',
        scopes: tokenData.scopes || null,
        is_active: true,
        connected_at: new Date().toISOString(),
        metadata: (tokenData.metadata || {}) as Json,
      });

    if (insertError) {
      console.error('Failed to save social connection:', insertError);
      return NextResponse.redirect(`${baseUrl}/settings?social=error&message=Failed+to+save+connection`);
    }

    console.log(`${platform} connection saved successfully. Metadata pages: ${(tokenData.metadata?.pages as unknown[])?.length || 0}`);

    // If pages are available, redirect to page selector
    const pages = (tokenData.metadata?.pages as unknown[]) || [];
    if (pages.length > 0) {
      console.log(`Redirecting to page selector with ${pages.length} pages`);
      return NextResponse.redirect(`${baseUrl}/settings?social=select&platform=${platform}`);
    }

    console.log(`No pages found, redirecting to connected status`);
    return NextResponse.redirect(`${baseUrl}/settings?social=connected&platform=${platform}`);
  } catch (err) {
    console.error(`OAuth callback error for ${platform}:`, err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.redirect(`${baseUrl}/settings?social=error&message=${encodeURIComponent(message)}`);
  }
}
