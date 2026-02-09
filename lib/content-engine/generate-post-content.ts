import { SupabaseClient } from '@supabase/supabase-js';
import { buildBrandContextPrompt } from '@/config/script-frameworks';
import { buildBrandContextMap } from '@/lib/content-engine/generate-content';
import { resolveModel, getProviderAdapter, deductCredits, calculateCreditCost } from '@/lib/ai';
import type { AIFeature } from '@/lib/ai';

export interface GeneratePostResult {
  topic: string;
  caption: string;
  hashtags: string[];
}

/**
 * Generate post content (caption + hashtags + topic) using AI.
 * Uses brand context for brand-aligned content generation.
 */
export async function generatePostContent(
  supabase: SupabaseClient,
  orgId: string,
  userId: string,
  params: {
    funnelStage: string;
    storybrandStage: string;
    format: string;
    platforms: string[];
    modelOverride?: string | null;
    existingCaption?: string | null;
    selectedBrandVariables?: string[] | null;
  }
): Promise<GeneratePostResult> {
  // Get brand context
  const { data: outputs } = await supabase
    .from('brand_outputs')
    .select('output_key, output_value')
    .eq('organization_id', orgId)
    .eq('is_locked', true);

  const brandContext = buildBrandContextMap(outputs || []);

  const { data: org } = await supabase
    .from('organizations')
    .select('name')
    .eq('id', orgId)
    .single();

  const orgName = org?.name || 'the brand';

  // Resolve model
  const resolvedModel = await resolveModel(orgId, 'content_generation' as AIFeature, params.modelOverride);
  const adapter = getProviderAdapter(resolvedModel.provider);

  const brandPrompt = Object.keys(brandContext).length > 0
    ? buildBrandContextPrompt(brandContext, params.selectedBrandVariables || undefined)
    : `No brand context available. Write professional content for ${orgName}.`;

  const isEnhancement = !!params.existingCaption;

  const systemPrompt = `You are a social media content strategist for ${orgName}. You create engaging, brand-aligned social media posts.

${brandPrompt}

RULES:
- Write in the brand's authentic voice
- Be specific, not generic
- Use the brand's actual language, terms, and offer names
- Return ONLY valid JSON — no markdown, no code blocks`;

  const userPrompt = isEnhancement
    ? `Enhance this existing social media post caption. Make it more engaging while keeping the core message:

EXISTING CAPTION:
${params.existingCaption}

CONTEXT:
- Funnel stage: ${params.funnelStage}
- StoryBrand stage: ${params.storybrandStage}
- Format: ${params.format}
- Platforms: ${params.platforms.join(', ')}

Return a JSON object with:
{
  "topic": "brief topic summary (3-5 words)",
  "caption": "the enhanced caption text (no hashtags in the caption)",
  "hashtags": ["hashtag1", "hashtag2", "hashtag3", "hashtag4", "hashtag5"]
}

The hashtags array should contain 5-10 relevant hashtags WITHOUT the # prefix.`
    : `Create an original social media post for ${orgName}.

CONTEXT:
- Funnel stage: ${params.funnelStage} (${params.funnelStage === 'awareness' ? 'attract new audience' : params.funnelStage === 'consideration' ? 'build trust and educate' : 'drive action and conversions'})
- StoryBrand stage: ${params.storybrandStage}
- Format: ${params.format}
- Platforms: ${params.platforms.join(', ')}

Return a JSON object with:
{
  "topic": "brief topic summary (3-5 words)",
  "caption": "the full post caption text (no hashtags in the caption). Make it compelling, platform-appropriate, and on-brand. For LinkedIn, write 150-300 words. For Twitter, keep under 250 characters. For other platforms, 100-200 words.",
  "hashtags": ["hashtag1", "hashtag2", "hashtag3", "hashtag4", "hashtag5"]
}

The hashtags array should contain 5-10 relevant hashtags WITHOUT the # prefix.
Write the caption in the brand's voice. Be specific — reference actual brand offers, pain points, or frameworks from the brand context.`;

  const response = await adapter.complete({
    messages: [{ role: 'user', content: userPrompt }],
    systemPrompt,
    maxTokens: 2000,
    temperature: 0.8,
    modelId: resolvedModel.modelId,
  });

  // Deduct credits for paid models
  if (!resolvedModel.isFree) {
    const creditCost = calculateCreditCost(resolvedModel.id, response.inputTokens, response.outputTokens);
    if (creditCost > 0) {
      await deductCredits(orgId, userId, creditCost, null, 'AI assist post generation');
    }
  }

  // Parse response
  const text = response.text.trim();
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('AI response did not contain valid JSON');
  }

  const parsed = JSON.parse(jsonMatch[0]);

  return {
    topic: parsed.topic || 'Untitled',
    caption: parsed.caption || '',
    hashtags: Array.isArray(parsed.hashtags)
      ? parsed.hashtags.map((h: string) => h.replace(/^#/, ''))
      : [],
  };
}
