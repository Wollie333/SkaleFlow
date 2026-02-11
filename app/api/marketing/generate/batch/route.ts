import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { getModelConfig, checkCredits, isSuperAdmin, requireCredits } from '@/lib/ai/server';
import type { Json } from '@/types/database';

export async function POST(request: NextRequest) {
  console.log('[AD-GEN-BATCH] POST /api/marketing/generate/batch called');

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.log('[AD-GEN-BATCH] No user — returning 401');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const {
    organizationId,
    campaignId,
    adSetId,
    platform,
    format,
    objective,
    funnelStage,
    ctaType,
    modelId,
    variationCount,
    selectedBrandVariables,
    specialAdCategory,
  } = body;

  console.log('[AD-GEN-BATCH] Body:', {
    organizationId, campaignId, platform, format, objective,
    funnelStage, modelId, variationCount,
    hasBrandVars: !!selectedBrandVariables,
  });

  if (!organizationId || !campaignId || !platform || !format || !objective || !modelId) {
    return NextResponse.json({
      error: 'organizationId, campaignId, platform, format, objective, and modelId are required',
    }, { status: 400 });
  }

  // Verify membership
  const { data: membership } = await supabase
    .from('org_members')
    .select('role')
    .eq('user_id', user.id)
    .eq('organization_id', organizationId)
    .single();

  if (!membership) {
    return NextResponse.json({ error: 'Not a member of this organization' }, { status: 403 });
  }

  if (!['owner', 'admin'].includes(membership.role)) {
    return NextResponse.json({ error: 'Only owners and admins can generate ad creatives' }, { status: 403 });
  }

  // Validate model
  const model = getModelConfig(modelId);
  if (!model) {
    return NextResponse.json({ error: 'Invalid model' }, { status: 400 });
  }

  const totalVariations = variationCount || 3;

  // Check credits for paid models (super_admins bypass)
  if (!model.isFree) {
    const userIsSuperAdmin = await isSuperAdmin(user.id);
    if (!userIsSuperAdmin) {
      const estimatedCreditsPerVariation = 120;
      const totalEstimated = estimatedCreditsPerVariation * totalVariations;
      const balance = await checkCredits(organizationId, totalEstimated, user.id);
      if (!balance.hasCredits) {
        return NextResponse.json({
          error: 'Insufficient credits for this generation batch',
          creditsRequired: totalEstimated,
          creditsAvailable: balance.totalRemaining,
        }, { status: 402 });
      }
    }
  }

  try {
    // Verify campaign exists and belongs to this org
    const { data: campaign } = await supabase
      .from('ad_campaigns')
      .select('id, organization_id')
      .eq('id', campaignId)
      .eq('organization_id', organizationId)
      .single();

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    const serviceClient = createServiceClient();

    // Create batch record
    const { data: batch, error: batchError } = await serviceClient
      .from('ad_generation_batches')
      .insert({
        organization_id: organizationId,
        campaign_id: campaignId,
        ad_set_id: adSetId || null,
        user_id: user.id,
        platform,
        format,
        objective,
        funnel_stage: funnelStage || null,
        cta_type: ctaType || 'learn_more',
        model_id: modelId,
        total_variations: totalVariations,
        completed_variations: 0,
        failed_variations: 0,
        status: 'pending',
        selected_brand_variables: (selectedBrandVariables || null) as unknown as Json,
        special_ad_category: specialAdCategory || null,
      })
      .select()
      .single();

    if (batchError || !batch) {
      console.error('[AD-GEN-BATCH] Failed to create batch:', batchError);
      return NextResponse.json({ error: 'Failed to create generation batch' }, { status: 500 });
    }

    console.log(`[AD-GEN-BATCH] Batch created: ${batch.id}, totalVariations: ${totalVariations}`);

    return NextResponse.json({
      batchId: batch.id,
      totalVariations,
      status: 'pending',
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to enqueue batch';
    console.error('[AD-GEN-BATCH] ERROR:', message, err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
