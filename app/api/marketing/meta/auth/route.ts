import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { MetaAdsAdapter } from '@/lib/marketing/platforms/meta-ads';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Check org membership â€” must be owner or admin
  const { data: membership } = await supabase
    .from('org_members')
    .select('organization_id, role')
    .eq('user_id', user.id)
    .single();

  if (!membership || !['owner', 'admin'].includes(membership.role)) {
    return NextResponse.json({ error: 'Only org owners and admins can connect ad accounts' }, { status: 403 });
  }

  // Generate state for CSRF protection
  const state = JSON.stringify({
    nonce: crypto.randomUUID(),
    orgId: membership.organization_id,
    redirect: '/marketing/settings',
  });

  // Store state in cookie for verification on callback
  const cookieStore = await cookies();
  cookieStore.set('meta_ads_oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600, // 10 minutes
    path: '/',
  });

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const redirectUri = `${baseUrl}/api/marketing/meta/callback`;

  const adapter = new MetaAdsAdapter();
  const authUrl = adapter.getAuthUrl(state, redirectUri);

  return NextResponse.redirect(authUrl);
}
