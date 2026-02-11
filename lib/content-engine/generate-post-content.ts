import { SupabaseClient } from '@supabase/supabase-js';
import { buildBrandContextPrompt } from '@/config/script-frameworks';
import { buildBrandContextMap } from '@/lib/content-engine/generate-content';
import { resolveModel, getProviderAdapter, deductCredits, calculateCreditCost } from '@/lib/ai/server';
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
- Format ALL posts with line breaks between paragraphs using \\n\\n (except Twitter)
- Keep sentences short and punchy (10-20 words)
- Start with a compelling hook
- Match the platform's tone and style (professional for LinkedIn, conversational for Facebook, authentic for Instagram)
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
  "caption": "the full post caption text (no hashtags in the caption). Make it compelling, platform-appropriate, and on-brand.

FORMATTING RULES BY PLATFORM:

📱 LINKEDIN (Professional, Scannable):
  * 150-300 words with proper structure
  * Hook: Start with 1-2 short sentences (bold insight)
  * Add blank line after hook (\\n\\n)
  * Body: 2-3 short paragraphs (2-3 sentences each)
  * Blank lines between all paragraphs (\\n\\n)
  * Sentences: 10-20 words each, punchy and clear
  * End: Professional CTA
  * Use \\n\\n for all paragraph breaks

📘 FACEBOOK (Conversational, Story-driven):
  * 100-200 words with storytelling flow
  * Hook: Relatable opening sentence or question
  * Blank line after hook (\\n\\n)
  * Body: 2-3 short paragraphs telling a story or sharing value
  * Blank lines between paragraphs (\\n\\n)
  * Tone: Conversational, like talking to a friend
  * End: Question or CTA to drive comments
  * Use \\n\\n for paragraph breaks

📸 INSTAGRAM (Visual, Value-packed):
  * 150-300 words, authentic and engaging
  * Hook: Strong first sentence (people read caption before scrolling)
  * Blank line after hook (\\n\\n)
  * Body: 2-4 short paragraphs with value or story
  * Blank lines between paragraphs (\\n\\n)
  * Tone: Authentic, personal, value-driven
  * End: CTA or question
  * Use \\n\\n for paragraph breaks

🐦 TWITTER/X (Punchy, Sharp):
  * Under 250 characters total
  * Single paragraph (no line breaks)
  * Punchy and provocative or insightful
  * Get to the point immediately
  * No fluff or filler

🎵 TIKTOK (Casual, Hook-driven):
  * 100-150 words, casual and authentic
  * Hook: Attention-grabbing first line
  * Blank line after hook (\\n\\n)
  * Body: 1-2 short paragraphs
  * Blank line between paragraphs (\\n\\n)
  * Tone: Casual, trending language, Gen Z friendly
  * Keep it brief and scrollable

CRITICAL: Use \\n\\n (double newline) between paragraphs for ALL platforms EXCEPT Twitter.",
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
