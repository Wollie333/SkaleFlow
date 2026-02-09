import { createServiceClient } from '@/lib/supabase/server';
import { getAdapter } from './auth';
import type { SocialPlatform, TokenData } from './types';

const TOKEN_REFRESH_BUFFER_MS = 5 * 60 * 1000; // 5 minutes before expiry

export interface ConnectionWithTokens {
  id: string;
  organization_id: string;
  platform: SocialPlatform;
  access_token: string;
  refresh_token: string | null;
  token_expires_at: string | null;
  platform_user_id: string | null;
  platform_username: string | null;
  platform_page_id: string | null;
  platform_page_name: string | null;
  account_type: string;
  is_active: boolean;
}

export function connectionToTokenData(conn: ConnectionWithTokens): TokenData {
  return {
    accessToken: conn.access_token,
    refreshToken: conn.refresh_token,
    expiresAt: conn.token_expires_at ? new Date(conn.token_expires_at) : null,
    platformUserId: conn.platform_user_id || undefined,
    platformUsername: conn.platform_username || undefined,
    platformPageId: conn.platform_page_id || undefined,
    platformPageName: conn.platform_page_name || undefined,
  };
}

export function isTokenExpiring(tokenExpiresAt: string | null): boolean {
  if (!tokenExpiresAt) return false;
  const expiresAt = new Date(tokenExpiresAt).getTime();
  return Date.now() + TOKEN_REFRESH_BUFFER_MS >= expiresAt;
}

export async function ensureValidToken(connection: ConnectionWithTokens): Promise<TokenData> {
  if (!isTokenExpiring(connection.token_expires_at)) {
    return connectionToTokenData(connection);
  }

  if (!connection.refresh_token) {
    // Mark connection as inactive
    const supabase = createServiceClient();
    await supabase
      .from('social_media_connections')
      .update({ is_active: false })
      .eq('id', connection.id);

    throw new Error(`${connection.platform} token expired and no refresh token available. Please reconnect.`);
  }

  try {
    const adapter = getAdapter(connection.platform);
    const newTokens = await adapter.refreshToken(connection.refresh_token);

    // Update tokens in DB
    const supabase = createServiceClient();
    await supabase
      .from('social_media_connections')
      .update({
        access_token: newTokens.accessToken,
        refresh_token: newTokens.refreshToken || connection.refresh_token,
        token_expires_at: newTokens.expiresAt?.toISOString() || null,
      })
      .eq('id', connection.id);

    return newTokens;
  } catch (error) {
    // Mark connection as inactive on refresh failure
    const supabase = createServiceClient();
    await supabase
      .from('social_media_connections')
      .update({ is_active: false })
      .eq('id', connection.id);

    throw error;
  }
}
