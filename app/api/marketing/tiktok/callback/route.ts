import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { storeAdAccountTokens } from '@/lib/marketing/auth';
import type { AdTokenData } from '@/lib/marketing/types';
import { cookies } from 'next/headers';

function getTikTokAppId(): string {
  const id = process.env.TIKTOK_ADS_APP_ID;
  if (!id) throw new Error('TIKTOK_ADS_APP_ID environment variable is not set');
  return id;
}

function getTikTokAppSecret(): string {
  const secret = process.env.TIKTOK_ADS_APP_SECRET;
  if (!secret) throw new Error('TIKTOK_ADS_APP_SECRET environment variable is not set');
  return secret;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('auth_code') || searchParams.get('code');
  const stateParam = searchParams.get('state');
  const error = searchParams.get('error');
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  if (error) {
    return NextResponse.redirect(
      `${baseUrl}/marketing/settings?ad_connect=error&message=${encodeURIComponent(error)}`
    );
  }

  if (!code) {
    return NextResponse.redirect(
      `${baseUrl}/marketing/settings?ad_connect=error&message=No+authorization+code`
    );
  }

  // Verify state (CSRF protection)
  const cookieStore = cookies();
  const storedState = cookieStore.get('tiktok_ads_oauth_state')?.value;

  if (!storedState || storedState !== stateParam) {
    return NextResponse.redirect(
      `${baseUrl}/marketing/settings?ad_connect=error&message=Invalid+state`
    );
  }

  let orgId: string;
  try {
    const parsed = JSON.parse(storedState);
    orgId = parsed.orgId;
  } catch {
    return NextResponse.redirect(
      `${baseUrl}/marketing/settings?ad_connect=error&message=Invalid+state+format`
    );
  }

  // Clean up cookie
  cookieStore.delete('tiktok_ads_oauth_state');

  // Check auth
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(`${baseUrl}/login`);
  }

  try {
    // Exchange authorization code for access token
    const tokenRes = await fetch('https://business-api.tiktok.com/open_api/v1.3/oauth2/access_token/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        app_id: getTikTokAppId(),
        secret: getTikTokAppSecret(),
        auth_code: code,
      }),
    });

    const tokenJson = await tokenRes.json();

    if (tokenJson.code !== 0 || !tokenJson.data?.access_token) {
      throw new Error(tokenJson.message || 'Failed to exchange TikTok authorization code');
    }

    const tokenData = tokenJson.data;

    // Get advertiser accounts
    const advertiserRes = await fetch('https://business-api.tiktok.com/open_api/v1.3/oauth2/advertiser/get/', {
      method: 'GET',
      headers: {
        'Access-Token': tokenData.access_token,
      },
    });

    const advertiserJson = await advertiserRes.json();
    const advertisers = advertiserJson.data?.list || [];
    const firstAdvertiser = advertisers[0];

    const tokens: AdTokenData = {
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token || null,
      expiresAt: tokenData.access_token_expires_in
        ? new Date(Date.now() + tokenData.access_token_expires_in * 1000)
        : null,
      scopes: tokenData.scope ? tokenData.scope.split(',') : [],
      platformAccountId: firstAdvertiser?.advertiser_id?.toString() || '',
      platformAccountName: firstAdvertiser?.advertiser_name || 'TikTok Ad Account',
      metadata: {
        advertisers,
        creatorId: tokenData.creator_id,
      },
    };

    await storeAdAccountTokens(orgId, 'tiktok', tokens, user.id);

    return NextResponse.redirect(
      `${baseUrl}/marketing/settings?ad_connect=connected&platform=tiktok`
    );
  } catch (err) {
    console.error('TikTok ads OAuth callback error:', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.redirect(
      `${baseUrl}/marketing/settings?ad_connect=error&message=${encodeURIComponent(message)}`
    );
  }
}
