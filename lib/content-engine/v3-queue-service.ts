// ============================================================
// V3 Content Engine — Queue Service
// Client-driven polling pattern for campaign batch generation
// ============================================================

import { SupabaseClient } from '@supabase/supabase-js';
import type { Database, Json } from '@/types/database';
import { generateV3Post } from './generate-content-v3';
import { MAX_BATCH_FREE, MAX_BATCH_PAID, ITEMS_PER_CRON_CYCLE, LOCK_TIMEOUT_MIN } from './queue-config';

// ---- Types ----

export interface V3EnqueueParams {
  organizationId: string;
  campaignId: string;
  adsetId: string;
  userId: string;
  postIds: string[];
  modelId: string;
  selectedBrandVariables?: string[] | null;
  creativeDirection?: string;
}

export interface V3BatchStatus {
  batchId: string;
  status: string;
  totalItems: number;
  completedItems: number;
  failedItems: number;
  batchComplete: boolean;
}

// ---- Enqueue a campaign batch ----

export async function enqueueCampaignBatch(
  supabase: SupabaseClient<Database>,
  params: V3EnqueueParams,
  isSuperAdmin: boolean = false
): Promise<{ batchId: string; totalItems: number }> {
  const { organizationId, campaignId, adsetId, userId, postIds, modelId, selectedBrandVariables, creativeDirection } = params;

  // Enforce batch size limits
  const maxItems = isSuperAdmin ? 999 : (await isPaidOrg(supabase, organizationId) ? MAX_BATCH_PAID : MAX_BATCH_FREE);
  if (postIds.length > maxItems) {
    throw new Error(`Batch size ${postIds.length} exceeds limit of ${maxItems}`);
  }

  // Create batch record
  const { data: batch, error: batchError } = await supabase
    .from('v3_generation_batches')
    .insert({
      organization_id: organizationId,
      campaign_id: campaignId,
      adset_id: adsetId,
      user_id: userId,
      model_id: modelId,
      status: 'pending',
      total_items: postIds.length,
      completed_items: 0,
      failed_items: 0,
      uniqueness_log: [] as unknown as Json,
      selected_brand_variables: (selectedBrandVariables || null) as unknown as Json,
      creative_direction: creativeDirection || null,
    })
    .select('id')
    .single();

  if (batchError || !batch) {
    throw new Error(`Failed to create batch: ${batchError?.message}`);
  }

  // Create queue entries
  const queueEntries = postIds.map((postId, i) => ({
    batch_id: batch.id,
    post_id: postId,
    organization_id: organizationId,
    status: 'pending' as const,
    priority: postIds.length - i, // higher priority for earlier posts
  }));

  const { error: queueError } = await supabase
    .from('v3_generation_queue')
    .insert(queueEntries);

  if (queueError) {
    throw new Error(`Failed to create queue entries: ${queueError.message}`);
  }

  return { batchId: batch.id, totalItems: postIds.length };
}

// ---- Get batch status ----

export async function getV3BatchStatus(
  supabase: SupabaseClient<Database>,
  batchId: string
): Promise<V3BatchStatus> {
  const { data: batch } = await supabase
    .from('v3_generation_batches')
    .select('id, status, total_items, completed_items, failed_items')
    .eq('id', batchId)
    .single();

  if (!batch) {
    return { batchId, status: 'not_found', totalItems: 0, completedItems: 0, failedItems: 0, batchComplete: true };
  }

  const batchComplete = batch.status === 'completed' || batch.status === 'failed' || batch.status === 'cancelled';

  return {
    batchId: batch.id,
    status: batch.status,
    totalItems: batch.total_items,
    completedItems: batch.completed_items,
    failedItems: batch.failed_items,
    batchComplete,
  };
}

// ---- Process one item in a batch (called by client polling) ----

export async function processOneV3Item(
  supabase: SupabaseClient<Database>,
  batchId: string
): Promise<{ processed: boolean; batchComplete: boolean }> {
  // Find next pending item
  const { data: queueItem } = await supabase
    .from('v3_generation_queue')
    .select('*')
    .eq('batch_id', batchId)
    .eq('status', 'pending')
    .order('priority', { ascending: false })
    .limit(1)
    .single();

  if (!queueItem) {
    // No pending items — check if batch is done
    await finalizeBatchIfComplete(supabase, batchId);
    return { processed: false, batchComplete: true };
  }

  // Lock the item
  const now = new Date().toISOString();
  await supabase
    .from('v3_generation_queue')
    .update({ status: 'processing', locked_at: now })
    .eq('id', queueItem.id);

  // Update batch status to processing
  await supabase
    .from('v3_generation_batches')
    .update({ status: 'processing', updated_at: now })
    .eq('id', batchId)
    .eq('status', 'pending');

  // Load batch context
  const { data: batch } = await supabase
    .from('v3_generation_batches')
    .select('*')
    .eq('id', batchId)
    .single();

  if (!batch) {
    return { processed: false, batchComplete: true };
  }

  const uniquenessLog = (Array.isArray(batch.uniqueness_log) ? batch.uniqueness_log : []) as Array<{ topic: string; hook: string }>;
  const selectedVars = batch.selected_brand_variables as string[] | null;

  try {
    // Generate content for this post
    const result = await generateV3Post(
      supabase,
      batch.organization_id,
      batch.user_id,
      queueItem.post_id,
      batch.model_id,
      uniquenessLog,
      selectedVars,
      batch.creative_direction || undefined
    );

    if (result.success && result.content) {
      // Mark queue item completed
      await supabase
        .from('v3_generation_queue')
        .update({ status: 'completed', completed_at: new Date().toISOString() })
        .eq('id', queueItem.id);

      // Update batch counters + uniqueness log
      const newLog = [...uniquenessLog, { topic: result.content.topic, hook: result.content.hook }];
      await supabase
        .from('v3_generation_batches')
        .update({
          completed_items: (batch.completed_items || 0) + 1,
          uniqueness_log: newLog as unknown as Json,
          updated_at: new Date().toISOString(),
        })
        .eq('id', batchId);
    } else {
      // Handle failure
      const newAttempt = (queueItem.attempt_count || 0) + 1;
      if (newAttempt >= queueItem.max_attempts) {
        await supabase
          .from('v3_generation_queue')
          .update({ status: 'failed', attempt_count: newAttempt, error_message: result.error || 'Unknown error' })
          .eq('id', queueItem.id);

        await supabase
          .from('v3_generation_batches')
          .update({
            failed_items: (batch.failed_items || 0) + 1,
            updated_at: new Date().toISOString(),
          })
          .eq('id', batchId);
      } else {
        // Retry: reset to pending
        await supabase
          .from('v3_generation_queue')
          .update({ status: 'pending', attempt_count: newAttempt, locked_at: null, error_message: result.error })
          .eq('id', queueItem.id);
      }
    }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error';
    const newAttempt = (queueItem.attempt_count || 0) + 1;

    await supabase
      .from('v3_generation_queue')
      .update({
        status: newAttempt >= queueItem.max_attempts ? 'failed' : 'pending',
        attempt_count: newAttempt,
        locked_at: null,
        error_message: errorMsg,
      })
      .eq('id', queueItem.id);

    if (newAttempt >= queueItem.max_attempts) {
      await supabase
        .from('v3_generation_batches')
        .update({
          failed_items: (batch.failed_items || 0) + 1,
          updated_at: new Date().toISOString(),
        })
        .eq('id', batchId);
    }
  }

  // Check if batch is now complete
  const complete = await finalizeBatchIfComplete(supabase, batchId);
  return { processed: true, batchComplete: complete };
}

// ---- Cancel a batch ----

export async function cancelV3Batch(
  supabase: SupabaseClient<Database>,
  batchId: string
): Promise<void> {
  await supabase
    .from('v3_generation_queue')
    .update({ status: 'failed', error_message: 'Cancelled by user' })
    .eq('batch_id', batchId)
    .eq('status', 'pending');

  await supabase
    .from('v3_generation_batches')
    .update({ status: 'cancelled', updated_at: new Date().toISOString(), completed_at: new Date().toISOString() })
    .eq('id', batchId);
}

// ---- Cron: process pending items across all batches ----

export async function processV3QueueCron(
  supabase: SupabaseClient<Database>
): Promise<{ processed: number }> {
  // Unlock stale items
  const staleThreshold = new Date(Date.now() - LOCK_TIMEOUT_MIN * 60 * 1000).toISOString();
  await supabase
    .from('v3_generation_queue')
    .update({ status: 'pending', locked_at: null })
    .eq('status', 'processing')
    .lt('locked_at', staleThreshold);

  // Find batches with pending items
  const { data: pendingItems } = await supabase
    .from('v3_generation_queue')
    .select('batch_id')
    .eq('status', 'pending')
    .limit(ITEMS_PER_CRON_CYCLE);

  if (!pendingItems || pendingItems.length === 0) return { processed: 0 };

  const uniqueBatchIds = Array.from(new Set(pendingItems.map(i => i.batch_id)));
  let processed = 0;

  for (const batchId of uniqueBatchIds) {
    if (processed >= ITEMS_PER_CRON_CYCLE) break;
    const result = await processOneV3Item(supabase, batchId);
    if (result.processed) processed++;
  }

  return { processed };
}

// ---- Internal helpers ----

async function finalizeBatchIfComplete(
  supabase: SupabaseClient<Database>,
  batchId: string
): Promise<boolean> {
  const { data: remaining } = await supabase
    .from('v3_generation_queue')
    .select('id')
    .eq('batch_id', batchId)
    .in('status', ['pending', 'processing'])
    .limit(1);

  if (remaining && remaining.length > 0) return false;

  // All items done
  await supabase
    .from('v3_generation_batches')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', batchId)
    .in('status', ['pending', 'processing']);

  return true;
}

async function isPaidOrg(supabase: SupabaseClient<Database>, orgId: string): Promise<boolean> {
  const { data: org } = await supabase
    .from('organizations')
    .select('subscription_status')
    .eq('id', orgId)
    .single();

  return org?.subscription_status === 'active';
}
