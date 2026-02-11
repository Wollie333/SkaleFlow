/**
 * SERVER-ONLY provider registry.
 * This file imports API adapters that instantiate SDK clients.
 * DO NOT import this file in client components - use catalog.ts instead.
 */

import type { AIProviderAdapter } from './types';
import { anthropicAdapter } from './anthropic';
import { googleAdapter } from './google';
import { groqAdapter } from './groq';

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
