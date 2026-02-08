import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/server';
import { enqueueBatch } from '@/lib/content-engine/queue-service';
import { getModelConfig, checkCredits, isSuperAdmin } from '@/lib/ai';
import { MAX_BATCH_FREE, MAX_BATCH_PAID } from '@/lib/content-engine/queue-config';

export async function POST(request: NextRequest) {
  console.log('[QUEUE-ENQUEUE] POST /api/content/generate/queue called');

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.log('[QUEUE-ENQUEUE] No user — returning 401');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  console.log('[QUEUE-ENQUEUE] User:', user.id);

  const body = await request.json();
  const { organizationId, calendarId, contentItemIds, modelOverride, selectedBrandVariables } = body;
  console.log('[QUEUE-ENQUEUE] Body:', { organizationId, calendarId, modelOverride, itemCount: contentItemIds?.length, hasBrandVars: !!selectedBrandVariables });

  if (!organizationId || !contentItemIds || !Array.isArray(contentItemIds) || contentItemIds.length === 0) {
    console.log('[QUEUE-ENQUEUE] Missing required fields');
    return NextResponse.json({ error: 'organizationId and contentItemIds are required' }, { status: 400 });
  }

  if (!modelOverride) {
    console.log('[QUEUE-ENQUEUE] Missing modelOverride');
    return NextResponse.json({ error: 'modelOverride is required' }, { status: 400 });
  }

  // Verify user is member of org
  const { data: membership } = await supabase
    .from('org_members')
    .select('role')
    .eq('user_id', user.id)
    .eq('organization_id', organizationId)
    .single();

  if (!membership) {
    console.log('[QUEUE-ENQUEUE] User not a member of org');
    return NextResponse.json({ error: 'Not a member of this organization' }, { status: 403 });
  }
  console.log('[QUEUE-ENQUEUE] Membership role:', membership.role);

  // Validate model
  const model = getModelConfig(modelOverride);
  if (!model) {
    console.log('[QUEUE-ENQUEUE] Invalid model:', modelOverride);
    return NextResponse.json({ error: 'Invalid model' }, { status: 400 });
  }
  console.log('[QUEUE-ENQUEUE] Model config:', { id: model.id, name: model.name, provider: model.provider, isFree: model.isFree });

  // Check batch size limit (super_admins bypass)
  const userIsSuperAdmin = await isSuperAdmin(user.id);
  if (!userIsSuperAdmin) {
    const maxBatch = model.isFree ? MAX_BATCH_FREE : MAX_BATCH_PAID;
    if (contentItemIds.length > maxBatch) {
      return NextResponse.json({
        error: `Batch too large. Max ${maxBatch} items for ${model.isFree ? 'free' : 'paid'} models.`,
        maxBatch,
      }, { status: 400 });
    }
  }

  // Pre-flight credit check for paid models (super_admins bypass)
  if (!model.isFree) {
    const estimatedCreditsPerItem = 140;
    const totalEstimated = estimatedCreditsPerItem * contentItemIds.length;
    const balance = await checkCredits(organizationId, totalEstimated, user.id);
    if (!balance.hasCredits) {
      return NextResponse.json({
        error: 'Insufficient credits for this batch',
        creditsRequired: totalEstimated,
        creditsAvailable: balance.totalRemaining,
      }, { status: 402 });
    }
  }

  try {
    console.log('[QUEUE-ENQUEUE] Calling enqueueBatch...');
    const serviceClient = createServiceClient();
    const { batchId, totalItems } = await enqueueBatch(serviceClient, {
      orgId: organizationId,
      calendarId: calendarId || null,
      userId: user.id,
      contentItemIds,
      modelId: modelOverride,
      selectedBrandVariables: selectedBrandVariables || null,
    });

    console.log(`[QUEUE-ENQUEUE] Batch created: ${batchId}, totalItems: ${totalItems}`);
    return NextResponse.json({
      batchId,
      totalItems,
      status: 'pending',
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to enqueue batch';
    console.error('[QUEUE-ENQUEUE] ERROR:', message, err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
