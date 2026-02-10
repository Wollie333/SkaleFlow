import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { Json } from '@/types/database';

interface PageInfo {
  id: string;
  name: string;
  access_token: string;
  category?: string | null;
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { connectionId, pageIds } = body as { connectionId: string; pageIds: string[] };

  if (!connectionId || !pageIds || pageIds.length === 0) {
    return NextResponse.json({ error: 'connectionId and pageIds are required' }, { status: 400 });
  }

  // Fetch the profile connection
  const { data: profileConn, error: fetchError } = await supabase
    .from('social_media_connections')
    .select('*')
    .eq('id', connectionId)
    .single();

  if (fetchError || !profileConn) {
    return NextResponse.json({ error: 'Connection not found' }, { status: 404 });
  }

  // Verify user belongs to this org
  const { data: membership } = await supabase
    .from('org_members')
    .select('role')
    .eq('user_id', user.id)
    .eq('organization_id', profileConn.organization_id)
    .single();

  if (!membership || !['owner', 'admin'].includes(membership.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Read pages from metadata
  const metadata = (profileConn.metadata || {}) as Record<string, unknown>;
  const availablePages = (metadata.pages || []) as PageInfo[];

  const added: string[] = [];
  const errors: Array<{ pageId: string; error: string }> = [];

  for (const pageId of pageIds) {
    const page = availablePages.find(p => p.id === pageId);
    if (!page) {
      errors.push({ pageId, error: 'Page not found in connection metadata' });
      continue;
    }

    // Upsert a page connection (unique on org+platform+page_id)
    const { error: upsertError } = await supabase
      .from('social_media_connections')
      .upsert(
        {
          organization_id: profileConn.organization_id,
          user_id: user.id,
          platform: profileConn.platform,
          access_token: page.access_token,
          refresh_token: null,
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
        },
        { onConflict: 'idx_social_connections_org_platform_page' }
      );

    if (upsertError) {
      // If onConflict name doesn't work, try insert and handle duplicate
      const { error: insertError } = await supabase
        .from('social_media_connections')
        .insert({
          organization_id: profileConn.organization_id,
          user_id: user.id,
          platform: profileConn.platform,
          access_token: page.access_token,
          refresh_token: null,
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
        });

      if (insertError) {
        // Likely duplicate — update instead
        const { error: updateError } = await supabase
          .from('social_media_connections')
          .update({
            access_token: page.access_token,
            platform_page_name: page.name,
            is_active: true,
            connected_at: new Date().toISOString(),
          })
          .eq('organization_id', profileConn.organization_id)
          .eq('platform', profileConn.platform)
          .eq('platform_page_id', page.id);

        if (updateError) {
          errors.push({ pageId, error: updateError.message });
          continue;
        }
      }
    }

    added.push(pageId);
  }

  return NextResponse.json({ added, errors });
}
