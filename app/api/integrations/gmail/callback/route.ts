import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { exchangeGmailCode, getGmailProfile } from '@/lib/email/gmail';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  try {
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');

    if (error) {
      return NextResponse.redirect(new URL(`/settings?tab=integrations&gmail=error&message=${encodeURIComponent(error)}`, siteUrl));
    }

    if (!code || !state) {
      return NextResponse.redirect(new URL('/settings?tab=integrations&gmail=error&message=Missing+authorization+code', siteUrl));
    }

    // Verify CSRF state
    const cookieStore = await cookies();
    const storedState = cookieStore.get('gmail_oauth_state')?.value;
    if (!storedState || storedState !== state) {
      return NextResponse.redirect(new URL(`/settings?tab=integrations&gmail=error&message=${encodeURIComponent('State mismatch — please try again')}`, siteUrl));
    }

    // Clear state cookie
    cookieStore.delete('gmail_oauth_state');

    const parsedState = JSON.parse(state);
    const { userId, organizationId } = parsedState;

    // Verify user is still authenticated
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.id !== userId) {
      return NextResponse.redirect(new URL('/settings?tab=integrations&gmail=error&message=Authentication+mismatch', siteUrl));
    }

    // Exchange code for tokens
    let tokens;
    try {
      tokens = await exchangeGmailCode(code);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Token exchange failed';
      console.error('Gmail token exchange error:', msg);
      return NextResponse.redirect(new URL(`/settings?tab=integrations&gmail=error&message=${encodeURIComponent('Token exchange: ' + msg)}`, siteUrl));
    }

    // Get Gmail profile (email + initial historyId)
    let profile;
    try {
      profile = await getGmailProfile(tokens.access_token);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Profile fetch failed';
      console.error('Gmail profile error:', msg);
      return NextResponse.redirect(new URL(`/settings?tab=integrations&gmail=error&message=${encodeURIComponent('Gmail API: ' + msg)}`, siteUrl));
    }

    // Deactivate existing Gmail connection for this user
    const serviceClient = createServiceClient();
    await serviceClient
      .from('authority_email_connections')
      .update({ is_active: false, sync_enabled: false, updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('provider', 'gmail');

    // Insert new connection
    const { error: insertError } = await serviceClient
      .from('authority_email_connections')
      .insert({
        user_id: userId,
        organization_id: organizationId,
        provider: 'gmail',
        email_address: profile.email,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        token_expires_at: new Date(tokens.expiry_date).toISOString(),
        last_history_id: profile.historyId,
        is_active: true,
        sync_enabled: true,
        connected_at: new Date().toISOString(),
      });

    if (insertError) {
      console.error('Gmail DB insert error:', insertError);
      return NextResponse.redirect(new URL(`/settings?tab=integrations&gmail=error&message=${encodeURIComponent('DB: ' + insertError.message)}`, siteUrl));
    }

    return NextResponse.redirect(new URL('/settings?tab=integrations&gmail=connected', siteUrl));
  } catch (error) {
    console.error('Gmail callback error:', error);
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.redirect(new URL(`/settings?tab=integrations&gmail=error&message=${encodeURIComponent(msg)}`, siteUrl));
  }
}
