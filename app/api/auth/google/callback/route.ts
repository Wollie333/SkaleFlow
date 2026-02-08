import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getOAuth2Client } from '@/lib/google-calendar';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

    if (error) {
      return NextResponse.redirect(`${siteUrl}/settings?google=error&message=${encodeURIComponent(error)}`);
    }

    if (!code) {
      return NextResponse.redirect(`${siteUrl}/settings?google=error&message=No+authorization+code`);
    }

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.redirect(`${siteUrl}/login`);
    }

    // Exchange code for tokens
    const oauth2Client = getOAuth2Client();
    const { tokens } = await oauth2Client.getToken(code);

    if (!tokens.access_token || !tokens.refresh_token) {
      return NextResponse.redirect(`${siteUrl}/settings?google=error&message=Missing+tokens`);
    }

    // Upsert into google_integrations
    const { error: upsertError } = await supabase
      .from('google_integrations')
      .upsert(
        {
          user_id: user.id,
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          token_expires_at: new Date(tokens.expiry_date!).toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      );

    if (upsertError) {
      console.error('Failed to save Google tokens:', upsertError);
      return NextResponse.redirect(`${siteUrl}/settings?google=error&message=Failed+to+save+tokens`);
    }

    return NextResponse.redirect(`${siteUrl}/settings?google=connected`);
  } catch (error) {
    console.error('Google OAuth callback error:', error);
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    return NextResponse.redirect(`${siteUrl}/settings?google=error&message=OAuth+callback+failed`);
  }
}
