import Groq from 'groq-sdk';
import type { AIProviderAdapter, AICompletionRequest, AICompletionResponse } from './types';
import { withTimeout, AI_TIMEOUT_MS } from './timeout';

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 3000; // 3s base for Groq rate limits

function getClient() {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY is not set');
  return new Groq({ apiKey });
}

function isRateLimitError(err: unknown): boolean {
  if (err instanceof Error) {
    const msg = err.message.toLowerCase();
    return msg.includes('429') || msg.includes('too many requests') || msg.includes('rate_limit') || msg.includes('rate limit');
  }
  return false;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function createGroqComplete(client: Groq) {
  return async function complete(request: AICompletionRequest): Promise<AICompletionResponse> {
    console.log(`[AI-GROQ] complete() called, modelId=${request.modelId || 'llama-3.3-70b-versatile'}, messages=${request.messages.length}, hasSystemPrompt=${!!request.systemPrompt}`);

    // Build messages array with system prompt
    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [];

    if (request.systemPrompt) {
      messages.push({ role: 'system', content: request.systemPrompt });
    }

    for (const msg of request.messages) {
      if (msg.role === 'system') continue; // already handled above
      messages.push({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      });
    }

    // Retry loop with exponential backoff for rate limits
    let lastError: unknown;
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        if (attempt > 0) {
          const delay = BASE_DELAY_MS * Math.pow(2, attempt - 1); // 3s, 6s, 12s
          console.log(`[AI-GROQ] Rate-limited — retry ${attempt}/${MAX_RETRIES} after ${delay}ms`);
          await sleep(delay);
        }

        console.log(`[AI-GROQ] Sending request to Groq${attempt > 0 ? ` [attempt ${attempt + 1}]` : ''}...`);
        const response = await withTimeout(
          client.chat.completions.create({
            model: request.modelId || 'llama-3.3-70b-versatile',
            max_tokens: request.maxTokens || 4096,
            messages,
            response_format: { type: 'json_object' },
            ...(request.temperature !== undefined ? { temperature: request.temperature } : {}),
          }),
          AI_TIMEOUT_MS,
          'Groq'
        );

        const text = response.choices[0]?.message?.content || '';
        const usage = response.usage;

        console.log(`[AI-GROQ] Response received: ${text.length} chars, inputTokens=${usage?.prompt_tokens || 0}, outputTokens=${usage?.completion_tokens || 0}`);

        return {
          text,
          inputTokens: usage?.prompt_tokens || 0,
          outputTokens: usage?.completion_tokens || 0,
          model: request.modelId || 'llama-3.3-70b-versatile',
          provider: 'groq',
        };
      } catch (err) {
        lastError = err;
        if (isRateLimitError(err) && attempt < MAX_RETRIES) {
          console.warn(`[AI-GROQ] 429 rate limit hit on attempt ${attempt + 1} — will retry`);
          continue;
        }
        throw err;
      }
    }

    throw lastError;
  };
}

export const groqAdapter: AIProviderAdapter = {
  provider: 'groq',
  complete: createGroqComplete(getClient()),
};
