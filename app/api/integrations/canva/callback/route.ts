import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { exchangeCode } from '@/lib/canva/auth';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  if (error) {
    return NextResponse.redirect(`${baseUrl}/settings?tab=integrations&canva=error&message=${encodeURIComponent(error)}`);
  }

  if (!code) {
    return NextResponse.redirect(`${baseUrl}/settings?tab=integrations&canva=error&message=No+authorization+code`);
  }

  const cookieStore = await cookies();

  // Verify state (CSRF protection)
  const storedState = cookieStore.get('canva_oauth_state')?.value;
  if (!storedState || storedState !== state) {
    return NextResponse.redirect(`${baseUrl}/settings?tab=integrations&canva=error&message=Invalid+state`);
  }

  // Get org ID and PKCE verifier from cookies
  const orgId = cookieStore.get('canva_oauth_org')?.value;
  if (!orgId) {
    return NextResponse.redirect(`${baseUrl}/settings?tab=integrations&canva=error&message=Missing+organization`);
  }

  const codeVerifier = cookieStore.get('canva_oauth_pkce')?.value;
  if (!codeVerifier) {
    return NextResponse.redirect(`${baseUrl}/settings?tab=integrations&canva=error&message=Missing+PKCE+verifier`);
  }

  // Clean up cookies
  cookieStore.delete('canva_oauth_state');
  cookieStore.delete('canva_oauth_org');
  cookieStore.delete('canva_oauth_pkce');

  // Check auth
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(`${baseUrl}/login`);
  }

  try {
    const tokenData = await exchangeCode(code, codeVerifier);

    // Use service client for DB operations (auth cookie may not survive redirect)
    const serviceClient = createServiceClient();

    // Delete existing Canva connections for this org (one connection per org)
    await serviceClient
      .from('canva_connections')
      .delete()
      .eq('organization_id', orgId);

    // Insert new connection
    const { error: insertError } = await serviceClient
      .from('canva_connections')
      .insert({
        organization_id: orgId,
        user_id: user.id,
        access_token: tokenData.accessToken,
        refresh_token: tokenData.refreshToken,
        token_expires_at: tokenData.expiresAt.toISOString(),
        canva_user_id: tokenData.canvaUserId || null,
        scopes: tokenData.scopes,
        is_active: true,
        connected_at: new Date().toISOString(),
      });

    if (insertError) {
      console.error('[canva-callback] Failed to save connection:', insertError);
      return NextResponse.redirect(`${baseUrl}/settings?tab=integrations&canva=error&message=Failed+to+save+connection`);
    }

    return NextResponse.redirect(`${baseUrl}/settings?tab=integrations&canva=connected`);
  } catch (err) {
    console.error('[canva-callback] OAuth error:', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.redirect(`${baseUrl}/settings?tab=integrations&canva=error&message=${encodeURIComponent(message)}`);
  }
}
