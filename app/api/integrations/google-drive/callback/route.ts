import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { exchangeDriveCode, getDriveOAuth2Client } from '@/lib/google-drive';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  try {
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');

    if (error) {
      return NextResponse.redirect(new URL(`/settings?gdrive=error&message=${encodeURIComponent(error)}`, siteUrl));
    }

    if (!code || !state) {
      return NextResponse.redirect(new URL('/settings?gdrive=error&message=Missing+authorization+code', siteUrl));
    }

    // Verify CSRF state
    const cookieStore = await cookies();
    const storedState = cookieStore.get('gdrive_oauth_state')?.value;
    if (!storedState || storedState !== state) {
      return NextResponse.redirect(new URL('/settings?gdrive=error&message=Invalid+state', siteUrl));
    }

    // Clear state cookie
    cookieStore.delete('gdrive_oauth_state');

    const parsedState = JSON.parse(state);
    const { userId, organizationId } = parsedState;

    // Verify user is still authenticated
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.id !== userId) {
      return NextResponse.redirect(new URL('/settings?gdrive=error&message=Authentication+mismatch', siteUrl));
    }

    // Exchange code for tokens
    const tokens = await exchangeDriveCode(code);

    // Get the user's email from Google
    let driveEmail: string | null = null;
    try {
      const client = getDriveOAuth2Client();
      client.setCredentials({ access_token: tokens.access_token });
      const res = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });
      if (res.ok) {
        const info = await res.json();
        driveEmail = info.email || null;
      }
    } catch {
      // Non-critical — proceed without email
    }

    // Deactivate any existing connections for this org
    await supabase
      .from('google_drive_connections')
      .update({ is_active: false })
      .eq('organization_id', organizationId);

    // Upsert the new connection
    await supabase
      .from('google_drive_connections')
      .insert({
        organization_id: organizationId,
        user_id: userId,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        token_expires_at: new Date(tokens.expiry_date).toISOString(),
        drive_email: driveEmail,
        is_active: true,
        connected_at: new Date().toISOString(),
      });

    return NextResponse.redirect(new URL('/settings?gdrive=connected', siteUrl));
  } catch (error) {
    console.error('Google Drive callback error:', error);
    return NextResponse.redirect(new URL('/settings?gdrive=error&message=Failed+to+connect', siteUrl));
  }
}
