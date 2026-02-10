import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

function getTikTokAppId(): string {
  const id = process.env.TIKTOK_ADS_APP_ID;
  if (!id) throw new Error('TIKTOK_ADS_APP_ID environment variable is not set');
  return id;
}

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
  cookieStore.set('tiktok_ads_oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600, // 10 minutes
    path: '/',
  });

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const redirectUri = `${baseUrl}/api/marketing/tiktok/callback`;

  const params = new URLSearchParams({
    app_id: getTikTokAppId(),
    redirect_uri: redirectUri,
    state,
    scope: 'advertiser_management,campaign_creation,campaign_read,audience_management',
    response_type: 'code',
  });

  const authUrl = `https://business-api.tiktok.com/portal/auth?${params}`;

  return NextResponse.redirect(authUrl);
}
