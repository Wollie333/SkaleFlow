import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { SocialPlatform } from '@/types/database';

interface PageInfo {
  id: string;
  name: string;
  access_token: string;
  category?: string | null;
}

const VALID_PLATFORMS = ['linkedin', 'facebook', 'instagram', 'twitter', 'tiktok', 'youtube'];

export async function GET(request: NextRequest) {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const platform = request.nextUrl.searchParams.get('platform');
  if (!platform || !VALID_PLATFORMS.includes(platform)) {
    return NextResponse.json({ error: 'Valid platform query param is required' }, { status: 400 });
  }
  const platformTyped = platform as SocialPlatform;

  // Get user's org
  const { data: membership } = await supabase
    .from('org_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .single();

  if (!membership) {
    return NextResponse.json({ error: 'No organization found' }, { status: 404 });
  }

  // Fetch the profile connection for this platform
  const { data: profileConn } = await supabase
    .from('social_media_connections')
    .select('id, metadata')
    .eq('organization_id', membership.organization_id)
    .eq('platform', platformTyped)
    .eq('account_type', 'profile')
    .single();

  if (!profileConn) {
    return NextResponse.json({ error: 'No profile connection found for this platform' }, { status: 404 });
  }

  const metadata = (profileConn.metadata || {}) as Record<string, unknown>;
  const availablePages = (metadata.pages || []) as PageInfo[];

  // Fetch existing page connections to mark which are already connected
  const { data: existingPages } = await supabase
    .from('social_media_connections')
    .select('platform_page_id')
    .eq('organization_id', membership.organization_id)
    .eq('platform', platformTyped)
    .eq('account_type', 'page');

  const connectedPageIds = new Set((existingPages || []).map(p => p.platform_page_id));

  const pages = availablePages.map(p => ({
    id: p.id,
    name: p.name,
    category: p.category || null,
    isConnected: connectedPageIds.has(p.id),
  }));

  return NextResponse.json({
    connectionId: profileConn.id,
    pages,
  });
}
