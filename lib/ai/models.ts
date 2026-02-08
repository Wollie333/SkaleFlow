// Client-safe model catalog — no server SDK imports
// Used by UI components to display available models without pulling in
// provider adapters (anthropic, google, groq) that require server-only deps.

export interface ClientModelOption {
  id: string;
  name: string;
  provider: string;
  isFree: boolean;
  estimatedCreditsPerMessage: number;
}

export const BRAND_CHAT_MODELS: ClientModelOption[] = [
  {
    id: 'claude-sonnet-4-5',
    name: 'Claude Sonnet 4.5',
    provider: 'anthropic',
    isFree: false,
    estimatedCreditsPerMessage: 75,
  },
  {
    id: 'claude-sonnet-4',
    name: 'Claude Sonnet 4',
    provider: 'anthropic',
    isFree: false,
    estimatedCreditsPerMessage: 60,
  },
  {
    id: 'gemini-2-flash',
    name: 'Gemini 2.0 Flash',
    provider: 'google',
    isFree: true,
    estimatedCreditsPerMessage: 0,
  },
  {
    id: 'llama-3-3-70b',
    name: 'Llama 3.3 70B',
    provider: 'groq',
    isFree: true,
    estimatedCreditsPerMessage: 0,
  },
];
