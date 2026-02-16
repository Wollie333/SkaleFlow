/**
 * Client-safe model catalog — no server-side provider imports.
 * Mirror of MODEL_CATALOG from registry.ts but importable from 'use client' components.
 */

export interface ClientModelOption {
  id: string;
  name: string;
  provider: string;
  isFree: boolean;
  estimatedCreditsPerMessage: number;
  features: string[];
}

export const CLIENT_MODEL_CATALOG: ClientModelOption[] = [
  {
    id: 'claude-sonnet-4-5',
    name: 'Claude Sonnet 4.5',
    provider: 'anthropic',
    isFree: false,
    estimatedCreditsPerMessage: 75,
    features: ['brand_chat', 'brand_import', 'content_generation', 'ad_generation', 'video_call_copilot'],
  },
  {
    id: 'claude-sonnet-4',
    name: 'Claude Sonnet 4',
    provider: 'anthropic',
    isFree: false,
    estimatedCreditsPerMessage: 60,
    features: ['brand_chat', 'brand_import', 'content_generation', 'ad_generation', 'video_call_copilot'],
  },
  {
    id: 'gemini-2-flash',
    name: 'Gemini 2.0 Flash',
    provider: 'google',
    isFree: true,
    estimatedCreditsPerMessage: 0,
    features: ['brand_chat', 'content_generation', 'ad_generation', 'video_call_copilot'],
  },
  {
    id: 'llama-3-3-70b',
    name: 'Llama 3.3 70B',
    provider: 'groq',
    isFree: true,
    estimatedCreditsPerMessage: 0,
    features: ['brand_chat', 'content_generation', 'ad_generation', 'video_call_copilot'],
  },
];

export function getClientModelsForFeature(feature: string): ClientModelOption[] {
  return CLIENT_MODEL_CATALOG.filter(m => m.features.includes(feature));
}
