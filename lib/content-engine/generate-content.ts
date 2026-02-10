import { SupabaseClient } from '@supabase/supabase-js';
import {
  getScriptFramework,
  buildBrandContextPrompt,
  type ContentFormat,
} from '@/config/script-frameworks';
import { PLATFORM_CHARACTER_LIMITS } from '@/config/creative-specs';
import type { Database, FunnelStage, StoryBrandStage, Json } from '@/types/database';
import { resolveModel, calculateCreditCost, deductCredits, getProviderAdapter, checkCredits } from '@/lib/ai';
import type { AIFeature } from '@/lib/ai';
import { MAX_VALIDATION_RETRIES } from './queue-config';
import { getScriptFrameworkFromDB } from './template-service';

export interface GenerateContentResult {
  results: Array<{
    id: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    content: Record<string, any>;
    framework: {
      scriptTemplate: string;
      hookTemplate: string;
      ctaTemplate: string;
      formatCategory: string;
    };
  }>;
  generated: number;
  failed: number;
  creditExhausted: boolean;
  skippedItems?: string[];
}

/**
 * Core content generation logic — shared between /api/content/generate
 * and /api/content/calendar/generate-week routes.
 */
export async function generateContentForItems(
  supabase: SupabaseClient,
  organizationId: string,
  contentItemIds: string[],
  userId: string,
  modelOverride?: string | null
): Promise<GenerateContentResult> {
  // Get brand context
  const { data: outputs } = await supabase
    .from('brand_outputs')
    .select('output_key, output_value')
    .eq('organization_id', organizationId)
    .eq('is_locked', true);

  console.log(`[GEN-LEGACY] Brand outputs for org ${organizationId}: ${outputs?.length || 0} locked variables`);

  const brandContext = buildBrandContextMap(outputs || []);

  const { data: org } = await supabase
    .from('organizations')
    .select('name')
    .eq('id', organizationId)
    .single();

  // Get content items (up to 30)
  const { data: items } = await supabase
    .from('content_items')
    .select(`
      *,
      angle:content_angles(name, emotional_target)
    `)
    .in('id', contentItemIds.slice(0, 30));

  if (!items || items.length === 0) {
    console.error(`[GEN-LEGACY] No content items found for IDs: ${contentItemIds.join(', ')}`);
    return { results: [], generated: 0, failed: 0, creditExhausted: false };
  }

  console.log(`[GEN-LEGACY] Found ${items.length} items to generate`);

  // Resolve AI model
  const resolvedModel = await resolveModel(organizationId, 'content_generation' as AIFeature, modelOverride);
  const adapter = getProviderAdapter(resolvedModel.provider);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const results: GenerateContentResult['results'] = [];
  const skippedItems: string[] = [];
  let creditExhausted = false;

  // Track previously generated content to enforce uniqueness across batch
  const previouslyGenerated: Array<{ title: string; hook: string; topic: string }> = [];

  // Extract content themes from brand context for topic diversification
  const contentThemes = extractContentThemes(brandContext);

  // Build the system prompt once (shared across all items in batch)
  const systemPrompt = buildSystemPrompt(brandContext, org?.name || 'Your Brand');

  // Higher temperature for free/weaker models to force more variety
  const temperature = resolvedModel.isFree ? 0.95 : 0.8;

  let itemIndex = 0;

  for (const item of items) {
    // Per-item credit check for paid models (super_admins bypass)
    if (!resolvedModel.isFree) {
      const balance = await checkCredits(organizationId, 140, userId);
      if (!balance.hasCredits) {
        creditExhausted = true;
        skippedItems.push(item.id);
        continue;
      }
    }

    const format = item.format as ContentFormat;
    const funnelStage = item.funnel_stage as FunnelStage;
    const storybrandStage = item.storybrand_stage as StoryBrandStage;
    const platforms = item.platforms || [];

    const framework = await getScriptFrameworkFromDB(supabase as SupabaseClient<Database>, format, funnelStage, storybrandStage, platforms);

    // Pick a unique content theme for this item to force topic diversity
    const themeHint = contentThemes.length > 0
      ? contentThemes[itemIndex % contentThemes.length]
      : null;

    const prompt = buildEnhancedPrompt(
      brandContext,
      item,
      org?.name || 'Your Brand',
      framework,
      previouslyGenerated,
      itemIndex,
      themeHint
    );

    const maxTokens = framework.formatCategory === 'long' ? 4096 :
                       framework.formatCategory === 'medium' ? 3072 : 2048;

    // Retry loop with validation
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let validParsed: Record<string, any> | null = null;
    let validResponse: { text: string; inputTokens: number; outputTokens: number } | null = null;
    let lastReason = '';

    for (let attempt = 1; attempt <= MAX_VALIDATION_RETRIES; attempt++) {
      try {
        const response = await adapter.complete({
          messages: [{ role: 'user', content: prompt }],
          systemPrompt,
          maxTokens,
          temperature,
          modelId: resolvedModel.modelId,
        });

        const parsed = parseEnhancedResponse(response.text, framework.formatCategory);
        const validation = validateGeneratedContent(parsed, framework.formatCategory);

        if (validation.valid) {
          validParsed = parsed;
          validResponse = response;
          break;
        } else {
          lastReason = validation.reason || 'Unknown';
          console.warn(`[GEN-LEGACY] Validation failed for item ${item.id} attempt ${attempt}/${MAX_VALIDATION_RETRIES}: ${lastReason}`);
        }
      } catch (err) {
        lastReason = err instanceof Error ? err.message : 'Unknown AI error';
        console.error(`[GEN-LEGACY] Exception for item ${item.id} attempt ${attempt}/${MAX_VALIDATION_RETRIES}: ${lastReason}`);
      }
    }

    itemIndex++;

    // Skip item if all attempts failed validation — don't save, don't charge
    if (!validParsed || !validResponse) {
      console.error(`[GEN-LEGACY] All ${MAX_VALIDATION_RETRIES} attempts failed for item ${item.id}: ${lastReason}`);
      skippedItems.push(item.id);
      continue;
    }

    // Track generated content for uniqueness enforcement
    previouslyGenerated.push({
      title: validParsed.title || validParsed.topic || '',
      hook: validParsed.hook || '',
      topic: validParsed.topic || validParsed.title || '',
    });

    // Build platform_specs from generated content (with per-platform captions)
    const platformSpecs = buildPlatformSpecs(validParsed, item.platforms || []);

    // Build update object based on format category
    const updateData: Record<string, unknown> = {
      topic: validParsed.title || validParsed.topic || 'Generated content',
      hook: validParsed.hook || '',
      script_body: validParsed.script_body || '',
      cta: validParsed.cta || '',
      caption: validParsed.caption || '',
      hashtags: (validParsed.hashtags || []).map((h: string) => h.replace(/^#/, '')),
      ai_generated: true,
      ai_model: resolvedModel.modelId,
      status: 'scripted',
      script_template: framework.scriptTemplate,
      hook_template: framework.hookTemplate,
      cta_template: framework.ctaTemplate,
      filming_notes: validParsed.filming_notes || null,
      platform_specs: (platformSpecs || {}) as unknown as Json,
      updated_at: new Date().toISOString(),
    };

    // Format-specific fields
    if (framework.formatCategory === 'medium' || framework.formatCategory === 'long') {
      updateData.context_section = validParsed.context_section || null;
      updateData.teaching_points = validParsed.teaching_points || null;
      updateData.reframe = validParsed.reframe || null;
    }

    if (framework.formatCategory === 'long') {
      updateData.problem_expansion = validParsed.problem_expansion || null;
      updateData.framework_teaching = validParsed.framework_teaching || null;
      updateData.case_study = validParsed.case_study || null;
    }

    // For carousel, store slides in script_body as JSON
    if (framework.formatCategory === 'carousel' && validParsed.slides) {
      updateData.script_body = JSON.stringify(validParsed.slides);
    }

    // For static, store headline + body_text + visual_direction
    if (framework.formatCategory === 'static') {
      updateData.script_body = JSON.stringify({
        headline: validParsed.headline || '',
        body_text: validParsed.body_text || '',
        visual_direction: validParsed.visual_direction || '',
      });
    }

    await supabase
      .from('content_items')
      .update(updateData)
      .eq('id', item.id);

    // Calculate credits and track usage (only for validated content)
    const creditsCharged = calculateCreditCost(resolvedModel.id, validResponse.inputTokens, validResponse.outputTokens);

    const { data: usageRow } = await supabase
      .from('ai_usage')
      .insert({
        organization_id: organizationId,
        user_id: userId,
        feature: 'content_generation',
        model: resolvedModel.modelId,
        input_tokens: validResponse.inputTokens,
        output_tokens: validResponse.outputTokens,
        credits_charged: creditsCharged,
        provider: resolvedModel.provider,
        is_free_model: resolvedModel.isFree,
      })
      .select('id')
      .single();

    // Deduct credits for paid models
    if (creditsCharged > 0) {
      await deductCredits(
        organizationId,
        userId,
        creditsCharged,
        usageRow?.id || null,
        `Content generation — ${resolvedModel.name}`
      );
    }

    results.push({
      id: item.id,
      content: validParsed,
      framework: {
        scriptTemplate: framework.scriptTemplateName,
        hookTemplate: framework.hookTemplateName,
        ctaTemplate: framework.ctaTemplateName,
        formatCategory: framework.formatCategory,
      },
    });
  }

  return {
    results,
    generated: results.length,
    failed: skippedItems.length,
    creditExhausted,
    skippedItems: skippedItems.length > 0 ? skippedItems : undefined,
  };
}

// ── Helper functions ──────────────────────────────────────────────

export function buildBrandContextMap(outputs: Array<{ output_key: string; output_value: unknown }>) {
  const context: Record<string, unknown> = {};
  for (const output of outputs) {
    context[output.output_key] = output.output_value;
  }
  return context;
}

/** Extract content themes from brand context for topic diversification */
export function extractContentThemes(brandContext: Record<string, unknown>): string[] {
  const themes: string[] = [];
  const raw = brandContext.content_themes;
  if (Array.isArray(raw)) {
    themes.push(...raw.map(String));
  } else if (typeof raw === 'string' && raw.length > 0) {
    themes.push(...raw.split(/[,;\n]+/).map(t => t.trim()).filter(Boolean));
  }
  // Also pull message pillars as alternative topics
  const pillars = brandContext.message_pillars;
  if (Array.isArray(pillars)) {
    themes.push(...pillars.map(String));
  } else if (typeof pillars === 'string' && pillars.length > 0) {
    themes.push(...pillars.split(/[,;\n]+/).map(t => t.trim()).filter(Boolean));
  }
  // Add beliefs to teach
  const beliefs = brandContext.beliefs_to_teach;
  if (Array.isArray(beliefs)) {
    themes.push(...beliefs.map(String));
  } else if (typeof beliefs === 'string' && beliefs.length > 0) {
    themes.push(...beliefs.split(/[,;\n]+/).map(t => t.trim()).filter(Boolean));
  }
  return themes;
}

/** System prompt with brand identity — sent once, shared across batch */
export function buildSystemPrompt(
  brandContext: Record<string, unknown>,
  orgName: string,
  selectedBrandVariables?: string[]
): string {
  const brandPrompt = Object.keys(brandContext).length > 0
    ? buildBrandContextPrompt(brandContext, selectedBrandVariables)
    : `No brand context available. Write general professional content for ${orgName}.`;

  return `You are a content strategist and scriptwriter for ${orgName}. You create original, brand-specific content.

${brandPrompt}

CRITICAL RULES:
- Every piece of content you create must be 100% UNIQUE — never repeat a topic, hook, angle, or script structure.
- Write in the brand's voice using the brand's actual language, terms, and offer names.
- Be specific, not generic. Never write vague "evergreen" filler content.
- Always use real brand examples, actual pain points, and named offers from the brand context above.
- Return ONLY valid JSON — no markdown, no code blocks, no explanation.`;
}

export function buildEnhancedPrompt(
  brandContext: Record<string, unknown>,
  item: {
    funnel_stage: string;
    storybrand_stage: string;
    format: string;
    platforms: string[];
    scheduled_date?: string;
    time_slot?: string;
    angle?: { name: string; emotional_target: string | null } | null;
  },
  orgName: string,
  framework: ReturnType<typeof getScriptFramework>,
  previouslyGenerated?: Array<{ title: string; hook: string; topic: string }>,
  itemIndex?: number,
  themeHint?: string | null
): string {
  // Build uniqueness enforcement section — capped to avoid bloating the prompt
  // Only include the most recent 8 entries with titles only (hooks are too verbose)
  let uniquenessSection = '';
  if (previouslyGenerated && previouslyGenerated.length > 0) {
    const capped = previouslyGenerated.slice(-8);
    uniquenessSection = `
FORBIDDEN — DO NOT USE THESE TOPICS (already created):
${capped.map((p, i) => `${i + 1}. "${p.title}"`).join('\n')}

You MUST write about a COMPLETELY DIFFERENT subject. Do NOT reuse any topic, hook, angle, example, or key message from the list above.
`;
  }

  // Topic directive — gives the model a specific starting point
  let topicDirective = '';
  if (themeHint) {
    topicDirective = `\nTOPIC FOCUS: Build this post around the theme: "${themeHint}". Use this as your starting point — create a specific, actionable angle within this theme that hasn't been covered yet.`;
  }

  // Item position seed — gives the model awareness of its position
  const positionSeed = itemIndex !== undefined && itemIndex > 0
    ? `\nThis is post #${itemIndex + 1} in a batch. It MUST be completely different from all previous posts. Choose a fresh angle, different examples, and a new hook style.`
    : '';

  // Build platform-specific description guidelines
  const platformGuide = item.platforms.map(p => {
    const guides: Record<string, string> = {
      linkedin: `LinkedIn: Professional thought-leadership (150-600 chars). Bold insight in first 2 lines. Line breaks between ideas. End with professional CTA. 3-5 industry hashtags.`,
      facebook: `Facebook: Conversational & relatable (150-500 chars). Storytelling or question to drive comments. Short paragraphs. End with question or CTA. 3-5 hashtags.`,
      instagram: `Instagram: Visual storytelling (200-600 chars). Strong first line. Authentic & value-packed. Hashtags at end separated by line breaks. 10-20 mixed hashtags.`,
      twitter: `Twitter/X: Punchy & sharp (under 250 chars). Provocative or insightful. 1-2 inline hashtags only.`,
      tiktok: `TikTok: Casual & hook-driven (100-300 chars). Trending language, authentic. 3-8 relevant hashtags.`,
    };
    return guides[p] || '';
  }).filter(Boolean).join('\n');

  return `Create a ${framework.formatCategory}-form content piece for ${orgName}.
${uniquenessSection}${topicDirective}${positionSeed}

CONTENT PARAMETERS:
- Funnel: ${item.funnel_stage} ${getFunnelGuidance(item.funnel_stage)}
- StoryBrand: ${item.storybrand_stage} ${getStoryBrandGuidance(item.storybrand_stage)}
- Angle: ${item.angle?.name || 'General'}${item.angle?.emotional_target ? ` (emotion: ${item.angle.emotional_target})` : ''}
- Format: ${item.format} (${framework.formatCategory})
- Platforms: ${item.platforms.join(', ')}
- Date: ${item.scheduled_date || 'N/A'}
- Script Template: ${framework.scriptTemplateName}
- Hook Style: ${framework.hookTemplateName}
- CTA Style: ${framework.ctaTemplateName}
${framework.durationGuidance ? `- Duration: ${framework.durationGuidance}` : ''}

PLATFORM-SPECIFIC POST DESCRIPTIONS:
Write a UNIQUE post description for EACH platform in "platform_captions". Each must be:
- Written for that platform's audience (not copy/paste between platforms)
- In the brand's voice — use actual brand terms and offer names
- Substantive and longer-form (not 2-line filler) unless platform needs brevity (Twitter)
- Include a value hook in the first line and end with a platform-appropriate CTA
${platformGuide}

HASHTAGS: Store WITHOUT # prefix. Each platform gets its own in "platform_hashtags".

SCRIPT INSTRUCTIONS:
${framework.promptInstructions}

Write each sentence in the script on its own line for readability.

OUTPUT FORMAT:
${framework.outputFormat}

Return ONLY valid JSON. No markdown, no code blocks, no explanation.`;
}

function getFunnelGuidance(stage: string): string {
  const guidance: Record<string, string> = {
    awareness: '- Goal: Stop the scroll, name the pain, build recognition. Don\'t sell — connect.',
    consideration: '- Goal: Build trust, show authority, teach something valuable. Position as the guide.',
    conversion: '- Goal: Drive action, overcome objections, create urgency. Make the next step clear.',
  };
  return guidance[stage] || '';
}

function getStoryBrandGuidance(stage: string): string {
  const guidance: Record<string, string> = {
    character: '- Name the hero (the ICP) and their desire. Make them feel seen.',
    external_problem: '- Name the visible struggle. What\'s not working?',
    internal_problem: '- Name how it FEELS. Frustration, doubt, exhaustion.',
    philosophical_problem: '- Name why it\'s WRONG. The injustice that shouldn\'t exist.',
    guide: '- Position yourself as the guide with empathy + authority.',
    plan: '- Show the clear path. Simple steps to transformation.',
    call_to_action: '- Tell them exactly what to do next.',
    failure: '- Show what happens if they don\'t act. Stakes and consequences.',
    success: '- Paint the picture of life after transformation.',
  };
  return guidance[stage] || '';
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export function parseEnhancedResponse(text: string, formatCategory: string): Record<string, any> {
  // Try to extract JSON from response
  const jsonMatch = text.match(/```json\n?([\s\S]*?)\n?```/) ||
                    text.match(/\{[\s\S]*\}/);

  if (jsonMatch) {
    try {
      const json = JSON.parse(jsonMatch[1] || jsonMatch[0]);
      // Normalize: ensure title exists
      if (!json.title && json.topic) json.title = json.topic;
      if (!json.topic && json.title) json.topic = json.title;
      return json;
    } catch (e) {
      console.error('Failed to parse JSON:', e);
    }
  }

  // Fallback based on format
  const fallback: Record<string, any> = {
    title: 'Generated content',
    topic: 'Generated content',
    hook: '',
    script_body: text,
    cta: '',
    caption: '',
    hashtags: [],
  };

  if (formatCategory === 'carousel') {
    fallback.slides = [];
  }
  if (formatCategory === 'static') {
    fallback.headline = '';
    fallback.body_text = text;
    fallback.visual_direction = '';
  }

  return fallback;
}

const PLACEHOLDER_TITLES = [
  'generated content',
  'untitled',
  'content',
  'new post',
  'post title',
  'title here',
];

/**
 * Validate that AI-generated content is meaningful (not empty/placeholder).
 * Returns { valid: true } or { valid: false, reason: string }.
 */
export function validateGeneratedContent(
  parsed: Record<string, any>,
  formatCategory: string
): { valid: boolean; reason?: string } {
  // Check title/topic exists and isn't a placeholder
  const title = (parsed.title || parsed.topic || '').trim();
  if (title.length < 5) {
    return { valid: false, reason: `Title too short (${title.length} chars, need 5+)` };
  }
  if (PLACEHOLDER_TITLES.includes(title.toLowerCase())) {
    return { valid: false, reason: `Placeholder title detected: "${title}"` };
  }

  // Format-specific checks
  if (formatCategory === 'carousel') {
    const slides = parsed.slides;
    if (!Array.isArray(slides) || slides.length < 3) {
      return { valid: false, reason: `Carousel needs 3+ slides, got ${Array.isArray(slides) ? slides.length : 0}` };
    }
  } else if (formatCategory === 'static') {
    const headline = (parsed.headline || '').trim();
    const bodyText = (parsed.body_text || '').trim();
    if (headline.length < 5) {
      return { valid: false, reason: `Static headline too short (${headline.length} chars, need 5+)` };
    }
    if (bodyText.length < 15) {
      return { valid: false, reason: `Static body_text too short (${bodyText.length} chars, need 15+)` };
    }
  } else {
    // short, medium, long
    const hook = (parsed.hook || '').trim();
    const scriptBody = (parsed.script_body || '').trim();
    if (hook.length < 10) {
      return { valid: false, reason: `Hook too short (${hook.length} chars, need 10+)` };
    }
    if (scriptBody.length < 30) {
      return { valid: false, reason: `Script body too short (${scriptBody.length} chars, need 30+)` };
    }
  }

  return { valid: true };
}

export function buildPlatformSpecs(
  content: Record<string, any>,
  platforms: string[]
): Record<string, any> {
  const specs: Record<string, any> = {};
  const platformCaptions = content.platform_captions || {};
  const platformHashtags = content.platform_hashtags || {};

  for (const platform of platforms) {
    const limits = PLATFORM_CHARACTER_LIMITS[platform];
    if (!limits) continue;

    // Use platform-specific caption if available, else fall back to universal
    let caption = platformCaptions[platform] || content.caption || '';
    const hashtags = platformHashtags[platform] || content.hashtags || [];

    // Truncate caption for platform limits
    if (caption.length > limits.caption) {
      caption = caption.substring(0, limits.caption - 3) + '...';
    }

    // Limit hashtags count and ensure no # prefix in storage
    const cleanHashtags = hashtags
      .slice(0, limits.hashtags)
      .map((h: string) => h.replace(/^#/, ''));

    // Mark as customized if we got a platform-specific caption from AI
    const hasCustomCaption = !!platformCaptions[platform];

    specs[platform] = {
      caption,
      hashtags: cleanHashtags,
      customized: hasCustomCaption,
    };
  }

  return specs;
}
/* eslint-enable @typescript-eslint/no-explicit-any */

/**
 * Generate content for a SINGLE item with full brand context.
 * Used by the queue-based generation system (one item at a time).
 */
export async function generateSingleItem(
  supabase: SupabaseClient,
  orgId: string,
  userId: string,
  contentItemId: string,
  modelOverride: string | null,
  previouslyGenerated: Array<{ title: string; hook: string; topic: string }>,
  selectedBrandVariables?: string[] | null
): Promise<{
  success: boolean;
  error?: string;
  retryable?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  content?: Record<string, any>;
}> {
  console.log(`[GEN-SINGLE] generateSingleItem called: orgId=${orgId}, contentItemId=${contentItemId}, modelOverride=${modelOverride}`);

  // Load brand context
  const { data: outputs, error: outputsError } = await supabase
    .from('brand_outputs')
    .select('output_key, output_value')
    .eq('organization_id', orgId)
    .eq('is_locked', true);

  console.log(`[GEN-SINGLE] Brand outputs: ${outputs?.length || 0} locked outputs, error=${outputsError?.message || 'none'}`);
  const brandContext = buildBrandContextMap(outputs || []);

  const { data: org } = await supabase
    .from('organizations')
    .select('name')
    .eq('id', orgId)
    .single();
  console.log(`[GEN-SINGLE] Org name: ${org?.name || 'NOT FOUND'}`);

  // Load the content item with its angle
  const { data: item, error: itemError } = await supabase
    .from('content_items')
    .select(`
      *,
      angle:content_angles(name, emotional_target)
    `)
    .eq('id', contentItemId)
    .single();

  if (!item || itemError) {
    console.error(`[GEN-SINGLE] Content item not found: ${contentItemId}, error: ${itemError?.message}`);
    return { success: false, error: `Content item not found: ${itemError?.message || 'unknown'}` };
  }
  console.log(`[GEN-SINGLE] Content item loaded: format=${item.format}, funnel=${item.funnel_stage}, storybrand=${item.storybrand_stage}, platforms=${(item.platforms || []).join(',')}`);

  // Resolve AI model
  console.log(`[GEN-SINGLE] Resolving model for override: ${modelOverride}`);
  const resolvedModel = await resolveModel(orgId, 'content_generation' as AIFeature, modelOverride);
  console.log(`[GEN-SINGLE] Resolved model: id=${resolvedModel.id}, modelId=${resolvedModel.modelId}, provider=${resolvedModel.provider}, isFree=${resolvedModel.isFree}`);
  const adapter = getProviderAdapter(resolvedModel.provider);

  // Credit check for paid models (super_admins bypass)
  if (!resolvedModel.isFree) {
    console.log(`[GEN-SINGLE] Checking credits for paid model...`);
    const balance = await checkCredits(orgId, 140, userId);
    console.log(`[GEN-SINGLE] Credit check: hasCredits=${balance.hasCredits}, remaining=${balance.totalRemaining}`);
    if (!balance.hasCredits) {
      return { success: false, error: 'Insufficient credits' };
    }
  }

  const format = item.format as ContentFormat;
  const funnelStage = item.funnel_stage as FunnelStage;
  const storybrandStage = item.storybrand_stage as StoryBrandStage;
  const platforms = item.platforms || [];

  console.log(`[GEN-SINGLE] Getting script framework: format=${format}, funnel=${funnelStage}, storybrand=${storybrandStage}`);
  const framework = await getScriptFrameworkFromDB(supabase as SupabaseClient<Database>, format, funnelStage, storybrandStage, platforms);
  console.log(`[GEN-SINGLE] Framework: category=${framework.formatCategory}, script=${framework.scriptTemplateName}, hook=${framework.hookTemplateName}`);

  // Content themes for topic diversity
  const contentThemes = extractContentThemes(brandContext);
  const itemIndex = previouslyGenerated.length;
  const themeHint = contentThemes.length > 0
    ? contentThemes[itemIndex % contentThemes.length]
    : null;

  const systemPrompt = buildSystemPrompt(brandContext, org?.name || 'Your Brand', selectedBrandVariables || undefined);

  // Higher temperature for free/weaker models
  const temperature = resolvedModel.isFree ? 0.95 : 0.8;

  const prompt = buildEnhancedPrompt(
    brandContext,
    item,
    org?.name || 'Your Brand',
    framework,
    previouslyGenerated,
    itemIndex,
    themeHint
  );

  const maxTokens = framework.formatCategory === 'long' ? 4096 :
                     framework.formatCategory === 'medium' ? 3072 : 2048;

  // Retry loop: attempt AI call + validation up to MAX_VALIDATION_RETRIES times
  let lastValidationReason = '';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let validParsed: Record<string, any> | null = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let validResponse: { text: string; inputTokens: number; outputTokens: number } | null = null;

  for (let attempt = 1; attempt <= MAX_VALIDATION_RETRIES; attempt++) {
    try {
      // On retry, strip uniqueness section to give the model more output room
      const attemptPrompt = attempt > 1
        ? buildEnhancedPrompt(brandContext, item, org?.name || 'Your Brand', framework, [], itemIndex, themeHint)
        : prompt;

      console.log(`[GEN-SINGLE] Attempt ${attempt}/${MAX_VALIDATION_RETRIES} — Calling AI adapter: provider=${resolvedModel.provider}, modelId=${resolvedModel.modelId}, maxTokens=${maxTokens}, temp=${temperature}`);
      console.log(`[GEN-SINGLE] Prompt length: ${attemptPrompt.length} chars, System prompt length: ${systemPrompt.length} chars`);
      const aiStartTime = Date.now();

      const response = await adapter.complete({
        messages: [{ role: 'user', content: attemptPrompt }],
        systemPrompt,
        maxTokens,
        temperature,
        modelId: resolvedModel.modelId,
      });

      const aiElapsed = Date.now() - aiStartTime;
      console.log(`[GEN-SINGLE] AI response received in ${aiElapsed}ms: inputTokens=${response.inputTokens}, outputTokens=${response.outputTokens}, textLength=${response.text.length}`);
      console.log(`[GEN-SINGLE] Response text first 200 chars: ${response.text.substring(0, 200)}`);

      const responseText = response.text;
      const parsed = parseEnhancedResponse(responseText, framework.formatCategory);
      console.log(`[GEN-SINGLE] Parsed response: title="${parsed.title || parsed.topic || 'NO TITLE'}", hook="${(parsed.hook || '').substring(0, 50)}", hasCaption=${!!parsed.caption}, hashtags=${(parsed.hashtags || []).length}`);

      // Validate content quality
      const validation = validateGeneratedContent(parsed, framework.formatCategory);
      if (validation.valid) {
        validParsed = parsed;
        validResponse = response;
        console.log(`[GEN-SINGLE] Validation PASSED on attempt ${attempt}`);
        break;
      } else {
        lastValidationReason = validation.reason || 'Unknown validation failure';
        console.warn(`[GEN-SINGLE] Validation FAILED on attempt ${attempt}/${MAX_VALIDATION_RETRIES}: ${lastValidationReason}`);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown AI error';
      console.error(`[GEN-SINGLE] EXCEPTION on attempt ${attempt}/${MAX_VALIDATION_RETRIES}:`, message, err);
      lastValidationReason = message;
      // On exception during the last attempt, return as a retryable error (let queue handle it)
      if (attempt === MAX_VALIDATION_RETRIES) {
        return { success: false, error: message };
      }
    }
  }

  // All attempts exhausted without valid content — let queue retry with fresh context
  if (!validParsed || !validResponse) {
    console.error(`[GEN-SINGLE] All ${MAX_VALIDATION_RETRIES} attempts failed validation: ${lastValidationReason}`);
    return {
      success: false,
      error: `Content validation failed after ${MAX_VALIDATION_RETRIES} attempts: ${lastValidationReason}`,
      retryable: true,
    };
  }

  // ── Valid content — save to DB and charge credits ──

  // Build platform_specs
  const platformSpecs = buildPlatformSpecs(validParsed, item.platforms || []);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateData: Record<string, any> = {
    topic: validParsed.title || validParsed.topic || 'Generated content',
    hook: validParsed.hook || '',
    script_body: validParsed.script_body || '',
    cta: validParsed.cta || '',
    caption: validParsed.caption || '',
    hashtags: (validParsed.hashtags || []).map((h: string) => h.replace(/^#/, '')),
    ai_generated: true,
    ai_model: resolvedModel.modelId,
    status: 'scripted',
    script_template: framework.scriptTemplate,
    hook_template: framework.hookTemplate,
    cta_template: framework.ctaTemplate,
    filming_notes: validParsed.filming_notes || null,
    platform_specs: (platformSpecs || {}) as unknown as Json,
    updated_at: new Date().toISOString(),
  };

  if (framework.formatCategory === 'medium' || framework.formatCategory === 'long') {
    updateData.context_section = validParsed.context_section || null;
    updateData.teaching_points = validParsed.teaching_points || null;
    updateData.reframe = validParsed.reframe || null;
  }

  if (framework.formatCategory === 'long') {
    updateData.problem_expansion = validParsed.problem_expansion || null;
    updateData.framework_teaching = validParsed.framework_teaching || null;
    updateData.case_study = validParsed.case_study || null;
  }

  if (framework.formatCategory === 'carousel' && validParsed.slides) {
    updateData.script_body = JSON.stringify(validParsed.slides);
  }

  if (framework.formatCategory === 'static') {
    updateData.script_body = JSON.stringify({
      headline: validParsed.headline || '',
      body_text: validParsed.body_text || '',
      visual_direction: validParsed.visual_direction || '',
    });
  }

  console.log(`[GEN-SINGLE] Updating content_items row: id=${item.id}, topic="${updateData.topic}", status=scripted`);
  const { error: updateError } = await supabase
    .from('content_items')
    .update(updateData)
    .eq('id', item.id);
  if (updateError) {
    console.error(`[GEN-SINGLE] DB UPDATE FAILED for content_items:`, updateError.message);
  } else {
    console.log(`[GEN-SINGLE] content_items updated successfully`);
  }

  // Track AI usage + deduct credits (only for validated content)
  const creditsCharged = calculateCreditCost(resolvedModel.id, validResponse.inputTokens, validResponse.outputTokens);

  const { data: usageRow } = await supabase
    .from('ai_usage')
    .insert({
      organization_id: orgId,
      user_id: userId,
      feature: 'content_generation',
      model: resolvedModel.modelId,
      input_tokens: validResponse.inputTokens,
      output_tokens: validResponse.outputTokens,
      credits_charged: creditsCharged,
      provider: resolvedModel.provider,
      is_free_model: resolvedModel.isFree,
    })
    .select('id')
    .single();

  if (creditsCharged > 0) {
    await deductCredits(
      orgId,
      userId,
      creditsCharged,
      usageRow?.id || null,
      `Content generation — ${resolvedModel.name}`
    );
  }

  console.log(`[GEN-SINGLE] DONE — returning success for content_item=${contentItemId}`);
  return {
    success: true,
    content: {
      title: validParsed.title || validParsed.topic || '',
      hook: validParsed.hook || '',
      topic: validParsed.topic || validParsed.title || '',
    },
  };
}
