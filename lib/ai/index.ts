/**
 * CLIENT-SAFE AI utilities.
 *
 * This file contains ONLY client-safe exports (no server dependencies).
 * For server-only functions like credit checking, model resolution, etc.,
 * import from '@/lib/ai/server' instead.
 */

// Client-safe utility functions (no server dependencies)
export { creditsToUSD, formatCreditsToUSD } from './utils';

// Client-safe provider registry (pure functions, no server dependencies)
export { getModelConfig, getModelsForFeature, getProviderAdapter, getDefaultModelForFeature, MODEL_CATALOG } from './providers/registry';

// Type definitions (always safe to import)
export type { AIFeature, AIProvider, AIModelConfig, AICompletionRequest, AICompletionResponse, AIProviderAdapter } from './providers/types';
