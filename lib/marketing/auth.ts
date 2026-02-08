import { createServiceClient } from '@/lib/supabase/server';
import type { AdTokenData, AdPlatform } from './types';

/**
 * Store ad account tokens after OAuth callback
 */
export async function storeAdAccountTokens(
  organizationId: string,
  platform: AdPlatform,
  tokens: AdTokenData,
  connectedBy: string
): Promise<string> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('ad_accounts')
    .upsert(
      {
        organization_id: organizationId,
        platform,
        account_name: tokens.platformAccountName || `${platform} Ad Account`,
        platform_account_id: tokens.platformAccountId || '',
        access_token: tokens.accessToken,
        refresh_token: tokens.refreshToken || null,
        token_expires_at: tokens.expiresAt?.toISOString() || null,
        scopes: tokens.scopes || [],
        is_active: true,
        connected_by: connectedBy,
        metadata: (tokens.metadata || {}) as any,
      },
      { onConflict: 'organization_id,platform' }
    )
    .select('id')
    .single();

  if (error || !data) {
    throw new Error(`Failed to store ad account: ${error?.message || 'unknown'}`);
  }

  return data.id;
}

/**
 * Get active ad account tokens for an org + platform
 */
export async function getAdAccountTokens(
  organizationId: string,
  platform: AdPlatform
): Promise<{ id: string; tokens: AdTokenData } | null> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('ad_accounts')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('platform', platform)
    .eq('is_active', true)
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    tokens: {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: data.token_expires_at ? new Date(data.token_expires_at) : null,
      scopes: data.scopes || [],
      platformAccountId: data.platform_account_id,
      platformAccountName: data.account_name,
    },
  };
}

/**
 * Check if tokens are expired or about to expire (within 1 hour)
 */
export function isTokenExpired(expiresAt: Date | null): boolean {
  if (!expiresAt) return false;
  const buffer = 60 * 60 * 1000; // 1 hour
  return new Date().getTime() > expiresAt.getTime() - buffer;
}

/**
 * Update stored tokens after refresh
 */
export async function updateAdAccountTokens(
  accountId: string,
  tokens: Partial<AdTokenData>
): Promise<void> {
  const supabase = createServiceClient();

  const updateData: Record<string, any> = { updated_at: new Date().toISOString() };
  if (tokens.accessToken) updateData.access_token = tokens.accessToken;
  if (tokens.refreshToken !== undefined) updateData.refresh_token = tokens.refreshToken;
  if (tokens.expiresAt !== undefined) updateData.token_expires_at = tokens.expiresAt?.toISOString() || null;

  await supabase
    .from('ad_accounts')
    .update(updateData)
    .eq('id', accountId);
}

/**
 * Disconnect (deactivate) an ad account
 */
export async function disconnectAdAccount(accountId: string): Promise<void> {
  const supabase = createServiceClient();

  await supabase
    .from('ad_accounts')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', accountId);
}
