import { SupabaseClient } from '@supabase/supabase-js';
import { buildBrandContextPrompt, getFormatCategory, type ContentFormat } from '@/config/script-frameworks';
import { buildBrandContextMap } from '@/lib/content-engine/generate-content';
import { resolveModel, getProviderAdapterForUser, deductCredits, calculateCreditCost } from '@/lib/ai/server';
import type { AIFeature } from '@/lib/ai';

export interface GenerateScriptResult {
  hook: string | null;
  script_body: string | null;
  cta: string | null;
  filming_notes: string | null;
  context_section: string | null;
  teaching_points: string | null;
  reframe: string | null;
  problem_expansion: string | null;
  framework_teaching: string | null;
  case_study: string | null;
}

/**
 * Generate a script from existing post content (caption + hashtags).
 * The script aligns with the post and uses brand context.
 */
export async function generateScriptFromPost(
  supabase: SupabaseClient,
  orgId: string,
  userId: string,
  params: {
    caption: string;
    hashtags: string[];
    format: string;
    funnelStage: string;
    storybrandStage: string;
    modelOverride?: string | null;
    selectedBrandVariables?: string[] | null;
  }
): Promise<GenerateScriptResult> {
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
  const { adapter, usingUserKey } = await getProviderAdapterForUser(resolvedModel.provider, userId);

  const brandPrompt = Object.keys(brandContext).length > 0
    ? buildBrandContextPrompt(brandContext, params.selectedBrandVariables || undefined)
    : `No brand context available. Write professional content for ${orgName}.`;

  const formatCategory = getFormatCategory(params.format as ContentFormat);

  const shortFields = `{
  "hook": "attention-grabbing opening line (1-2 sentences)",
  "script_body": "the main script content (3-8 sentences)",
  "cta": "clear call-to-action (1-2 sentences)",
  "filming_notes": "production notes: camera angles, b-roll, text overlays, transitions"
}`;

  const mediumFields = `{
  "hook": "attention-grabbing opening line",
  "context_section": "set the scene and establish the problem (2-3 sentences)",
  "teaching_points": "key educational points or insights (3-5 bullet points as text)",
  "reframe": "the paradigm shift or new perspective",
  "script_body": "the full script body tying it all together",
  "cta": "clear call-to-action",
  "filming_notes": "production notes: camera angles, b-roll, text overlays"
}`;

  const longFields = `{
  "hook": "attention-grabbing opening",
  "context_section": "set the scene and establish context",
  "problem_expansion": "deep dive into the problem and its implications",
  "framework_teaching": "the framework or method being taught",
  "teaching_points": "key educational points and insights",
  "case_study": "real example or case study illustrating the point",
  "reframe": "the paradigm shift or new perspective",
  "script_body": "full script body with all sections woven together",
  "cta": "clear call-to-action",
  "filming_notes": "production notes: camera angles, b-roll, text overlays"
}`;

  const fieldsTemplate = formatCategory === 'long' ? longFields : formatCategory === 'medium' ? mediumFields : shortFields;

  const systemPrompt = `You are a video scriptwriter for ${orgName}. You create engaging, brand-aligned scripts from social media posts.

${brandPrompt}

RULES:
- The script must align with and expand on the post caption provided
- Write in the brand's authentic voice
- Be specific and actionable
- Return ONLY valid JSON — no markdown, no code blocks`;

  const userPrompt = `Create a ${formatCategory}-form video script based on this social media post:

POST CAPTION:
${params.caption}

HASHTAGS: ${params.hashtags.map(h => `#${h}`).join(' ')}

CONTEXT:
- Funnel stage: ${params.funnelStage}
- StoryBrand stage: ${params.storybrandStage}
- Format: ${params.format} (${formatCategory}-form)

Return a JSON object with these fields:
${fieldsTemplate}

The script should expand on the post's message — go deeper, provide more value, and be ready for filming.`;

  const response = await adapter.complete({
    messages: [{ role: 'user', content: userPrompt }],
    systemPrompt,
    maxTokens: 3000,
    temperature: 0.7,
    modelId: resolvedModel.modelId,
  });

  // Deduct credits (skip when using user's own key)
  if (!resolvedModel.isFree && !usingUserKey) {
    const creditCost = calculateCreditCost(resolvedModel.id, response.inputTokens, response.outputTokens);
    if (creditCost > 0) {
      await deductCredits(orgId, userId, creditCost, null, 'AI assist script generation');
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
    hook: parsed.hook || null,
    script_body: parsed.script_body || null,
    cta: parsed.cta || null,
    filming_notes: parsed.filming_notes || null,
    context_section: parsed.context_section || null,
    teaching_points: parsed.teaching_points || null,
    reframe: parsed.reframe || null,
    problem_expansion: parsed.problem_expansion || null,
    framework_teaching: parsed.framework_teaching || null,
    case_study: parsed.case_study || null,
  };
}
