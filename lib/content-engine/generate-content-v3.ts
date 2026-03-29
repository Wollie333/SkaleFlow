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
  console.log('[V3-GEN] ========== Starting generation for post:', postId, '==========');
  console.log('[V3-GEN] OrgId:', orgId, 'UserId:', userId);

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
    console.error('[V3-GEN] Failed to load post:', postId, postError);
    return { success: false, error: `Post not found: ${postError?.message || 'unknown'}` };
  }

  console.log('[V3-GEN] Post loaded. workspace_id:', post.workspace_id, 'status:', post.status);

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

  // SPEED OPTIMIZATION: Skip template/style loading for faster generation
  const template = null;
  const styleProfile = null;

  // Build prompts — simplified for speed
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

  const temperature = 0.7; // Lower for faster, more consistent responses
  const maxTokens = 1536; // Reduced for speed

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
        jsonMode: true,
      });

      console.log('[V3-GEN] AI response received. Text length:', response.text?.length || 0);

      if (!response.text) {
        console.error('[V3-GEN] AI returned empty text!');
        console.error('[V3-GEN] Full response:', JSON.stringify(response, null, 2));
        lastError = 'AI returned empty response';
        continue;
      }

      const parsed = parseV3Response(response.text, post.format);
      if (!parsed) {
        console.error('[V3-GEN] Failed to parse AI response. Raw text:', response.text.substring(0, 500));
        lastError = 'Invalid response format - AI did not return valid JSON with required fields (topic, hook_variations, body, cta)';
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

      console.log('[V3-GEN] Attempting to update post:', postId);
      console.log('[V3-GEN] Update data keys:', Object.keys(updateData));

      const { data: updatedPost, error: updateError } = await supabase
        .from('content_posts')
        .update(updateData)
        .eq('id', postId)
        .select();

      if (updateError) {
        console.error('[V3-GEN] Database update FAILED for post:', postId);
        console.error('[V3-GEN] Error details:', JSON.stringify(updateError, null, 2));
        console.error('[V3-GEN] Error code:', updateError.code);
        console.error('[V3-GEN] Error message:', updateError.message);
        return { success: false, error: `Database update failed: ${updateError.message} (code: ${updateError.code})`, retryable: true };
      }

      if (!updatedPost || updatedPost.length === 0) {
        console.error('[V3-GEN] Update returned no rows for post:', postId);
        console.error('[V3-GEN] This likely means RLS policy blocked the update');
        return { success: false, error: 'Database update blocked by RLS policy - user may not have workspace access', retryable: false };
      }

      console.log('[V3-GEN] Successfully updated post:', postId, '- Topic:', parsed.topic);

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
  // SPEED OPTIMIZATION: Ultra-minimal prompt
  const varBlock = variables
    .filter(key => brandContext[key])
    .map(key => `${VARIABLE_DISPLAY_NAMES[key] || key}: ${brandContext[key]}`)
    .join('\n');

  return `You are a copywriter for "${brandName}".

Brand context:
${varBlock}

${creativeDirection ? `Direction: ${creativeDirection}\n` : ''}
Write engaging social media posts. Generate 3 hook variations. Return valid JSON only.`;
}

function buildV3UserPrompt(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  post: any,
  brandContext: Record<string, string>,
  previouslyGenerated: Array<{ topic: string; hook: string }>,
  brandName: string,
  template?: V3Template | null
): string {
  // SPEED OPTIMIZATION: Ultra-minimal prompt
  const contentType = CONTENT_TYPES[post.content_type as ContentTypeId];
  const platform = post.platform as SocialChannel;
  const platformConfig = PLATFORM_DEFAULTS[platform];

  return `Create ${contentType.name} for ${platformConfig?.label || platform} (${post.format} format).

JSON schema:
{
  "topic": "string",
  "hook_variations": ["hook1", "hook2", "hook3"],
  "body": "main content",
  "cta": "call to action",
  "caption": "caption text",
  "hashtags": ["tag1", "tag2"],
  "visual_brief": ${post.format === 'static' ? '"description"' : 'null'},
  "shot_suggestions": ${['reel', 'video', 'long_video'].includes(post.format) ? '"directions"' : 'null'},
  "slide_content": ${post.format === 'carousel' ? '[{"slide": 1, "headline": "", "body": ""}]' : 'null'},
  "on_screen_text": ${['reel', 'video', 'long_video'].includes(post.format) ? '[{"timestamp": "0:03", "text": ""}]' : 'null'},
  "brand_voice_score": 85
}`;
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
