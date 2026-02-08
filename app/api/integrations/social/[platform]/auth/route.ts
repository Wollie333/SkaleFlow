import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthUrl, getRedirectUri, isValidPlatform } from '@/lib/social/auth';
import { cookies } from 'next/headers';

export async function GET(
  request: NextRequest,
  { params }: { params: { platform: string } }
) {
  const { platform } = params;

  if (!isValidPlatform(platform)) {
    return NextResponse.json({ error: 'Invalid platform' }, { status: 400 });
  }

  const supabase = createClient();

  // Check auth
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check org membership (must be owner or admin)
  const { data: membership } = await supabase
    .from('org_members')
    .select('organization_id, role')
    .eq('user_id', user.id)
    .single();

  if (!membership || !['owner', 'admin'].includes(membership.role)) {
    return NextResponse.json({ error: 'Only org owners and admins can connect social accounts' }, { status: 403 });
  }

  // Generate state for CSRF protection
  const state = crypto.randomUUID();

  // Store state in cookie for verification on callback
  const cookieStore = cookies();
  cookieStore.set(`social_oauth_state_${platform}`, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600, // 10 minutes
    path: '/',
  });

  // Store org ID in cookie so callback can associate the connection
  cookieStore.set(`social_oauth_org_${platform}`, membership.organization_id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600,
    path: '/',
  });

  const redirectUri = getRedirectUri(platform);
  const authUrl = getAuthUrl(platform, state, redirectUri);

  return NextResponse.redirect(authUrl);
}
