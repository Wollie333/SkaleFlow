import { createServiceClient } from '@/lib/supabase/server';
import { refreshToken } from './auth';

const TOKEN_REFRESH_BUFFER_MS = 5 * 60 * 1000; // 5 minutes before expiry

export interface CanvaConnection {
  id: string;
  organization_id: string;
  user_id: string;
  access_token: string;
  refresh_token: string;
  token_expires_at: string;
  canva_user_id: string | null;
  scopes: string[] | null;
  is_active: boolean;
}

export function isTokenExpiring(tokenExpiresAt: string | null): boolean {
  if (!tokenExpiresAt) return false;
  const expiresAt = new Date(tokenExpiresAt).getTime();
  return Date.now() + TOKEN_REFRESH_BUFFER_MS >= expiresAt;
}

export async function ensureValidToken(connection: CanvaConnection): Promise<string> {
  if (!isTokenExpiring(connection.token_expires_at)) {
    return connection.access_token;
  }

  if (!connection.refresh_token) {
    const supabase = createServiceClient();
    await supabase
      .from('canva_connections')
      .update({ is_active: false })
      .eq('id', connection.id);

    throw new Error('Canva token expired and no refresh token available. Please reconnect.');
  }

  try {
    const newTokens = await refreshToken(connection.refresh_token);

    const supabase = createServiceClient();
    await supabase
      .from('canva_connections')
      .update({
        access_token: newTokens.accessToken,
        refresh_token: newTokens.refreshToken,
        token_expires_at: newTokens.expiresAt.toISOString(),
      })
      .eq('id', connection.id);

    return newTokens.accessToken;
  } catch (error) {
    const supabase = createServiceClient();
    await supabase
      .from('canva_connections')
      .update({ is_active: false })
      .eq('id', connection.id);

    throw error;
  }
}

export async function getActiveConnection(organizationId: string): Promise<{ connection: CanvaConnection; accessToken: string } | null> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from('canva_connections')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('is_active', true)
    .order('connected_at', { ascending: false })
    .limit(1)
    .single();

  if (!data) return null;

  const connection = data as CanvaConnection;
  const accessToken = await ensureValidToken(connection);

  return { connection, accessToken };
}
