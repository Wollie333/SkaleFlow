import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getDriveAuthUrl } from '@/lib/google-drive';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.redirect(new URL('/login', process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'));
    }

    // Check org membership and role
    const { data: membership } = await supabase
      .from('org_members')
      .select('organization_id, role')
      .eq('user_id', user.id)
      .single();

    if (!membership || !['owner', 'admin'].includes(membership.role)) {
      return NextResponse.redirect(new URL('/settings?gdrive=error&message=Only+owners+and+admins+can+connect+Google+Drive', process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'));
    }

    // Generate CSRF state
    const state = JSON.stringify({
      userId: user.id,
      organizationId: membership.organization_id,
      csrf: Math.random().toString(36).substring(2),
    });

    // Store state in cookie for verification
    const cookieStore = await cookies();
    cookieStore.set('gdrive_oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 600, // 10 minutes
      sameSite: 'lax',
      path: '/',
    });

    const authUrl = getDriveAuthUrl(state);
    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error('Google Drive auth error:', error);
    return NextResponse.redirect(new URL('/settings?gdrive=error', process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'));
  }
}
