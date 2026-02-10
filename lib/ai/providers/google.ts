import { GoogleGenerativeAI } from '@google/generative-ai';
import type { AIProviderAdapter, AICompletionRequest, AICompletionResponse } from './types';
import { withTimeout, AI_TIMEOUT_MS } from './timeout';

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 4000; // 4s base — Gemini free tier allows 15 RPM (~4s between requests)

function getClient() {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) throw new Error('GOOGLE_AI_API_KEY is not set');
  return new GoogleGenerativeAI(apiKey);
}

function isRateLimitError(err: unknown): boolean {
  if (err instanceof Error) {
    const msg = err.message.toLowerCase();
    return msg.includes('429') || msg.includes('too many requests') || msg.includes('resource_exhausted') || msg.includes('rate limit');
  }
  return false;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export const googleAdapter: AIProviderAdapter = {
  provider: 'google',

  async complete(request: AICompletionRequest): Promise<AICompletionResponse> {
    console.log(`[AI-GOOGLE] complete() called, modelId=${request.modelId || 'gemini-2.0-flash'}, messages=${request.messages.length}, hasSystemPrompt=${!!request.systemPrompt}`);
    const genAI = getClient();
    const model = genAI.getGenerativeModel({
      model: request.modelId || 'gemini-2.0-flash',
      ...(request.systemPrompt
        ? { systemInstruction: request.systemPrompt }
        : {}),
    });

    // Build Gemini conversation history
    const history = request.messages
      .filter(m => m.role !== 'system')
      .slice(0, -1) // all except last
      .map(m => ({
        role: m.role === 'assistant' ? 'model' as const : 'user' as const,
        parts: [{ text: m.content }],
      }));

    const lastMessage = request.messages.filter(m => m.role !== 'system').slice(-1)[0];

    const chat = model.startChat({
      history,
      generationConfig: {
        maxOutputTokens: request.maxTokens || 4096,
        responseMimeType: 'application/json',
        ...(request.temperature !== undefined ? { temperature: request.temperature } : {}),
      },
    });

    // Retry loop with exponential backoff for rate limits
    let lastError: unknown;
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        if (attempt > 0) {
          const delay = BASE_DELAY_MS * Math.pow(2, attempt - 1); // 4s, 8s, 16s
          console.log(`[AI-GOOGLE] Rate-limited — retry ${attempt}/${MAX_RETRIES} after ${delay}ms`);
          await sleep(delay);
        }

        console.log(`[AI-GOOGLE] Sending message to Gemini (${(lastMessage?.content || '').length} chars)${attempt > 0 ? ` [attempt ${attempt + 1}]` : ''}...`);
        const result = await withTimeout(
          chat.sendMessage(lastMessage?.content || ''),
          AI_TIMEOUT_MS,
          'Google Gemini'
        );
        const response = result.response;
        const text = response.text();

        // Gemini provides usage metadata
        const usage = response.usageMetadata;
        const inputTokens = usage?.promptTokenCount || 0;
        const outputTokens = usage?.candidatesTokenCount || 0;

        console.log(`[AI-GOOGLE] Response received: ${text.length} chars, inputTokens=${inputTokens}, outputTokens=${outputTokens}`);

        return {
          text,
          inputTokens,
          outputTokens,
          model: request.modelId || 'gemini-2.0-flash',
          provider: 'google',
        };
      } catch (err) {
        lastError = err;
        if (isRateLimitError(err) && attempt < MAX_RETRIES) {
          console.warn(`[AI-GOOGLE] 429 rate limit hit on attempt ${attempt + 1} — will retry`);
          continue;
        }
        // Non-rate-limit error or final attempt — rethrow
        throw err;
      }
    }

    // Should not reach here, but just in case
    throw lastError;
  },
};
