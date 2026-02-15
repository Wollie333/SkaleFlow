import { createServiceClient } from '@/lib/supabase/server';
import { decryptApiKey } from '@/lib/encryption';

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

interface CachedKey {
  apiKey: string | null;
  timestamp: number;
}

// In-memory cache: userId:provider -> decrypted key
const keyCache = new Map<string, CachedKey>();

// In-memory cache for ai_beta_enabled status
const betaStatusCache = new Map<string, { enabled: boolean; timestamp: number }>();

function cacheKey(userId: string, provider: string): string {
  return `${userId}:${provider}`;
}

function isCacheValid(timestamp: number): boolean {
  return Date.now() - timestamp < CACHE_TTL_MS;
}

export async function isAiBetaEnabled(userId: string): Promise<boolean> {
  // Check cache
  const cached = betaStatusCache.get(userId);
  if (cached && isCacheValid(cached.timestamp)) {
    return cached.enabled;
  }

  const supabase = createServiceClient();
  const { data } = await supabase
    .from('users')
    .select('ai_beta_enabled')
    .eq('id', userId)
    .single();

  const enabled = data?.ai_beta_enabled === true;
  betaStatusCache.set(userId, { enabled, timestamp: Date.now() });
  return enabled;
}

export async function getUserApiKey(userId: string, provider: string): Promise<string | null> {
  const ck = cacheKey(userId, provider);

  // Check cache
  const cached = keyCache.get(ck);
  if (cached && isCacheValid(cached.timestamp)) {
    return cached.apiKey;
  }

  const supabase = createServiceClient();
  const { data } = await supabase
    .from('user_api_keys')
    .select('encrypted_key, key_iv, is_valid')
    .eq('user_id', userId)
    .eq('provider', provider)
    .eq('is_valid', true)
    .single();

  if (!data) {
    keyCache.set(ck, { apiKey: null, timestamp: Date.now() });
    return null;
  }

  try {
    const apiKey = decryptApiKey(data.encrypted_key, data.key_iv);
    keyCache.set(ck, { apiKey, timestamp: Date.now() });
    return apiKey;
  } catch (err) {
    console.error(`[USER-KEYS] Failed to decrypt key for ${userId}/${provider}:`, err);
    keyCache.set(ck, { apiKey: null, timestamp: Date.now() });
    return null;
  }
}

export function invalidateUserKeyCache(userId: string): void {
  // Clear all cached keys for this user
  const providers = ['anthropic', 'google', 'groq', 'openai'];
  for (const provider of providers) {
    keyCache.delete(cacheKey(userId, provider));
  }
  betaStatusCache.delete(userId);
}
