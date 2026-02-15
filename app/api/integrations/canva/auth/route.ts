import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthUrlWithPKCE } from '@/lib/canva/auth';
import { cookies } from 'next/headers';

export async function GET() {
  const supabase = await createClient();

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
    return NextResponse.json({ error: 'Only org owners and admins can connect Canva' }, { status: 403 });
  }

  // Generate state for CSRF protection
  const state = crypto.randomUUID();

  // Generate PKCE auth URL
  const { authUrl, codeVerifier } = getAuthUrlWithPKCE(state);

  // Store state, org ID, and PKCE verifier in httpOnly cookies
  const cookieStore = await cookies();
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: 600, // 10 minutes
    path: '/',
  };

  cookieStore.set('canva_oauth_state', state, cookieOptions);
  cookieStore.set('canva_oauth_org', membership.organization_id, cookieOptions);
  cookieStore.set('canva_oauth_pkce', codeVerifier, cookieOptions);

  return NextResponse.redirect(authUrl);
}
