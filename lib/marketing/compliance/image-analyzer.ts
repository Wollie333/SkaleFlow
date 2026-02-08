import { resolveModel, getProviderAdapter } from '@/lib/ai';
import type { AICompletionRequest } from '@/lib/ai/providers/types';

/**
 * Analyze image text overlay percentage using AI vision.
 *
 * Sends the image URL to a vision-capable model and asks it to estimate
 * the percentage of the image area occupied by text overlays, watermarks,
 * or rendered text elements.
 *
 * Returns a 0-100 percentage estimate and a brief description.
 * Uses approximately 50 credits (one vision model call).
 *
 * @param imageUrl - Publicly accessible URL of the image to analyze
 * @returns Object with `textPercentage` (0-100) and `description`
 */
export async function analyzeImageTextRatio(imageUrl: string): Promise<{
  textPercentage: number;
  description: string;
}> {
  // Use default content_generation model for vision analysis
  const model = await resolveModel('system', 'content_generation');
  const adapter = getProviderAdapter(model.provider);

  const request: AICompletionRequest = {
    messages: [
      {
        role: 'user',
        content: `Analyze this image and estimate what percentage of the image area is covered by text overlays, watermarks, or text elements.

Image URL: ${imageUrl}

Respond in JSON format only:
{
  "textPercentage": <number 0-100>,
  "description": "<brief description of text elements found>"
}

If you cannot analyze the image, return:
{
  "textPercentage": 0,
  "description": "Unable to analyze image"
}`,
      },
    ],
    maxTokens: 200,
    temperature: 0.1,
    modelId: model.modelId,
  };

  try {
    const response = await adapter.complete(request);
    const cleaned = response.text.replace(/```json\n?|\n?```/g, '').trim();
    const parsed = JSON.parse(cleaned);
    return {
      textPercentage: Math.min(100, Math.max(0, Number(parsed.textPercentage) || 0)),
      description: parsed.description || 'Analysis complete',
    };
  } catch {
    return {
      textPercentage: 0,
      description: 'Unable to analyze image',
    };
  }
}
