import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthUrl, getRedirectUri, isValidPlatform } from '@/lib/social/auth';
import { cookies } from 'next/headers';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ platform: string }> }
) {
  const { platform } = await params;

  console.log(`[social-auth] ▶ Starting OAuth for platform: ${platform}`);

  if (!isValidPlatform(platform)) {
    console.log(`[social-auth] ✗ Invalid platform: ${platform}`);
    return NextResponse.json({ error: 'Invalid platform' }, { status: 400 });
  }

  const supabase = await createClient();

  // Check auth
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.log(`[social-auth] ✗ No authenticated user`);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  console.log(`[social-auth] ✓ User: ${user.id} (${user.email})`);

  // Check org membership (must be owner or admin)
  const { data: membership } = await supabase
    .from('org_members')
    .select('organization_id, role')
    .eq('user_id', user.id)
    .single();

  if (!membership || !['owner', 'admin'].includes(membership.role)) {
    console.log(`[social-auth] ✗ User role: ${membership?.role || 'none'} — not owner/admin`);
    return NextResponse.json({ error: 'Only org owners and admins can connect social accounts' }, { status: 403 });
  }
  console.log(`[social-auth] ✓ Org: ${membership.organization_id}, role: ${membership.role}`);

  // Generate state for CSRF protection
  const state = crypto.randomUUID();

  // Store state in cookie for verification on callback
  const cookieStore = await cookies();
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

  // For Twitter PKCE: store state as code_verifier in cookie
  if (platform === 'twitter') {
    cookieStore.set(`social_oauth_pkce_${platform}`, state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600,
      path: '/',
    });
  }

  const redirectUri = getRedirectUri(platform);
  const authUrl = getAuthUrl(platform, state, redirectUri);

  return NextResponse.redirect(authUrl);
}
