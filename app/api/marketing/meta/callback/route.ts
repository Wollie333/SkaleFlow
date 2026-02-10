import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { MetaAdsAdapter } from '@/lib/marketing/platforms/meta-ads';
import { storeAdAccountTokens } from '@/lib/marketing/auth';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
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
  const cookieStore = await cookies();
  const storedState = cookieStore.get('meta_ads_oauth_state')?.value;

  if (!storedState || storedState !== stateParam) {
    return NextResponse.redirect(
      `${baseUrl}/marketing/settings?ad_connect=error&message=Invalid+state`
    );
  }

  // Parse state to get orgId
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
  cookieStore.delete('meta_ads_oauth_state');

  // Check auth
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(`${baseUrl}/login`);
  }

  try {
    const redirectUri = `${baseUrl}/api/marketing/meta/callback`;
    const adapter = new MetaAdsAdapter();
    const tokens = await adapter.exchangeCode(code, redirectUri);

    await storeAdAccountTokens(orgId, 'meta', tokens, user.id);

    return NextResponse.redirect(
      `${baseUrl}/marketing/settings?ad_connect=connected&platform=meta`
    );
  } catch (err) {
    console.error('Meta ads OAuth callback error:', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.redirect(
      `${baseUrl}/marketing/settings?ad_connect=error&message=${encodeURIComponent(message)}`
    );
  }
}
