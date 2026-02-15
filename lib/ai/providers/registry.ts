/**
 * SERVER-ONLY provider registry.
 * This file imports API adapters that instantiate SDK clients.
 * DO NOT import this file in client components - use catalog.ts instead.
 */

import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Groq from 'groq-sdk';
import type { AIProviderAdapter } from './types';
import { anthropicAdapter, createAnthropicComplete } from './anthropic';
import { googleAdapter, createGoogleComplete } from './google';
import { groqAdapter, createGroqComplete } from './groq';
import { isAiBetaEnabled, getUserApiKey } from '../user-keys';

// Re-export client-safe functions from catalog
export { MODEL_CATALOG, getModelConfig, getModelsForFeature, getDefaultModelForFeature } from './catalog';

/**
 * SERVER-ONLY: Get provider adapter for making API calls.
 * This imports the actual API clients - must only be used in server code.
 */
const ADAPTER_MAP: Record<string, AIProviderAdapter> = {
  anthropic: anthropicAdapter,
  google: googleAdapter,
  groq: groqAdapter,
};

export function getProviderAdapter(provider: string): AIProviderAdapter {
  const adapter = ADAPTER_MAP[provider];
  if (!adapter) {
    throw new Error(`No adapter found for provider: ${provider}`);
  }
  return adapter;
}

/**
 * Create a fresh adapter using a user-provided API key.
 */
export function createAdapterWithKey(provider: string, apiKey: string): AIProviderAdapter {
  switch (provider) {
    case 'anthropic': {
      const client = new Anthropic({ apiKey });
      return { provider: 'anthropic', complete: createAnthropicComplete(client) };
    }
    case 'google': {
      const genAI = new GoogleGenerativeAI(apiKey);
      return { provider: 'google', complete: createGoogleComplete(genAI) };
    }
    case 'groq': {
      const client = new Groq({ apiKey });
      return { provider: 'groq', complete: createGroqComplete(client) };
    }
    default:
      throw new Error(`Cannot create adapter with user key for provider: ${provider}`);
  }
}

/**
 * Get the adapter for a provider, optionally using a user's own API key.
 * Returns the adapter and whether a user key is being used (for credit bypass).
 */
export async function getProviderAdapterForUser(
  provider: string,
  userId?: string
): Promise<{ adapter: AIProviderAdapter; usingUserKey: boolean }> {
  if (userId) {
    try {
      const betaEnabled = await isAiBetaEnabled(userId);
      if (betaEnabled) {
        const userKey = await getUserApiKey(userId, provider);
        if (userKey) {
          console.log(`[REGISTRY] Using user key for ${provider} (user: ${userId})`);
          const adapter = createAdapterWithKey(provider, userKey);
          return { adapter, usingUserKey: true };
        }
      }
    } catch (err) {
      console.warn(`[REGISTRY] Failed to check user key for ${provider}, falling back to platform key:`, err);
    }
  }

  return { adapter: getProviderAdapter(provider), usingUserKey: false };
}
