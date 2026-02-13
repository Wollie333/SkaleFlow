import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import type { Json } from '@/types/database';

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { connectionId, page } = body as {
    connectionId: string;
    page: { id: string; name: string; access_token: string; category: string | null };
  };

  if (!connectionId || !page || !page.id || !page.access_token) {
    return NextResponse.json({ error: 'connectionId and page (with id and access_token) are required' }, { status: 400 });
  }

  const serviceClient = createServiceClient();

  // Fetch the profile connection to get org context
  const { data: profileConn, error: fetchError } = await serviceClient
    .from('social_media_connections')
    .select('*')
    .eq('id', connectionId)
    .single();

  if (fetchError || !profileConn) {
    return NextResponse.json({ error: 'Connection not found' }, { status: 404 });
  }

  // Verify user belongs to this org with owner/admin role
  const { data: membership } = await supabase
    .from('org_members')
    .select('role')
    .eq('user_id', user.id)
    .eq('organization_id', profileConn.organization_id)
    .single();

  if (!membership || !['owner', 'admin'].includes(membership.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Check if this page connection already exists
  const { data: existing } = await serviceClient
    .from('social_media_connections')
    .select('id')
    .eq('organization_id', profileConn.organization_id)
    .eq('platform', profileConn.platform)
    .eq('platform_page_id', page.id)
    .maybeSingle();

  const pageData = {
    organization_id: profileConn.organization_id,
    user_id: user.id,
    platform: profileConn.platform,
    access_token: page.access_token,
    refresh_token: null as string | null,
    token_expires_at: profileConn.token_expires_at,
    platform_user_id: profileConn.platform_user_id,
    platform_username: profileConn.platform_username,
    platform_page_id: page.id,
    platform_page_name: page.name,
    account_type: 'page',
    scopes: profileConn.scopes,
    is_active: true,
    connected_at: new Date().toISOString(),
    metadata: { category: page.category || null } as unknown as Json,
  };

  if (existing) {
    const { error } = await serviceClient
      .from('social_media_connections')
      .update({
        access_token: page.access_token,
        platform_page_name: page.name,
        is_active: true,
        connected_at: new Date().toISOString(),
        metadata: { category: page.category || null } as unknown as Json,
      })
      .eq('id', existing.id);

    if (error) {
      console.error(`[add-page-direct] Failed to update page ${page.id}:`, error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  } else {
    const { error } = await serviceClient
      .from('social_media_connections')
      .insert(pageData);

    if (error) {
      console.error(`[add-page-direct] Failed to insert page ${page.id}:`, error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  // Also add this page to the profile connection metadata so it shows next time
  const metadata = (profileConn.metadata || {}) as Record<string, unknown>;
  const metadataPages = (metadata.pages || []) as Array<{ id: string; name: string; access_token: string; category?: string | null }>;
  if (!metadataPages.find(p => p.id === page.id)) {
    metadataPages.push({
      id: page.id,
      name: page.name,
      access_token: page.access_token,
      category: page.category,
    });
    await serviceClient
      .from('social_media_connections')
      .update({ metadata: { ...metadata, pages: metadataPages } as unknown as Json })
      .eq('id', connectionId);
  }

  console.log(`[add-page-direct] Connected page "${page.name}" (${page.id}) for org ${profileConn.organization_id}`);

  return NextResponse.json({ success: true, pageId: page.id });
}
