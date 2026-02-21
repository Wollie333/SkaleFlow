export type AIFeature = 'brand_chat' | 'brand_import' | 'content_generation' | 'logo_generation' | 'ad_generation' | 'video_call_copilot' | 'brand_audit';
export type AIProvider = 'anthropic' | 'google' | 'groq' | 'openai';

export interface AICompletionRequest {
  messages: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
  }>;
  systemPrompt?: string;
  maxTokens?: number;
  temperature?: number;
  /** The actual model ID to send to the API (e.g. 'claude-sonnet-4-5-20250929') */
  modelId?: string;
  /** When true, instruct the provider to return JSON. Defaults to false. */
  jsonMode?: boolean;
}

export interface AICompletionResponse {
  text: string;
  inputTokens: number;
  outputTokens: number;
  model: string;
  provider: AIProvider;
}

export interface AIProviderAdapter {
  provider: AIProvider;
  complete(request: AICompletionRequest): Promise<AICompletionResponse>;
}

export interface AIModelConfig {
  id: string;
  name: string;
  provider: AIProvider;
  modelId: string; // actual model ID sent to the API
  isFree: boolean;
  features: AIFeature[];
  estimatedCreditsPerMessage: number; // approximate credits per avg message
  inputPricePer1M: number; // USD per 1M input tokens
  outputPricePer1M: number; // USD per 1M output tokens
}
