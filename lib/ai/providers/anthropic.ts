import Anthropic from '@anthropic-ai/sdk';
import type { AIProviderAdapter, AICompletionRequest, AICompletionResponse } from './types';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export const anthropicAdapter: AIProviderAdapter = {
  provider: 'anthropic',

  async complete(request: AICompletionRequest): Promise<AICompletionResponse> {
    console.log(`[AI-ANTHROPIC] complete() called, modelId=${request.modelId || 'claude-sonnet-4-5-20250929'}, messages=${request.messages.length}, hasSystemPrompt=${!!request.systemPrompt}`);
    // Split system prompt from messages (Anthropic uses a separate system param)
    const systemPrompt = request.systemPrompt || '';
    const messages = request.messages
      .filter(m => m.role !== 'system')
      .map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));

    const response = await anthropic.messages.create({
      model: request.modelId || 'claude-sonnet-4-5-20250929',
      max_tokens: request.maxTokens || 4096,
      ...(systemPrompt ? { system: systemPrompt } : {}),
      messages,
      ...(request.temperature !== undefined ? { temperature: request.temperature } : {}),
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';

    console.log(`[AI-ANTHROPIC] Response received: ${text.length} chars, inputTokens=${response.usage.input_tokens}, outputTokens=${response.usage.output_tokens}, model=${response.model}`);

    return {
      text,
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
      model: response.model,
      provider: 'anthropic',
    };
  },
};

// Export the raw SDK client for advanced usage (file uploads, streaming, etc.)
export { anthropic as anthropicClient };
