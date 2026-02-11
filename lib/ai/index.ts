/**
 * CLIENT-SAFE AI utilities.
 *
 * This file contains ONLY client-safe exports (no server dependencies).
 * For server-only functions like credit checking, model resolution, etc.,
 * import from '@/lib/ai/server' instead.
 */

// Client-safe utility functions (no server dependencies)
export { creditsToUSD, formatCreditsToUSD } from './utils';

// Client-safe model catalog (NO API adapters imported)
export { getModelConfig, getModelsForFeature, getDefaultModelForFeature, MODEL_CATALOG } from './providers/catalog';

// Type definitions (always safe to import)
export type { AIFeature, AIProvider, AIModelConfig, AICompletionRequest, AICompletionResponse, AIProviderAdapter } from './providers/types';
