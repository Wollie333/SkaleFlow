import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getGmailAuthUrl } from '@/lib/email/gmail';
import { cookies } from 'next/headers';

export async function GET() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.redirect(new URL('/login', siteUrl));
    }

    // Get org membership (any role — per-user connection)
    const { data: membership } = await supabase
      .from('org_members')
      .select('organization_id, role')
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return NextResponse.redirect(new URL('/settings?tab=integrations&gmail=error&message=No+organization+found', siteUrl));
    }

    // Generate CSRF state
    const state = JSON.stringify({
      userId: user.id,
      organizationId: membership.organization_id,
      csrf: Math.random().toString(36).substring(2),
    });

    // Store state in cookie for verification
    const cookieStore = await cookies();
    cookieStore.set('gmail_oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 600,
      sameSite: 'lax',
      path: '/',
    });

    const authUrl = getGmailAuthUrl(state);
    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error('Gmail auth error:', error);
    return NextResponse.redirect(new URL('/settings?tab=integrations&gmail=error', siteUrl));
  }
}
