/**
 * CLIENT-SAFE model catalog.
 * This file contains ONLY model metadata and configuration.
 * NO provider adapters or API clients are imported here.
 */

import type { AIModelConfig, AIFeature } from './types';

export const MODEL_CATALOG: AIModelConfig[] = [
  {
    id: 'claude-sonnet-4-5',
    name: 'Claude Sonnet 4.5',
    provider: 'anthropic',
    modelId: 'claude-sonnet-4-5-20250929',
    isFree: false,
    features: ['brand_chat', 'brand_import', 'content_generation', 'ad_generation', 'video_call_copilot'],
    estimatedCreditsPerMessage: 75,
    inputPricePer1M: 3.0,
    outputPricePer1M: 15.0,
  },
  {
    id: 'claude-sonnet-4',
    name: 'Claude Sonnet 4',
    provider: 'anthropic',
    modelId: 'claude-sonnet-4-20250514',
    isFree: false,
    features: ['brand_chat', 'brand_import', 'content_generation', 'ad_generation', 'video_call_copilot'],
    estimatedCreditsPerMessage: 60,
    inputPricePer1M: 3.0,
    outputPricePer1M: 15.0,
  },
  {
    id: 'gemini-2-flash',
    name: 'Gemini 2.0 Flash',
    provider: 'google',
    modelId: 'gemini-2.0-flash',
    isFree: true,
    features: ['brand_chat', 'content_generation', 'ad_generation', 'video_call_copilot'],
    estimatedCreditsPerMessage: 0,
    inputPricePer1M: 0,
    outputPricePer1M: 0,
  },
  {
    id: 'llama-3-3-70b',
    name: 'Llama 3.3 70B',
    provider: 'groq',
    modelId: 'llama-3.3-70b-versatile',
    isFree: true,
    features: ['brand_chat', 'content_generation', 'ad_generation', 'video_call_copilot'],
    estimatedCreditsPerMessage: 0,
    inputPricePer1M: 0,
    outputPricePer1M: 0,
  },
];

/**
 * Get model configuration by ID.
 * Client-safe - does not import any API adapters.
 */
export function getModelConfig(modelId: string): AIModelConfig | undefined {
  return MODEL_CATALOG.find(m => m.id === modelId);
}

/**
 * Get all models that support a specific feature.
 * Client-safe - does not import any API adapters.
 */
export function getModelsForFeature(feature: AIFeature): AIModelConfig[] {
  return MODEL_CATALOG.filter(m => m.features.includes(feature));
}

/**
 * Get the default model for a feature.
 * Client-safe - does not import any API adapters.
 */
export function getDefaultModelForFeature(feature: AIFeature): AIModelConfig {
  // Default to Llama 3.3 70B (Groq) — free, fast, and reliable
  const defaultModel = MODEL_CATALOG.find(m => m.id === 'llama-3-3-70b' && m.features.includes(feature));
  if (defaultModel) return defaultModel;

  // Fallback to any model that supports the feature
  const fallback = MODEL_CATALOG.find(m => m.features.includes(feature));
  if (fallback) return fallback;

  throw new Error(`No models available for feature: ${feature}`);
}
