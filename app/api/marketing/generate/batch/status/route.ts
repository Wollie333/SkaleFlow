import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { resolveModel, getModelConfig, deductCredits, calculateCreditCost } from '@/lib/ai/server';
import { getProviderAdapter } from '@/lib/ai/server';
import {
  getHookFormulasPrompt,
  getCtaExamplesPrompt,
  getFunnelGuidelinesPrompt,
  AD_FORMAT_SPECS,
} from '@/lib/marketing/ad-prompts/ad-frameworks';
import type { Json } from '@/types/database';

// Allow up to 60s for AI generation per variation
export const maxDuration = 60;

interface BatchRecord {
  id: string;
  organization_id: string;
  campaign_id: string | null;
  ad_set_id: string | null;
  user_id: string;
  platform: string;
  format: string;
  objective: string | null;
  funnel_stage: string | null;
  model_id: string;
  total_variations: number;
  completed_variations: number;
  failed_variations: number;
  status: string;
  selected_brand_variables: any;
}

async function processOneVariation(
  serviceClient: ReturnType<typeof createServiceClient>,
  batch: BatchRecord
): Promise<{ success: boolean; error?: string }> {
  const variationIndex = batch.completed_variations + batch.failed_variations;

  if (variationIndex >= batch.total_variations) {
    return { success: true };
  }

  // Update batch status to processing
  if (batch.status === 'pending') {
    await serviceClient
      .from('ad_generation_batches')
      .update({ status: 'processing' })
      .eq('id', batch.id);
  }

  try {
    // Get brand outputs for context
    const { data: brandOutputs } = await serviceClient
      .from('brand_outputs')
      .select('phase, variable_key, output_value')
      .eq('organization_id', batch.organization_id)
      .not('output_value', 'is', null);

    // Build brand context
    let brandContext = '';
    if (brandOutputs && brandOutputs.length > 0) {
      const selectedVars = batch.selected_brand_variables;
      const filtered = selectedVars
        ? brandOutputs.filter((o: any) => selectedVars.includes(o.variable_key))
        : brandOutputs;

      brandContext = filtered
        .map((o: any) => `${o.variable_key}: ${o.output_value}`)
        .join('\n');
    }

    // Build the AI prompt
    const formatSpec = AD_FORMAT_SPECS[batch.format];
    const hookFormulas = getHookFormulasPrompt(['problem_focused', 'outcome_focused', 'curiosity', 'social_proof']);
    const ctaExamples = getCtaExamplesPrompt('learn_more');
    const funnelGuidelines = batch.funnel_stage ? getFunnelGuidelinesPrompt(batch.funnel_stage) : '';

    // Get special ad category from campaign if linked
    let specialAdCategory: string | null = null;
    if (batch.campaign_id) {
      const { data: campaignData } = await serviceClient
        .from('ad_campaigns')
        .select('special_ad_category')
        .eq('id', batch.campaign_id)
        .single();
      specialAdCategory = campaignData?.special_ad_category || null;
    }

    const systemPrompt = `You are an expert performance marketer and ad copywriter.
You create high-converting ad creatives for ${batch.platform === 'meta' ? 'Meta (Facebook/Instagram)' : 'TikTok'} ads.

## BRAND CONTEXT
${brandContext || 'No specific brand context provided.'}

## AD FORMAT
Format: ${formatSpec?.label || batch.format}
Platform: ${batch.platform}
${formatSpec?.primaryTextMax ? `Primary text limit: ${formatSpec.primaryTextMax} characters` : ''}
${formatSpec?.headlineMax ? `Headline limit: ${formatSpec.headlineMax} characters` : ''}
${formatSpec?.descriptionMax ? `Description limit: ${formatSpec.descriptionMax} characters` : ''}
${formatSpec?.hasScript ? 'This format supports video scripts.' : ''}

## CAMPAIGN OBJECTIVE
${batch.objective || 'awareness'}
${specialAdCategory ? `\nSpecial Ad Category: ${specialAdCategory} — Ensure compliance with restricted category guidelines.` : ''}

## HOOK FORMULAS
${hookFormulas}

## CTA
${ctaExamples}

${funnelGuidelines ? `## FUNNEL STAGE GUIDELINES\n${funnelGuidelines}` : ''}

## INSTRUCTIONS
Generate ONE unique ad creative variation (variation #${variationIndex + 1} of ${batch.total_variations}).
${variationIndex > 0 ? 'Make this variation distinctly different from previous ones — use a different hook style, angle, or emotional trigger.' : ''}

Respond in valid JSON with this exact structure:
{
  "primaryText": "...",
  "headline": "..." or null,
  "description": "..." or null,
  "ctaType": "learn_more|shop_now|sign_up|download|get_quote|apply_now|book_now|contact_us",
  "hookStyle": "problem_focused|stat_driven|outcome_focused|curiosity|social_proof",
  "scriptNotes": "..." or null
}

STRICT: Stay within character limits. Do not include markdown formatting — pure JSON only.`;

    const model = getModelConfig(batch.model_id);
    if (!model) {
      throw new Error(`Invalid model: ${batch.model_id}`);
    }

    const adapter = getProviderAdapter(model.provider);
    const response = await adapter.complete({
      modelId: batch.model_id,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Generate variation #${variationIndex + 1} for a ${batch.objective} campaign.` },
      ],
      temperature: 0.85 + (variationIndex * 0.03), // Slight temp variation for diversity
      maxTokens: 1000,
    });

    // Parse the AI response
    let adCopy: {
      primaryText: string;
      headline: string | null;
      description: string | null;
      ctaType: string;
      hookStyle: string;
      scriptNotes?: string | null;
    };

    try {
      const text = response.text.trim();
      // Strip potential markdown fencing
      const jsonStr = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
      adCopy = JSON.parse(jsonStr);
    } catch {
      throw new Error('Failed to parse AI response as JSON');
    }

    // Create the ad creative record
    const { error: insertError } = await serviceClient
      .from('ad_creatives')
      .insert({
        campaign_id: batch.campaign_id,
        ad_set_id: batch.ad_set_id,
        organization_id: batch.organization_id,
        name: `AI Generated #${variationIndex + 1} - ${adCopy.hookStyle || 'variation'}`,
        format: batch.format,
        primary_text: adCopy.primaryText,
        headline: adCopy.headline || null,
        description: adCopy.description || null,
        cta_type: adCopy.ctaType || 'learn_more',
        target_url: '',
        status: 'draft',
        compliance_status: 'pending',
        ai_generated: true,
        ai_model: batch.model_id,
        funnel_stage: batch.funnel_stage,
        selected_brand_variables: (batch.selected_brand_variables || null) as unknown as Json,
        created_by: batch.user_id,
      });

    if (insertError) {
      throw new Error(`Failed to save creative: ${insertError.message}`);
    }

    // Deduct credits for paid models
    if (!model.isFree) {
      const creditCost = calculateCreditCost(
        batch.model_id,
        response.inputTokens || 800,
        response.outputTokens || 400
      );
      await deductCredits(
        batch.organization_id,
        batch.user_id,
        creditCost,
        null,
        `Ad creative generation (variation ${variationIndex + 1}/${batch.total_variations})`
      );
    }

    // Update batch progress
    await serviceClient
      .from('ad_generation_batches')
      .update({
        completed_variations: batch.completed_variations + 1,
        status: (batch.completed_variations + 1 + batch.failed_variations) >= batch.total_variations ? 'completed' : 'processing',
        updated_at: new Date().toISOString(),
      })
      .eq('id', batch.id);

    return { success: true };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error';
    console.error(`[AD-GEN-STATUS] Variation ${variationIndex + 1} failed:`, errorMsg);

    // Update batch with failure
    const newFailed = batch.failed_variations + 1;
    const isComplete = (batch.completed_variations + newFailed) >= batch.total_variations;

    await serviceClient
      .from('ad_generation_batches')
      .update({
        failed_variations: newFailed,
        status: isComplete ? (batch.completed_variations > 0 ? 'completed' : 'failed') : 'processing',
        updated_at: new Date().toISOString(),
      })
      .eq('id', batch.id);

    return { success: false, error: errorMsg };
  }
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const batchId = request.nextUrl.searchParams.get('batchId');
  if (!batchId) {
    return NextResponse.json({ error: 'batchId is required' }, { status: 400 });
  }

  const action = request.nextUrl.searchParams.get('action');
  console.log(`[AD-GEN-STATUS] batchId=${batchId}, action=${action || 'none'}, user=${user.id}`);

  const serviceClient = createServiceClient();

  // When the tracker requests processing, generate ONE variation synchronously
  // before returning the updated status. This ensures the AI call completes
  // within the request lifecycle (not fire-and-forget).
  if (action === 'process') {
    // Get current batch state
    const { data: batch } = await serviceClient
      .from('ad_generation_batches')
      .select('*')
      .eq('id', batchId)
      .single();

    if (batch && batch.status !== 'completed' && batch.status !== 'failed' && batch.status !== 'cancelled') {
      console.log('[AD-GEN-STATUS] Starting processOneVariation...');
      const startTime = Date.now();
      try {
        const result = await processOneVariation(serviceClient, batch as unknown as BatchRecord);
        const elapsed = Date.now() - startTime;
        console.log(`[AD-GEN-STATUS] processOneVariation completed in ${elapsed}ms:`, JSON.stringify(result));
      } catch (err) {
        const elapsed = Date.now() - startTime;
        console.error(`[AD-GEN-STATUS] processOneVariation FAILED after ${elapsed}ms:`, err);
      }
    }
  }

  // Fetch current batch status
  const { data: batch, error } = await serviceClient
    .from('ad_generation_batches')
    .select('*')
    .eq('id', batchId)
    .single();

  if (error || !batch) {
    return NextResponse.json({ error: 'Batch not found' }, { status: 404 });
  }

  // Fetch generated creatives for this batch
  const { data: creatives } = await serviceClient
    .from('ad_creatives')
    .select('id, name, format, primary_text, headline, description, cta_type, status, compliance_status, ai_generated')
    .eq('ai_generated', true)
    .eq('organization_id', batch.organization_id)
    .order('created_at', { ascending: true });

  console.log(`[AD-GEN-STATUS] Returning status: ${batch.status}, ${batch.completed_variations}/${batch.total_variations} done, ${batch.failed_variations} failed`);

  return NextResponse.json({
    status: batch.status,
    totalVariations: batch.total_variations,
    completedVariations: batch.completed_variations,
    failedVariations: batch.failed_variations,
    creatives: creatives || [],
  });
}
