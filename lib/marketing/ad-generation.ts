/**
 * Core AI ad generation logic.
 *
 * Generates ad creatives for Meta and TikTok using the same AI provider
 * infrastructure as content generation, with platform-specific prompt builders.
 *
 * Follows the same patterns as lib/content-engine/generate-content.ts:
 *  - Fetches brand outputs from DB
 *  - Builds brand context prompt (reuses buildBrandContextPrompt from config/script-frameworks)
 *  - Builds platform-specific system prompt
 *  - Calls AI provider adapter
 *  - Parses JSON response
 *  - Tracks credits and AI usage
 *
 * Also supports batch generation with client-driven polling,
 * mirroring the queue-service pattern from content engine.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, Json } from '@/types/database';
import { buildBrandContextPrompt } from '@/config/script-frameworks';
import {
  resolveModel,
  calculateCreditCost,
  deductCredits,
  checkCredits,
  getProviderAdapterForUser,
  isSuperAdmin,
} from '@/lib/ai/server';
import type { AIFeature } from '@/lib/ai';
import { buildBrandContextMap } from '@/lib/content-engine/generate-content';
import { buildMetaAdSystemPrompt } from './ad-prompts/meta-ad-prompts';
import { buildTikTokAdSystemPrompt } from './ad-prompts/tiktok-ad-prompts';
import type { AdCopyOutput } from './ad-prompts/ad-frameworks';
import { createNotification } from '@/lib/notifications';

type ServiceClient = SupabaseClient<Database>;

// ── Constants ──────────────────────────────────────────────────

const MAX_AD_VALIDATION_RETRIES = 2;
const MAX_AD_BATCH_FREE = 5;
const MAX_AD_BATCH_PAID = 20;

// ── Types ──────────────────────────────────────────────────────

export interface GenerateAdCreativeParams {
  orgId: string;
  userId: string;
  platform: 'meta' | 'tiktok';
  format: string;
  objective: string;
  funnelStage: string;
  ctaType: string;
  modelId?: string | null;
  selectedBrandVariables?: string[] | null;
  specialAdCategory?: string | null;
  /** Previously generated copy in this batch, used to enforce uniqueness */
  previousVariations?: AdCopyOutput[];
}

export interface GenerateAdCreativeResult {
  success: boolean;
  copy?: AdCopyOutput;
  inputTokens?: number;
  outputTokens?: number;
  creditsCharged?: number;
  modelUsed?: string;
  error?: string;
}

export interface GenerateAdBatchParams {
  orgId: string;
  userId: string;
  platform: 'meta' | 'tiktok';
  format: string;
  objective: string;
  funnelStage: string;
  ctaType: string;
  variationCount: number;
  modelId?: string | null;
  selectedBrandVariables?: string[] | null;
  specialAdCategory?: string | null;
  campaignId?: string | null;
  adSetId?: string | null;
  targetUrl: string;
}

export interface AdBatchStatus {
  batchId: string;
  status: string;
  totalVariations: number;
  completedVariations: number;
  failedVariations: number;
  percentage: number;
  creatives: Array<{
    id: string;
    primaryText: string;
    headline: string | null;
    status: string;
  }>;
}

// ── Single Ad Creative Generation ──────────────────────────────

/**
 * Generate a single ad creative using AI.
 * Fetches brand context, builds platform-specific prompt, calls AI, parses response.
 */
export async function generateAdCreative(
  supabase: ServiceClient,
  params: GenerateAdCreativeParams
): Promise<GenerateAdCreativeResult> {
  const {
    orgId,
    userId,
    platform,
    format,
    objective,
    funnelStage,
    ctaType,
    modelId,
    selectedBrandVariables,
    specialAdCategory,
    previousVariations,
  } = params;

  console.log(`[AD-GEN] generateAdCreative: org=${orgId}, platform=${platform}, format=${format}, objective=${objective}`);

  // 1. Load brand outputs
  const { data: outputs, error: outputsError } = await supabase
    .from('brand_outputs')
    .select('output_key, output_value')
    .eq('organization_id', orgId)
    .eq('is_locked', true);

  if (outputsError) {
    console.error(`[AD-GEN] Failed to load brand outputs:`, outputsError.message);
  }

  const brandContextMap = buildBrandContextMap(outputs || []);
  const brandContextPrompt = Object.keys(brandContextMap).length > 0
    ? buildBrandContextPrompt(brandContextMap, selectedBrandVariables || undefined)
    : 'No brand context available. Write professional ad copy.';

  // 2. Resolve AI model
  const resolvedModel = await resolveModel(orgId, 'content_generation' as AIFeature, modelId);
  const { adapter, usingUserKey } = await getProviderAdapterForUser(resolvedModel.provider, userId);
  console.log(`[AD-GEN] Model resolved: ${resolvedModel.modelId} (${resolvedModel.provider}), free=${resolvedModel.isFree}, usingUserKey=${usingUserKey}`);

  // 3. Credit check for paid models (skip when using user's own API key)
  if (!usingUserKey && !resolvedModel.isFree) {
    const balance = await checkCredits(orgId, 100, userId);
    if (!balance.hasCredits) {
      return { success: false, error: 'Insufficient credits' };
    }
  }

  // 4. Build platform-specific system prompt
  const systemPrompt = buildPlatformSystemPrompt(
    platform,
    brandContextPrompt,
    objective,
    funnelStage,
    format,
    ctaType,
    specialAdCategory
  );

  // 5. Build user prompt with uniqueness enforcement
  const userPrompt = buildAdUserPrompt(platform, format, objective, funnelStage, ctaType, previousVariations);

  // 6. Call AI with retry/validation loop
  const temperature = resolvedModel.isFree ? 0.95 : 0.85;
  const maxTokens = 2048;

  let validCopy: AdCopyOutput | null = null;
  let validResponse: { text: string; inputTokens: number; outputTokens: number } | null = null;
  let lastError = '';

  for (let attempt = 1; attempt <= MAX_AD_VALIDATION_RETRIES; attempt++) {
    try {
      console.log(`[AD-GEN] Attempt ${attempt}/${MAX_AD_VALIDATION_RETRIES}`);

      const response = await adapter.complete({
        messages: [{ role: 'user', content: userPrompt }],
        systemPrompt,
        maxTokens,
        temperature,
        modelId: resolvedModel.modelId,
        jsonMode: true,
      });

      const parsed = parseAdCopyResponse(response.text);
      const validation = validateAdCopy(parsed, platform, format);

      if (validation.valid) {
        validCopy = parsed;
        validResponse = response;
        console.log(`[AD-GEN] Validation passed on attempt ${attempt}`);
        break;
      } else {
        lastError = validation.reason || 'Unknown validation failure';
        console.warn(`[AD-GEN] Validation failed attempt ${attempt}: ${lastError}`);
      }
    } catch (err) {
      lastError = err instanceof Error ? err.message : 'Unknown AI error';
      console.error(`[AD-GEN] Exception attempt ${attempt}: ${lastError}`);
    }
  }

  if (!validCopy || !validResponse) {
    console.error(`[AD-GEN] All attempts failed: ${lastError}`);
    return { success: false, error: `Ad copy generation failed: ${lastError}` };
  }

  // 7. Track usage and deduct credits
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

  if (creditsCharged > 0 && !usingUserKey) {
    await deductCredits(
      orgId,
      userId,
      creditsCharged,
      usageRow?.id || null,
      `Ad creative generation \u2014 ${resolvedModel.name}`
    );
  }

  console.log(`[AD-GEN] Success: primaryText="${validCopy.primaryText.substring(0, 60)}...", credits=${creditsCharged}`);

  return {
    success: true,
    copy: validCopy,
    inputTokens: validResponse.inputTokens,
    outputTokens: validResponse.outputTokens,
    creditsCharged,
    modelUsed: resolvedModel.modelId,
  };
}

// ── Batch Generation ───────────────────────────────────────────

/**
 * Create an ad generation batch and insert the batch record.
 * Does NOT start processing \u2014 the client polls processAdBatchVariation()
 * to drive progress (same pattern as content queue).
 */
export async function createAdGenerationBatch(
  supabase: ServiceClient,
  params: GenerateAdBatchParams
): Promise<{ batchId: string; totalVariations: number }> {
  const {
    orgId,
    userId,
    platform,
    format,
    objective,
    funnelStage,
    ctaType,
    variationCount,
    modelId,
    selectedBrandVariables,
    specialAdCategory,
    campaignId,
    adSetId,
  } = params;

  console.log(`[AD-BATCH] Creating batch: org=${orgId}, platform=${platform}, variations=${variationCount}`);

  // Validate batch size (super admins bypass)
  const userIsAdmin = await isSuperAdmin(userId);
  const resolvedModel = await resolveModel(orgId, 'content_generation' as AIFeature, modelId);
  const maxBatch = userIsAdmin
    ? variationCount
    : (resolvedModel.isFree ? MAX_AD_BATCH_FREE : MAX_AD_BATCH_PAID);
  const limitedCount = Math.min(variationCount, maxBatch);

  const { data: batch, error: batchError } = await supabase
    .from('ad_generation_batches')
    .insert({
      organization_id: orgId,
      campaign_id: campaignId || null,
      ad_set_id: adSetId || null,
      user_id: userId,
      model_id: resolvedModel.id,
      platform,
      format,
      objective: objective || null,
      funnel_stage: funnelStage || null,
      selected_brand_variables: (selectedBrandVariables || null) as unknown as Json,
      status: 'pending',
      total_variations: limitedCount,
      completed_variations: 0,
      failed_variations: 0,
    })
    .select('id')
    .single();

  if (batchError || !batch) {
    console.error(`[AD-BATCH] Failed to create batch:`, batchError?.message);
    throw new Error(`Failed to create ad generation batch: ${batchError?.message || 'unknown'}`);
  }

  console.log(`[AD-BATCH] Batch created: ${batch.id}, variations=${limitedCount}`);
  return { batchId: batch.id, totalVariations: limitedCount };
}

/**
 * Process exactly ONE variation from an ad generation batch.
 * Called synchronously (awaited) by the client-driven polling endpoint.
 * Returns whether a variation was processed and whether the batch is complete.
 */
export async function processAdBatchVariation(
  supabase: ServiceClient,
  batchId: string
): Promise<{ processed: boolean; batchComplete: boolean; error?: string }> {
  console.log(`[AD-BATCH-PROCESS] Processing one variation for batch: ${batchId}`);

  // Load batch
  const { data: batch, error: batchError } = await supabase
    .from('ad_generation_batches')
    .select('*')
    .eq('id', batchId)
    .single();

  if (!batch || batchError) {
    console.error(`[AD-BATCH-PROCESS] Batch not found: ${batchId}`);
    return { processed: false, batchComplete: true, error: 'Batch not found' };
  }

  // Check if already complete or cancelled
  if (batch.status === 'completed' || batch.status === 'failed' || batch.status === 'cancelled') {
    return { processed: false, batchComplete: true };
  }

  // Check if all variations are done
  const totalDone = batch.completed_variations + batch.failed_variations;
  if (totalDone >= batch.total_variations) {
    await finalizeBatch(supabase, batchId);
    return { processed: false, batchComplete: true };
  }

  // Mark batch as processing
  if (batch.status === 'pending') {
    await supabase
      .from('ad_generation_batches')
      .update({ status: 'processing', updated_at: new Date().toISOString() })
      .eq('id', batchId);
  }

  // Load previously generated creatives for uniqueness
  const { data: existingCreatives } = await supabase
    .from('ad_creatives')
    .select('primary_text, headline')
    .eq('organization_id', batch.organization_id)
    .order('created_at', { ascending: false })
    .limit(20);

  const previousVariations: AdCopyOutput[] = (existingCreatives || []).map(c => ({
    primaryText: c.primary_text,
    headline: c.headline,
    description: null,
    ctaType: '',
    hookStyle: '',
  }));

  // Parse selected brand variables
  const selectedVars = Array.isArray(batch.selected_brand_variables)
    ? batch.selected_brand_variables as string[]
    : null;

  // Generate one ad creative
  let itemError: string | undefined;

  try {
    const result = await generateAdCreative(supabase, {
      orgId: batch.organization_id,
      userId: batch.user_id,
      platform: batch.platform as 'meta' | 'tiktok',
      format: batch.format,
      objective: batch.objective || '',
      funnelStage: batch.funnel_stage || 'awareness',
      ctaType: 'learn_more', // Default; can be overridden via batch metadata in future
      modelId: batch.model_id,
      selectedBrandVariables: selectedVars,
      specialAdCategory: null,
      previousVariations,
    });

    if (result.success && result.copy) {
      // Create ad_creatives record
      const variationNumber = batch.completed_variations + batch.failed_variations + 1;
      const { error: insertError } = await supabase
        .from('ad_creatives')
        .insert({
          organization_id: batch.organization_id,
          campaign_id: batch.campaign_id || null,
          ad_set_id: batch.ad_set_id || null,
          name: `${batch.platform} Ad \u2014 Variation ${variationNumber}`,
          format: batch.format,
          primary_text: result.copy.primaryText,
          headline: result.copy.headline || null,
          description: result.copy.description || null,
          cta_type: result.copy.ctaType || null,
          target_url: '', // To be set by the user when they assign the creative to a campaign
          ai_generated: true,
          ai_model: result.modelUsed || null,
          funnel_stage: batch.funnel_stage || null,
          selected_brand_variables: (selectedVars || null) as unknown as Json,
          status: 'draft',
          created_by: batch.user_id,
        });

      if (insertError) {
        console.error(`[AD-BATCH-PROCESS] Failed to insert ad creative:`, insertError.message);
        itemError = `DB insert failed: ${insertError.message}`;
        await incrementBatchFailed(supabase, batchId);
      } else {
        // Increment completed count
        await supabase
          .from('ad_generation_batches')
          .update({
            completed_variations: batch.completed_variations + 1,
            updated_at: new Date().toISOString(),
          })
          .eq('id', batchId);
        console.log(`[AD-BATCH-PROCESS] Variation ${variationNumber} completed`);
      }
    } else {
      itemError = result.error || 'Generation failed';
      console.error(`[AD-BATCH-PROCESS] Generation failed: ${itemError}`);
      await incrementBatchFailed(supabase, batchId);
    }
  } catch (err) {
    itemError = err instanceof Error ? err.message : 'Unknown error';
    console.error(`[AD-BATCH-PROCESS] Exception:`, itemError);
    await incrementBatchFailed(supabase, batchId);
  }

  // Check if batch is now complete
  const { data: updatedBatch } = await supabase
    .from('ad_generation_batches')
    .select('completed_variations, failed_variations, total_variations')
    .eq('id', batchId)
    .single();

  const newTotalDone = (updatedBatch?.completed_variations || 0) + (updatedBatch?.failed_variations || 0);
  const batchComplete = newTotalDone >= (updatedBatch?.total_variations || 0);

  if (batchComplete) {
    await finalizeBatch(supabase, batchId);
  }

  return { processed: true, batchComplete, error: itemError };
}

/**
 * Get batch status for polling.
 */
export async function getAdBatchStatus(
  supabase: ServiceClient,
  batchId: string
): Promise<AdBatchStatus | null> {
  const { data: batch } = await supabase
    .from('ad_generation_batches')
    .select('*')
    .eq('id', batchId)
    .single();

  if (!batch) return null;

  // Get generated creatives
  const { data: creatives } = await supabase
    .from('ad_creatives')
    .select('id, primary_text, headline, status')
    .eq('organization_id', batch.organization_id)
    .eq('ai_generated', true)
    .gte('created_at', batch.created_at)
    .order('created_at', { ascending: false })
    .limit(batch.total_variations);

  const totalDone = batch.completed_variations + batch.failed_variations;
  const percentage = batch.total_variations > 0 ? Math.round((totalDone / batch.total_variations) * 100) : 0;

  return {
    batchId: batch.id,
    status: batch.status,
    totalVariations: batch.total_variations,
    completedVariations: batch.completed_variations,
    failedVariations: batch.failed_variations,
    percentage,
    creatives: (creatives || []).map(c => ({
      id: c.id,
      primaryText: c.primary_text,
      headline: c.headline,
      status: c.status,
    })),
  };
}

/**
 * Cancel an ad generation batch.
 */
export async function cancelAdBatch(
  supabase: ServiceClient,
  batchId: string
): Promise<{ cancelled: boolean }> {
  await supabase
    .from('ad_generation_batches')
    .update({
      status: 'cancelled',
      updated_at: new Date().toISOString(),
    })
    .eq('id', batchId);

  return { cancelled: true };
}

// ── Internal Helpers ───────────────────────────────────────────

function buildPlatformSystemPrompt(
  platform: 'meta' | 'tiktok',
  brandContextPrompt: string,
  objective: string,
  funnelStage: string,
  format: string,
  ctaType: string,
  specialAdCategory?: string | null
): string {
  if (platform === 'meta') {
    return buildMetaAdSystemPrompt(brandContextPrompt, objective, funnelStage, format, ctaType, specialAdCategory);
  }
  return buildTikTokAdSystemPrompt(brandContextPrompt, objective, funnelStage, format, ctaType);
}

function buildAdUserPrompt(
  platform: string,
  format: string,
  objective: string,
  funnelStage: string,
  ctaType: string,
  previousVariations?: AdCopyOutput[]
): string {
  let uniquenessSection = '';
  if (previousVariations && previousVariations.length > 0) {
    const previousSummaries = previousVariations
      .slice(-10) // Last 10 for context window management
      .map((v, i) => `${i + 1}. Primary: "${v.primaryText.substring(0, 80)}..." | Hook: ${v.hookStyle}`)
      .join('\n');

    uniquenessSection = `
ALREADY GENERATED (DO NOT REPEAT):
${previousSummaries}

You MUST create a COMPLETELY DIFFERENT ad variation:
- Use a different hook style/formula than the ones above.
- Take a different angle on the pain point, outcome, or value proposition.
- Vary sentence structure, opening word, and emotional tone.
`;
  }

  return `Generate one ${platform.toUpperCase()} ad creative.

Platform: ${platform}
Format: ${format}
Objective: ${objective}
Funnel stage: ${funnelStage}
CTA type: ${ctaType}
${uniquenessSection}
Create a single ad variation following all the rules in your system prompt.
Return ONLY valid JSON. No markdown, no code blocks, no explanation.`;
}

/**
 * Parse AI response into AdCopyOutput.
 * Handles both clean JSON and markdown-wrapped JSON.
 */
function parseAdCopyResponse(text: string): AdCopyOutput {
  // Try to extract JSON
  const jsonMatch = text.match(/```json\n?([\s\S]*?)\n?```/) ||
                    text.match(/\{[\s\S]*\}/);

  if (jsonMatch) {
    try {
      const json = JSON.parse(jsonMatch[1] || jsonMatch[0]);
      return {
        primaryText: json.primaryText || json.primary_text || '',
        headline: json.headline || null,
        description: json.description || null,
        ctaType: json.ctaType || json.cta_type || '',
        hookStyle: json.hookStyle || json.hook_style || '',
        scriptNotes: json.scriptNotes || json.script_notes || undefined,
      };
    } catch (e) {
      console.error('[AD-GEN] Failed to parse JSON response:', e);
    }
  }

  // Fallback: treat entire response as primaryText
  return {
    primaryText: text.substring(0, 300),
    headline: null,
    description: null,
    ctaType: '',
    hookStyle: 'unknown',
  };
}

/**
 * Validate that parsed ad copy meets minimum quality thresholds.
 */
function validateAdCopy(
  copy: AdCopyOutput,
  platform: string,
  format: string
): { valid: boolean; reason?: string } {
  // Primary text is always required
  if (!copy.primaryText || copy.primaryText.trim().length < 10) {
    return { valid: false, reason: `Primary text too short (${copy.primaryText?.length || 0} chars, need 10+)` };
  }

  // Check for placeholder text
  const placeholders = ['primary text here', 'your ad text', 'lorem ipsum', 'placeholder', 'insert text'];
  const primaryLower = copy.primaryText.toLowerCase();
  for (const ph of placeholders) {
    if (primaryLower.includes(ph)) {
      return { valid: false, reason: `Placeholder text detected: "${ph}"` };
    }
  }

  // Meta-specific: headline is expected for most formats
  if (platform === 'meta' && format !== 'meta_stories') {
    if (!copy.headline || copy.headline.trim().length < 3) {
      return { valid: false, reason: `Meta headline required but missing or too short` };
    }
    if (copy.headline.length > 45) {
      return { valid: false, reason: `Meta headline too long (${copy.headline.length} chars, max 45)` };
    }
  }

  // Meta description length check
  if (platform === 'meta' && copy.description && copy.description.length > 35) {
    return { valid: false, reason: `Meta description too long (${copy.description.length} chars, max 35)` };
  }

  // TikTok: primary text should be short
  if (platform === 'tiktok' && copy.primaryText.length > 150) {
    return { valid: false, reason: `TikTok ad text too long (${copy.primaryText.length} chars, max ~100 recommended)` };
  }

  // Hook style should be specified
  if (!copy.hookStyle || copy.hookStyle === 'unknown') {
    return { valid: false, reason: 'Hook style not specified' };
  }

  return { valid: true };
}

/**
 * Finalize a batch: mark as completed or failed, send notification.
 */
async function finalizeBatch(supabase: ServiceClient, batchId: string): Promise<void> {
  const { data: batch } = await supabase
    .from('ad_generation_batches')
    .select('completed_variations, failed_variations, total_variations, user_id, organization_id, status')
    .eq('id', batchId)
    .single();

  if (!batch) return;

  // Already finalized
  if (batch.status === 'completed' || batch.status === 'failed' || batch.status === 'cancelled') {
    return;
  }

  const allFailed = batch.completed_variations === 0 && batch.failed_variations > 0;
  const finalStatus = allFailed ? 'failed' : 'completed';

  await supabase
    .from('ad_generation_batches')
    .update({
      status: finalStatus,
      updated_at: new Date().toISOString(),
    })
    .eq('id', batchId);

  // Send notification
  await createNotification({
    supabase,
    userId: batch.user_id,
    orgId: batch.organization_id,
    type: 'generation_completed',
    title: 'Ad creative generation complete',
    body: `${batch.completed_variations} of ${batch.total_variations} ad variations generated successfully.${batch.failed_variations > 0 ? ` ${batch.failed_variations} failed.` : ''}`,
    link: '/ads/creatives',
    metadata: { ad_batch_id: batchId },
  });

  console.log(`[AD-BATCH] Batch ${batchId} finalized: status=${finalStatus}, completed=${batch.completed_variations}, failed=${batch.failed_variations}`);
}

/**
 * Increment the failed_variations counter on a batch.
 */
async function incrementBatchFailed(supabase: ServiceClient, batchId: string): Promise<void> {
  const { data: batch } = await supabase
    .from('ad_generation_batches')
    .select('failed_variations')
    .eq('id', batchId)
    .single();

  await supabase
    .from('ad_generation_batches')
    .update({
      failed_variations: (batch?.failed_variations || 0) + 1,
      updated_at: new Date().toISOString(),
    })
    .eq('id', batchId);
}
