// ============================================================
// V3 Content Engine — Post Generation
// Content type-based prompting (replaces StoryBrand × Funnel)
// Generates: 3 hook variations, body, CTA, visual brief,
// shot suggestions, slide content, on-screen text
// ============================================================

import { SupabaseClient } from '@supabase/supabase-js';
import type { Database, Json } from '@/types/database';
import { CONTENT_TYPES, type ContentTypeId } from '@/config/content-types';
import { CAMPAIGN_OBJECTIVES } from '@/config/campaign-objectives';
import { PLATFORM_DEFAULTS, type SocialChannel } from '@/config/platform-defaults';
import { resolveModel, calculateCreditCost, deductCredits, getProviderAdapterForUser, checkCredits } from '@/lib/ai/server';
import type { AIFeature } from '@/lib/ai';
import { CORE_CONTENT_VARIABLES, selectV3StrategicVariables, VARIABLE_DISPLAY_NAMES } from './brand-variable-categories';
import { MAX_VALIDATION_RETRIES } from './queue-config';
import { selectV3Template, markTemplateUsed, buildTemplatePromptBlock, type V3Template } from './v3-template-service';
import { getStyleProfile, buildStylePromptBlock } from './style-learning';

// ---- Types ----

export interface V3GenerationResult {
  success: boolean;
  error?: string;
  retryable?: boolean;
  content?: V3PostContent;
}

export interface V3PostContent {
  topic: string;
  hook: string;
  hook_variations: string[];
  body: string;
  cta: string;
  caption: string;
  hashtags: string[];
  visual_brief: string | null;
  shot_suggestions: string | null;
  slide_content: Array<{ slide: number; headline: string; body: string }> | null;
  on_screen_text: Array<{ timestamp: string; text: string }> | null;
  brand_voice_score: number;
  brand_variables_used: string[];
}

// ---- Main generation function ----

export async function generateV3Post(
  supabase: SupabaseClient<Database>,
  orgId: string,
  userId: string,
  postId: string,
  modelOverride: string | null,
  previouslyGenerated: Array<{ topic: string; hook: string }>,
  selectedBrandVariables?: string[] | null,
  creativeDirection?: string
): Promise<V3GenerationResult> {
  // Load brand context
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

  // Load the content post
  const { data: post, error: postError } = await supabase
    .from('content_posts')
    .select('*')
    .eq('id', postId)
    .single();

  if (!post || postError) {
    return { success: false, error: `Post not found: ${postError?.message || 'unknown'}` };
  }

  // Resolve AI model
  const resolvedModel = await resolveModel(orgId, 'content_generation' as AIFeature, modelOverride);
  const { adapter, usingUserKey } = await getProviderAdapterForUser(resolvedModel.provider, userId);

  // Credit check
  if (!resolvedModel.isFree && !usingUserKey) {
    const balance = await checkCredits(orgId, 140, userId);
    if (!balance.hasCredits) {
      return { success: false, error: 'Insufficient credits', retryable: false };
    }
  }

  // Select brand variables
  const contentType = post.content_type as ContentTypeId;
  const objective = post.objective;
  const effectiveVars = selectedBrandVariables && selectedBrandVariables.length > 0
    ? selectedBrandVariables
    : selectV3StrategicVariables(objective, contentType);

  // Select template (Objective → Content Type → Format)
  const usedTemplateIds = previouslyGenerated
    .map((p: any) => p.templateId)
    .filter(Boolean) as string[];
  const template = await selectV3Template(supabase, post.content_type, post.format, objective, usedTemplateIds);

  // Get style profile for personalization
  const styleProfile = await getStyleProfile(supabase, orgId);

  // Build prompts — template-first
  const systemPrompt = buildV3SystemPrompt(
    brandContext,
    org?.name || 'Your Brand',
    effectiveVars,
    creativeDirection,
    template,
    styleProfile
  );

  const userPrompt = buildV3UserPrompt(
    post,
    brandContext,
    previouslyGenerated,
    org?.name || 'Your Brand',
    template
  );

  const temperature = resolvedModel.isFree ? 0.95 : 0.8;
  const maxTokens = isLongFormat(post.format) ? 6144 : isVideoFormat(post.format) ? 4096 : 3072;

  // Retry loop
  let lastError = '';
  for (let attempt = 0; attempt < MAX_VALIDATION_RETRIES; attempt++) {
    try {
      const response = await adapter.complete({
        modelId: resolvedModel.modelId,
        systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
        temperature,
        maxTokens,
        responseFormat: 'json',
      });

      const parsed = parseV3Response(response.content, post.format);
      if (!parsed) {
        lastError = 'Invalid response format';
        continue;
      }

      // Update the content post
      const updateData: Record<string, unknown> = {
        topic: parsed.topic,
        hook: parsed.hook_variations[0], // default to first hook
        hook_variations: parsed.hook_variations,
        body: parsed.body,
        cta: parsed.cta,
        caption: parsed.caption,
        hashtags: parsed.hashtags,
        visual_brief: parsed.visual_brief,
        shot_suggestions: parsed.shot_suggestions,
        slide_content: (parsed.slide_content || null) as unknown as Json,
        on_screen_text: (parsed.on_screen_text || null) as unknown as Json,
        brand_voice_score: parsed.brand_voice_score,
        brand_variables_used: effectiveVars,
        ai_generated: true,
        ai_model: resolvedModel.id,
        status: 'scripted',
        updated_at: new Date().toISOString(),
        // Template tracking
        template_id: template?.id || null,
        // Snapshot for style learning (compare against user edits later)
        original_ai_output: {
          topic: parsed.topic,
          hook: parsed.hook_variations[0],
          body: parsed.body,
          cta: parsed.cta,
          caption: parsed.caption,
          hashtags: parsed.hashtags,
        } as unknown as Json,
      };

      await supabase
        .from('content_posts')
        .update(updateData)
        .eq('id', postId);

      // Track template usage
      if (template) {
        await markTemplateUsed(supabase, template.id).catch(() => {});
      }

      // Deduct credits
      if (!resolvedModel.isFree && !usingUserKey) {
        const cost = calculateCreditCost(resolvedModel.id, response.inputTokens || 0, response.outputTokens || 0);
        await deductCredits(supabase, orgId, cost, `V3 post generation: ${postId}`, userId);
      }

      // Record AI usage
      await supabase.from('ai_usage').insert({
        organization_id: orgId,
        user_id: userId,
        feature: 'content_generation',
        model: resolvedModel.id,
        provider: resolvedModel.provider,
        input_tokens: response.inputTokens || 0,
        output_tokens: response.outputTokens || 0,
        credits_charged: resolvedModel.isFree ? 0 : calculateCreditCost(resolvedModel.id, response.inputTokens || 0, response.outputTokens || 0),
        is_free_model: resolvedModel.isFree,
      });

      return { success: true, content: parsed };
    } catch (err) {
      lastError = err instanceof Error ? err.message : 'Unknown error';
    }
  }

  return { success: false, error: lastError, retryable: true };
}

// ---- Brand context helpers ----

function buildBrandContextMap(outputs: Array<{ output_key: string; output_value: string }>): Record<string, string> {
  const map: Record<string, string> = {};
  for (const o of outputs) {
    map[o.output_key] = o.output_value;
  }
  return map;
}

function buildV3SystemPrompt(
  brandContext: Record<string, string>,
  brandName: string,
  variables: string[],
  creativeDirection?: string,
  template?: V3Template | null,
  styleProfile?: import('./style-learning').StyleProfile | null
): string {
  const varBlock = variables
    .filter(key => brandContext[key])
    .map(key => `**${VARIABLE_DISPLAY_NAMES[key] || key}**: ${brandContext[key]}`)
    .join('\n');

  let prompt = `You are an expert content strategist and copywriter for "${brandName}".

## Brand Context
${varBlock}

## Rules
1. Write in the brand's exact voice — use preferred vocabulary, avoid blacklisted words.
2. Every post must work STANDALONE — assume zero prior context from the reader.
3. Generate 3 different hook variations — each must stop the scroll in line 1 (text) or first 3 seconds (video).
4. End with a CTA aligned to the campaign objective.
5. Reference ICP pain points and language naturally.
6. Name the enemy where contextually relevant — never forced.
7. Mix brand + topic + reach hashtags.
8. NEVER use generic filler ("In today's fast-paced world..."). Be specific and direct.
9. Keep paragraphs to 1–2 lines max for social readability.
10. Respond ONLY with valid JSON matching the required schema.`;

  if (creativeDirection) {
    prompt += `\n\n## Creative Direction from Founder\n${creativeDirection}`;
  }

  // Template-driven structure (the core of v3)
  if (template) {
    prompt += `\n\n${buildTemplatePromptBlock(template)}`;
  }

  // Style learning — personalize to user's editing patterns
  if (styleProfile && styleProfile.edit_count >= 3) {
    prompt += `\n\n${buildStylePromptBlock(styleProfile)}`;
  }

  return prompt;
}

function buildV3UserPrompt(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  post: any,
  brandContext: Record<string, string>,
  previouslyGenerated: Array<{ topic: string; hook: string }>,
  brandName: string,
  template?: V3Template | null
): string {
  const contentType = CONTENT_TYPES[post.content_type as ContentTypeId];
  const objectiveConfig = CAMPAIGN_OBJECTIVES[post.objective as keyof typeof CAMPAIGN_OBJECTIVES];
  const platform = post.platform as SocialChannel;
  const platformConfig = PLATFORM_DEFAULTS[platform];
  const format = post.format;

  let prompt = `Generate a ${contentType.name} post for ${platformConfig?.label || platform}.
${template ? `\nIMPORTANT: Follow the "${template.name}" template structure provided in the system prompt. Personalize it with the brand context — do NOT change the structure.\n` : ''}
## Content Type: ${contentType.name} (Type ${contentType.id})
${contentType.description}
Primary outcome: ${contentType.primaryOutcome}

## Campaign Objective: ${objectiveConfig?.name || post.objective}
${objectiveConfig?.description || ''}

## Format: ${format}
Platform: ${platformConfig?.label || platform}
Caption limit: ${platformConfig?.charLimits?.caption || 2200} characters
`;

  // Format-specific instructions
  if (format === 'carousel') {
    prompt += `\n## Carousel Requirements
- Slide 1: The hook — treated as a headline. Must stop the scroll.
- Slides 2–8: One key point per slide, minimal text per slide.
- Final slide: CTA — tell them what to do next.
- Populate slide_content with per-slide text.
`;
  } else if (format === 'reel' || format === 'video') {
    prompt += `\n## Video/Reel Requirements
- Hook (0–3 sec): Pattern interrupt. No intros, no logos, no "hey guys".
- Body (3–60 sec): One idea per video. Keep it moving.
- CTA (last 5–10 sec): Tell them what to do.
- Populate shot_suggestions and on_screen_text.
`;
  } else if (format === 'long_video') {
    prompt += `\n## Long Video Requirements
- Hook (0–15 sec): Why they should keep watching.
- Intro (15–30 sec): What they'll learn.
- Body: Structured sections with clear transitions.
- CTA: What to do next.
- Include chapter markers in on_screen_text.
`;
  } else if (format === 'static') {
    prompt += `\n## Static Image Requirements
- Populate visual_brief with: text/data for the graphic, layout suggestion, brand colour usage.
`;
  } else if (format === 'thread') {
    prompt += `\n## Thread Requirements
- First tweet: The hook — must stop the scroll.
- Each subsequent tweet: One point, builds on the previous.
- Final tweet: CTA + value recap.
`;
  }

  // Uniqueness
  if (previouslyGenerated.length > 0) {
    prompt += `\n## Already Generated (DO NOT repeat similar topics/hooks):\n`;
    for (const prev of previouslyGenerated.slice(-10)) {
      prompt += `- Topic: "${prev.topic}" | Hook: "${prev.hook}"\n`;
    }
  }

  // Response schema
  prompt += `
## Response Schema (JSON)
{
  "topic": "one-line topic summary",
  "hook_variations": ["hook 1", "hook 2", "hook 3"],
  "body": "main body copy or script",
  "cta": "call to action text",
  "caption": "social media caption (may differ from body for video)",
  "hashtags": ["hashtag1", "hashtag2", "..."],
  "visual_brief": "image concept for designer (null for video-only)",
  "shot_suggestions": "filming directions (null for non-video)",
  "slide_content": [{"slide": 1, "headline": "", "body": ""}] or null,
  "on_screen_text": [{"timestamp": "0:03", "text": ""}] or null,
  "brand_voice_score": 85
}`;

  return prompt;
}

// ---- Response parsing ----

function parseV3Response(raw: string, format: string): V3PostContent | null {
  try {
    // Strip markdown code fences if present
    let cleaned = raw.trim();
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }

    const parsed = JSON.parse(cleaned);

    // Validate required fields
    if (!parsed.topic || !parsed.hook_variations || !parsed.body || !parsed.cta) {
      return null;
    }

    // Ensure hook_variations is an array of 3
    const hooks = Array.isArray(parsed.hook_variations) ? parsed.hook_variations : [parsed.hook_variations];
    while (hooks.length < 3) hooks.push(hooks[0] || parsed.topic);

    return {
      topic: String(parsed.topic),
      hook: String(hooks[0]),
      hook_variations: hooks.map(String),
      body: String(parsed.body),
      cta: String(parsed.cta),
      caption: String(parsed.caption || parsed.body),
      hashtags: Array.isArray(parsed.hashtags) ? parsed.hashtags.map(String) : [],
      visual_brief: parsed.visual_brief ? String(parsed.visual_brief) : null,
      shot_suggestions: parsed.shot_suggestions ? String(parsed.shot_suggestions) : null,
      slide_content: Array.isArray(parsed.slide_content) ? parsed.slide_content : null,
      on_screen_text: Array.isArray(parsed.on_screen_text) ? parsed.on_screen_text : null,
      brand_voice_score: Number(parsed.brand_voice_score) || 75,
      brand_variables_used: [], // filled by caller
    };
  } catch {
    return null;
  }
}

// ---- Format helpers ----

function isVideoFormat(format: string): boolean {
  return ['reel', 'video', 'long_video', 'story'].includes(format);
}

function isLongFormat(format: string): boolean {
  return ['long_video', 'thread'].includes(format);
}
