import type { AIModelConfig, AIFeature, AIProviderAdapter } from './types';
import { anthropicAdapter } from './anthropic';
import { googleAdapter } from './google';
import { groqAdapter } from './groq';

export const MODEL_CATALOG: AIModelConfig[] = [
  {
    id: 'claude-sonnet-4-5',
    name: 'Claude Sonnet 4.5',
    provider: 'anthropic',
    modelId: 'claude-sonnet-4-5-20250929',
    isFree: false,
    features: ['brand_chat', 'brand_import', 'content_generation', 'ad_generation'],
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
    features: ['brand_chat', 'brand_import', 'content_generation', 'ad_generation'],
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
    features: ['brand_chat', 'content_generation', 'ad_generation'],
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
    features: ['brand_chat', 'content_generation', 'ad_generation'],
    estimatedCreditsPerMessage: 0,
    inputPricePer1M: 0,
    outputPricePer1M: 0,
  },
];

const ADAPTER_MAP: Record<string, AIProviderAdapter> = {
  anthropic: anthropicAdapter,
  google: googleAdapter,
  groq: groqAdapter,
};

export function getModelConfig(modelId: string): AIModelConfig | undefined {
  return MODEL_CATALOG.find(m => m.id === modelId);
}

export function getModelsForFeature(feature: AIFeature): AIModelConfig[] {
  return MODEL_CATALOG.filter(m => m.features.includes(feature));
}

export function getProviderAdapter(provider: string): AIProviderAdapter {
  const adapter = ADAPTER_MAP[provider];
  if (!adapter) {
    throw new Error(`No adapter found for provider: ${provider}`);
  }
  return adapter;
}

export function getDefaultModelForFeature(feature: AIFeature): AIModelConfig {
  // Default to Llama 3.3 70B (Groq) — free, fast, and reliable
  const defaultModel = MODEL_CATALOG.find(m => m.id === 'llama-3-3-70b' && m.features.includes(feature));
  if (defaultModel) return defaultModel;

  // Fallback to any model that supports the feature
  const fallback = MODEL_CATALOG.find(m => m.features.includes(feature));
  if (fallback) return fallback;

  throw new Error(`No models available for feature: ${feature}`);
}
