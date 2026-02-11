import { SupabaseClient } from '@supabase/supabase-js';
import {
  getScriptFramework,
  buildBrandContextPrompt,
  type ContentFormat,
} from '@/config/script-frameworks';
import { PLATFORM_CHARACTER_LIMITS } from '@/config/creative-specs';
import type { Database, FunnelStage, StoryBrandStage, Json } from '@/types/database';
import { resolveModel, calculateCreditCost, deductCredits, getProviderAdapter, checkCredits } from '@/lib/ai/server';
import type { AIFeature } from '@/lib/ai';
import { MAX_VALIDATION_RETRIES } from './queue-config';
import { getScriptFrameworkFromDB } from './template-service';
import { ESSENTIAL_CONTENT_VARIABLES, selectSmartVariables } from './brand-variable-categories';

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
  // Use essential variables only to keep prompt size manageable
  const systemPrompt = buildSystemPrompt(brandContext, org?.name || 'Your Brand', ESSENTIAL_CONTENT_VARIABLES);

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

    const maxTokens = framework.formatCategory === 'long' ? 6144 :
                       framework.formatCategory === 'medium' ? 4096 : 3072;

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
  selectedBrandVariables?: string[],
  rejectionFeedback?: string
): string {
  const brandPrompt = Object.keys(brandContext).length > 0
    ? buildBrandContextPrompt(brandContext, selectedBrandVariables)
    : `No brand context available. Write general professional content for ${orgName}.`;

  const feedbackSection = rejectionFeedback || '';

  return `You are a content strategist and scriptwriter for ${orgName}. You create original, brand-specific content.

${brandPrompt}
${feedbackSection}

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
      linkedin: `📱 LINKEDIN (Professional, Scannable):
150-600 characters with proper structure

FORMAT REQUIREMENTS:
- Hook: Bold insight in first 1-2 sentences, then blank line (\\n\\n)
- Body: 2-3 short paragraphs with blank lines between (\\n\\n)
- Each paragraph: 2-3 sentences max
- Each sentence: 10-20 words, punchy and clear
- End with professional CTA
- 3-5 industry hashtags

STRUCTURE:
[Hook sentence 1-2]

[Paragraph 1: main point]

[Paragraph 2: supporting idea or example]

[CTA]`,

      facebook: `📘 FACEBOOK (Conversational, Story-driven):
150-500 characters with storytelling flow

FORMAT REQUIREMENTS:
- Hook: Relatable opening sentence or question
- Blank line after hook (\\n\\n)
- Body: 2-3 short paragraphs telling a story or sharing value
- Blank lines between all paragraphs (\\n\\n)
- Tone: Conversational, like talking to a friend
- End with question or CTA to drive comments
- 3-5 hashtags

STRUCTURE:
[Relatable hook or question]

[Story paragraph 1]

[Story paragraph 2]

[Question or CTA]`,

      instagram: `📸 INSTAGRAM (Visual, Value-packed):
200-600 characters, authentic and engaging

FORMAT REQUIREMENTS:
- Hook: Strong first sentence (people read before scrolling)
- Blank line after hook (\\n\\n)
- Body: 2-4 short paragraphs with value or story
- Blank lines between all paragraphs (\\n\\n)
- Tone: Authentic, personal, value-driven
- End with CTA or question
- 10-20 mixed hashtags at end

STRUCTURE:
[Strong hook sentence]

[Value paragraph 1]

[Value paragraph 2]

[Optional paragraph 3]

[CTA or question]`,

      twitter: `🐦 TWITTER/X (Punchy, Sharp):
Under 250 characters total

FORMAT REQUIREMENTS:
- Single paragraph (NO line breaks)
- Punchy and provocative or insightful
- Get to the point immediately
- 1-2 inline hashtags only
- No fluff or filler
- Every word must count`,

      tiktok: `🎵 TIKTOK (Casual, Hook-driven):
100-300 characters, casual and authentic

FORMAT REQUIREMENTS:
- Hook: Attention-grabbing first line
- Blank line after hook (\\n\\n)
- Body: 1-2 short paragraphs
- Blank line between paragraphs (\\n\\n)
- Tone: Casual, trending language, Gen Z friendly
- Keep it brief and scrollable
- 3-8 relevant hashtags

STRUCTURE:
[Hook sentence]

[Brief value paragraph]

[Optional second paragraph]`,
    };
    return guides[p] || '';
  }).filter(Boolean).join('\n\n');

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
- **CRITICAL FORMATTING: Use \\n\\n (double newline) between paragraphs for ALL platforms EXCEPT Twitter**
- Match the platform's tone: Professional (LinkedIn), Conversational (Facebook), Authentic (Instagram), Casual (TikTok)
- Follow the formatting structure below for each platform

${platformGuide}

HASHTAGS: Store WITHOUT # prefix. Each platform gets its own in "platform_hashtags".

SCRIPT INSTRUCTIONS:
${framework.promptInstructions}

Write each sentence in the script on its own line for readability.

OUTPUT FORMAT:
${framework.outputFormat}

CONTENT LENGTH REQUIREMENTS (CRITICAL — DO NOT write skeletal content):
- caption: THIS IS THE MAIN POST. Write a full, detailed social media post (300-800 chars). Multiple paragraphs. Hook + value + CTA. NOT a 2-sentence summary.
- hook: 1-3 punchy sentences (50-150 chars minimum)
- script_body: Detailed multi-paragraph script (400+ chars for short-form, 800+ for medium, 1500+ for long)
- Each platform_caption: Substantial post description (150-600 chars for LinkedIn/Facebook/IG, under 250 for Twitter)
- cta: 1-2 clear action sentences (30-100 chars)
Every section must be COMPLETE and DETAILED. Do not abbreviate or summarize.

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
  // Try to extract JSON from response — try multiple patterns
  // Some models wrap in ```json...```, some return raw JSON, some include text before/after
  const jsonMatch = text.match(/```json\n?([\s\S]*?)\n?```/) ||
                    text.match(/```\n?([\s\S]*?)\n?```/) ||
                    text.match(/(\{[\s\S]*\})/);

  if (jsonMatch) {
    try {
      const raw = jsonMatch[1] || jsonMatch[0];
      const json = JSON.parse(raw);

      // Normalize: ensure title exists
      if (!json.title && json.topic) json.title = json.topic;
      if (!json.topic && json.title) json.topic = json.title;

      // Normalize: if caption is missing/empty, build it from platform_captions or other fields
      if (!json.caption || (typeof json.caption === 'string' && json.caption.trim().length < 50)) {
        const platformCaptions = json.platform_captions || {};
        const firstCaption = Object.values(platformCaptions).find(
          (v): v is string => typeof v === 'string' && v.trim().length > 50
        );
        if (firstCaption) {
          json.caption = firstCaption;
          console.log(`[PARSE] Caption was empty/short — populated from platform_captions (${json.caption.length} chars)`);
        } else if (json.script_body && typeof json.script_body === 'string' && json.script_body.length > 100) {
          // Last resort: use hook + script_body as caption
          const hookPart = json.hook ? `${json.hook}\n\n` : '';
          const ctaPart = json.cta ? `\n\n${json.cta}` : '';
          json.caption = `${hookPart}${json.script_body}${ctaPart}`;
          console.log(`[PARSE] Caption was empty — built from hook+script_body+cta (${json.caption.length} chars)`);
        }
      }

      // Normalize: if script_body is missing but we have teaching_points or context_section, combine them
      if (!json.script_body || (typeof json.script_body === 'string' && json.script_body.trim().length < 50)) {
        const parts = [json.context_section, json.teaching_points, json.reframe, json.problem_expansion, json.framework_teaching].filter(
          (v): v is string => typeof v === 'string' && v.trim().length > 0
        );
        if (parts.length > 0) {
          json.script_body = parts.join('\n\n');
          console.log(`[PARSE] script_body was empty — built from sub-sections (${json.script_body.length} chars)`);
        }
      }

      return json;
    } catch (e) {
      console.error('[PARSE] Failed to parse JSON from AI response:', e);
      console.error('[PARSE] Raw text (first 500 chars):', text.substring(0, 500));
    }
  } else {
    console.error('[PARSE] No JSON found in AI response. First 500 chars:', text.substring(0, 500));
  }

  // Fallback based on format — this should be caught by validation and retried
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
  if (title.length < 10) {
    return { valid: false, reason: `Title too short (${title.length} chars, need 10+)` };
  }
  if (PLACEHOLDER_TITLES.includes(title.toLowerCase())) {
    return { valid: false, reason: `Placeholder title detected: "${title}"` };
  }

  // Caption is the primary post text — must be substantial
  const caption = (parsed.caption || '').trim();
  if (caption.length < 200) {
    return { valid: false, reason: `Caption too short (${caption.length} chars, need 200+). Write a full social media post, not a summary.` };
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
    if (headline.length < 10) {
      return { valid: false, reason: `Static headline too short (${headline.length} chars, need 10+)` };
    }
    if (bodyText.length < 40) {
      return { valid: false, reason: `Static body_text too short (${bodyText.length} chars, need 40+)` };
    }
  } else {
    // short, medium, long
    const hook = (parsed.hook || '').trim();
    const scriptBody = (parsed.script_body || '').trim();
    if (hook.length < 40) {
      return { valid: false, reason: `Hook too short (${hook.length} chars, need 40+)` };
    }
    if (scriptBody.length < 150) {
      return { valid: false, reason: `Script body too short (${scriptBody.length} chars, need 150+)` };
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
  selectedBrandVariables?: string[] | null,
  rejectionFeedback?: string,
  templateOverrides?: { script?: string; hook?: string; cta?: string }
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
      return { success: false, error: 'Insufficient credits', retryable: false };
    }
  }

  const format = item.format as ContentFormat;
  const funnelStage = item.funnel_stage as FunnelStage;
  const storybrandStage = item.storybrand_stage as StoryBrandStage;
  const platforms = item.platforms || [];

  console.log(`[GEN-SINGLE] Getting script framework: format=${format}, funnel=${funnelStage}, storybrand=${storybrandStage}, templateOverrides=${JSON.stringify(templateOverrides || null)}`);
  const framework = await getScriptFrameworkFromDB(supabase as SupabaseClient<Database>, format, funnelStage, storybrandStage, platforms, templateOverrides);
  console.log(`[GEN-SINGLE] Framework: category=${framework.formatCategory}, script=${framework.scriptTemplateName}, hook=${framework.hookTemplateName}`);

  // Content themes for topic diversity
  const contentThemes = extractContentThemes(brandContext);
  const itemIndex = previouslyGenerated.length;
  const themeHint = contentThemes.length > 0
    ? contentThemes[itemIndex % contentThemes.length]
    : null;

  // Smart variable selection: 7 per post (4 core + 3 random rotating)
  // If user explicitly selected variables, respect their choice
  const effectiveVars = selectedBrandVariables && selectedBrandVariables.length > 0
    ? selectedBrandVariables
    : selectSmartVariables(previouslyGenerated.length);
  console.log(`[GEN-SINGLE] Brand variables: ${effectiveVars.length} selected (${selectedBrandVariables ? 'user-chosen' : 'smart-random'}): ${effectiveVars.join(', ')}`);

  const systemPrompt = buildSystemPrompt(brandContext, org?.name || 'Your Brand', effectiveVars, rejectionFeedback);
  console.log(`[GEN-SINGLE] System prompt size: ${systemPrompt.length} chars`);

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

  const maxTokens = framework.formatCategory === 'long' ? 6144 :
                     framework.formatCategory === 'medium' ? 4096 : 3072;

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

      // Rate limit / quota exhaustion — stop immediately, don't waste more attempts
      const msgLower = message.toLowerCase();
      if (msgLower.includes('429') || msgLower.includes('rate limit') || msgLower.includes('quota') || msgLower.includes('too many requests') || msgLower.includes('resource_exhausted')) {
        console.error(`[GEN-SINGLE] Rate limit / quota exhaustion detected — aborting all retries`);
        return {
          success: false,
          error: 'AI provider rate limit reached. Please wait a few minutes or switch to a different model.',
          retryable: false,
        };
      }

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
    return {
      success: false,
      error: `Database update failed: ${updateError.message}`,
      retryable: true,
    };
  }
  console.log(`[GEN-SINGLE] content_items updated successfully`);

  // Verify the update actually wrote data (catches silent RLS blocks)
  const { data: verifyItem } = await supabase
    .from('content_items')
    .select('id, topic, status')
    .eq('id', item.id)
    .single();
  if (!verifyItem || !verifyItem.topic || verifyItem.status !== 'scripted') {
    console.error(`[GEN-SINGLE] UPDATE VERIFICATION FAILED — topic=${verifyItem?.topic}, status=${verifyItem?.status}`);
    return {
      success: false,
      error: 'Database update was silently rejected (possible RLS issue)',
      retryable: false,
    };
  }

  // Track AI usage + deduct credits (only for verified content)
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
