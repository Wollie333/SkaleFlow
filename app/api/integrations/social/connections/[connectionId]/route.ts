import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAdapter } from '@/lib/social/auth';
import type { SocialPlatform } from '@/lib/social/types';

// DELETE: Disconnect a social account
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { connectionId: string } }
) {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get the connection
  const { data: connection, error: fetchError } = await supabase
    .from('social_media_connections')
    .select('*')
    .eq('id', params.connectionId)
    .single();

  if (fetchError || !connection) {
    return NextResponse.json({ error: 'Connection not found' }, { status: 404 });
  }

  // Verify user has permission (org owner/admin)
  const { data: membership } = await supabase
    .from('org_members')
    .select('role')
    .eq('user_id', user.id)
    .eq('organization_id', connection.organization_id)
    .single();

  if (!membership || !['owner', 'admin'].includes(membership.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Try to revoke access on the platform
  try {
    const adapter = getAdapter(connection.platform as SocialPlatform);
    await adapter.revokeAccess({
      accessToken: connection.access_token,
      refreshToken: connection.refresh_token,
      expiresAt: connection.token_expires_at ? new Date(connection.token_expires_at) : null,
    });
  } catch (err) {
    console.warn('Failed to revoke platform access (continuing with deletion):', err);
  }

  // Delete the connection
  const { error: deleteError } = await supabase
    .from('social_media_connections')
    .delete()
    .eq('id', params.connectionId);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

// POST: Force token refresh
export async function POST(
  _request: NextRequest,
  { params }: { params: { connectionId: string } }
) {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: connection, error: fetchError } = await supabase
    .from('social_media_connections')
    .select('*')
    .eq('id', params.connectionId)
    .single();

  if (fetchError || !connection) {
    return NextResponse.json({ error: 'Connection not found' }, { status: 404 });
  }

  if (!connection.refresh_token) {
    return NextResponse.json({ error: 'No refresh token available. Please reconnect.' }, { status: 400 });
  }

  try {
    const adapter = getAdapter(connection.platform as SocialPlatform);
    const newTokens = await adapter.refreshToken(connection.refresh_token);

    await supabase
      .from('social_media_connections')
      .update({
        access_token: newTokens.accessToken,
        refresh_token: newTokens.refreshToken || connection.refresh_token,
        token_expires_at: newTokens.expiresAt?.toISOString() || null,
        is_active: true,
      })
      .eq('id', params.connectionId);

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Token refresh failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
