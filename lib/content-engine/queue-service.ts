import { SupabaseClient } from '@supabase/supabase-js';
import type { Database, Json } from '@/types/database';
import { getModelConfig, isSuperAdmin } from '@/lib/ai';
import { generateSingleItem } from './generate-content';
import {
  MAX_BATCH_FREE,
  MAX_BATCH_PAID,
  ITEMS_PER_CRON_CYCLE,
  LOCK_TIMEOUT_MIN,
} from './queue-config';
import { createNotification } from '@/lib/notifications';

type ServiceClient = SupabaseClient<Database>;

interface EnqueueParams {
  orgId: string;
  calendarId?: string | null;
  userId: string;
  contentItemIds: string[];
  modelId: string;
  selectedBrandVariables?: string[] | null;
}

/**
 * Create a generation batch + queue items.
 * Returns the batch ID.
 */
export async function enqueueBatch(
  supabase: ServiceClient,
  { orgId, calendarId, userId, contentItemIds, modelId, selectedBrandVariables }: EnqueueParams
): Promise<{ batchId: string; totalItems: number }> {
  console.log(`[QUEUE-ENQUEUE-SVC] enqueueBatch: orgId=${orgId}, modelId=${modelId}, items=${contentItemIds.length}, userId=${userId}`);

  // Validate batch size (super_admins bypass limits)
  const model = getModelConfig(modelId);
  const userIsAdmin = await isSuperAdmin(userId);
  const maxBatch = userIsAdmin ? contentItemIds.length : (model?.isFree ? MAX_BATCH_FREE : MAX_BATCH_PAID);
  const limitedIds = contentItemIds.slice(0, maxBatch);
  console.log(`[QUEUE-ENQUEUE-SVC] Model: ${model?.name || 'NOT FOUND'}, isFree=${model?.isFree}, isAdmin=${userIsAdmin}, maxBatch=${maxBatch}, limitedTo=${limitedIds.length}`);

  // Create batch
  const { data: batch, error: batchError } = await supabase
    .from('generation_batches')
    .insert({
      organization_id: orgId,
      calendar_id: calendarId || null,
      user_id: userId,
      model_id: modelId,
      status: 'pending',
      total_items: limitedIds.length,
      completed_items: 0,
      failed_items: 0,
      uniqueness_log: '[]' as unknown as Json,
      selected_brand_variables: (selectedBrandVariables || null) as unknown as Json,
    })
    .select('id')
    .single();

  if (batchError || !batch) {
    console.error(`[QUEUE-ENQUEUE-SVC] Failed to create batch:`, batchError?.message);
    throw new Error(`Failed to create batch: ${batchError?.message || 'unknown'}`);
  }
  console.log(`[QUEUE-ENQUEUE-SVC] Batch created: ${batch.id}`);

  // Create queue items
  const queueRows = limitedIds.map((itemId, i) => ({
    batch_id: batch.id,
    content_item_id: itemId,
    organization_id: orgId,
    status: 'pending',
    priority: 0,
    attempt_count: 0,
    max_attempts: 3,
  }));

  const { error: queueError } = await supabase
    .from('generation_queue')
    .insert(queueRows);

  if (queueError) {
    console.error(`[QUEUE-ENQUEUE-SVC] Failed to create queue items:`, queueError.message);
    throw new Error(`Failed to create queue items: ${queueError.message}`);
  }

  console.log(`[QUEUE-ENQUEUE-SVC] Queue items created: ${limitedIds.length} items for batch ${batch.id}`);
  return { batchId: batch.id, totalItems: limitedIds.length };
}

/**
 * Cron worker: process next items from the queue.
 * Returns summary of what was processed.
 */
export async function processNextItems(
  supabase: ServiceClient
): Promise<{ processed: number; completed: number; failed: number; batchesCompleted: string[] }> {
  const now = new Date().toISOString();
  const lockCutoff = new Date(Date.now() - LOCK_TIMEOUT_MIN * 60 * 1000).toISOString();

  // 1. Unlock stale items (locked too long — probably crashed)
  await supabase
    .from('generation_queue')
    .update({ status: 'pending', locked_at: null })
    .eq('status', 'processing')
    .lt('locked_at', lockCutoff);

  // 2. Find a batch with pending items
  const { data: pendingItems } = await supabase
    .from('generation_queue')
    .select('id, batch_id, content_item_id, organization_id, attempt_count, max_attempts')
    .eq('status', 'pending')
    .order('priority', { ascending: true })
    .order('created_at', { ascending: true })
    .limit(ITEMS_PER_CRON_CYCLE);

  if (!pendingItems || pendingItems.length === 0) {
    return { processed: 0, completed: 0, failed: 0, batchesCompleted: [] };
  }

  // 3. Claim items by setting locked_at + status = processing
  const claimedIds = pendingItems.map(i => i.id);
  await supabase
    .from('generation_queue')
    .update({ status: 'processing', locked_at: now })
    .in('id', claimedIds);

  // Mark batch(es) as processing
  const batchIds = Array.from(new Set(pendingItems.map(i => i.batch_id)));
  for (const batchId of batchIds) {
    await supabase
      .from('generation_batches')
      .update({ status: 'processing', updated_at: now })
      .eq('id', batchId)
      .eq('status', 'pending');
  }

  let completed = 0;
  let failed = 0;
  const batchesCompleted: string[] = [];

  // 4. Process each item sequentially
  for (const queueItem of pendingItems) {
    // Load batch to get model_id, user_id, uniqueness_log, and selected_brand_variables
    const { data: batch } = await supabase
      .from('generation_batches')
      .select('model_id, user_id, uniqueness_log, selected_brand_variables')
      .eq('id', queueItem.batch_id)
      .single();

    if (!batch) {
      await markQueueItemFailed(supabase, queueItem.id, 'Batch not found');
      failed++;
      continue;
    }

    // Parse uniqueness log
    const uniquenessLog = Array.isArray(batch.uniqueness_log)
      ? batch.uniqueness_log as Array<{ title: string; hook: string; topic: string }>
      : [];

    // Also grab recent items from this org for cross-batch uniqueness
    const { data: recentItems } = await supabase
      .from('content_items')
      .select('topic, hook')
      .eq('organization_id', queueItem.organization_id)
      .eq('ai_generated', true)
      .not('topic', 'is', null)
      .order('updated_at', { ascending: false })
      .limit(10);

    const crossBatchContext = (recentItems || []).map(r => ({
      title: r.topic || '',
      hook: r.hook || '',
      topic: r.topic || '',
    }));

    // Merge: batch uniqueness log + cross-batch recent items (deduplicated)
    // Cap to last 12 entries to prevent prompt bloat (the prompt itself caps to 8)
    const mergedPrevious = [...uniquenessLog];
    for (const item of crossBatchContext) {
      if (item.title && !mergedPrevious.some(p => p.title === item.title)) {
        mergedPrevious.push(item);
      }
    }
    const allPrevious = mergedPrevious.slice(-12);

    try {
      const cronSelectedVars = Array.isArray(batch.selected_brand_variables)
        ? batch.selected_brand_variables as string[]
        : null;

      const result = await generateSingleItem(
        supabase,
        queueItem.organization_id,
        batch.user_id,
        queueItem.content_item_id,
        batch.model_id,
        allPrevious,
        cronSelectedVars
      );

      if (result.success && result.content) {
        // Mark queue item completed
        await supabase
          .from('generation_queue')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
          })
          .eq('id', queueItem.id);

        // Append to batch uniqueness log
        const newLogEntry = {
          title: result.content.title || '',
          hook: result.content.hook || '',
          topic: result.content.topic || '',
        };
        const updatedLog = [...uniquenessLog, newLogEntry];

        // Increment completed_items + update uniqueness log
        const { data: currentBatch } = await supabase
          .from('generation_batches')
          .select('completed_items')
          .eq('id', queueItem.batch_id)
          .single();

        await supabase
          .from('generation_batches')
          .update({
            completed_items: (currentBatch?.completed_items || 0) + 1,
            uniqueness_log: updatedLog as unknown as Json,
            updated_at: new Date().toISOString(),
          })
          .eq('id', queueItem.batch_id);

        completed++;
      } else {
        // Generation failed — check if retryable
        const nonRetryable = result.retryable === false;
        const newAttemptCount = queueItem.attempt_count + 1;
        if (nonRetryable || newAttemptCount >= queueItem.max_attempts) {
          await markQueueItemFailed(supabase, queueItem.id, result.error || 'Max retries exceeded');
          await incrementBatchFailed(supabase, queueItem.batch_id);
          failed++;
        } else {
          // Retry: set back to pending
          await supabase
            .from('generation_queue')
            .update({
              status: 'pending',
              attempt_count: newAttemptCount,
              locked_at: null,
              error_message: result.error || null,
            })
            .eq('id', queueItem.id);
        }
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      const newAttemptCount = queueItem.attempt_count + 1;
      if (newAttemptCount >= queueItem.max_attempts) {
        await markQueueItemFailed(supabase, queueItem.id, errorMsg);
        await incrementBatchFailed(supabase, queueItem.batch_id);
        failed++;
      } else {
        await supabase
          .from('generation_queue')
          .update({
            status: 'pending',
            attempt_count: newAttemptCount,
            locked_at: null,
            error_message: errorMsg,
          })
          .eq('id', queueItem.id);
      }
    }
  }

  // 5. Check if any batches are now complete
  for (const batchId of batchIds) {
    const { data: remaining } = await supabase
      .from('generation_queue')
      .select('id')
      .eq('batch_id', batchId)
      .in('status', ['pending', 'processing'])
      .limit(1);

    if (!remaining || remaining.length === 0) {
      // Batch is done
      const { data: batchData } = await supabase
        .from('generation_batches')
        .select('completed_items, failed_items, total_items, user_id, organization_id')
        .eq('id', batchId)
        .single();

      if (batchData) {
        const allFailed = batchData.completed_items === 0 && batchData.failed_items > 0;
        await supabase
          .from('generation_batches')
          .update({
            status: allFailed ? 'failed' : 'completed',
            completed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', batchId);

        // Send notification
        await createNotification({
          supabase,
          userId: batchData.user_id,
          orgId: batchData.organization_id,
          type: 'generation_completed',
          title: 'Content generation complete',
          body: `${batchData.completed_items} of ${batchData.total_items} posts generated successfully.${batchData.failed_items > 0 ? ` ${batchData.failed_items} failed.` : ''}`,
          link: '/calendar',
          metadata: { batch_id: batchId },
        });

        batchesCompleted.push(batchId);
      }
    }
  }

  return { processed: pendingItems.length, completed, failed, batchesCompleted };
}

/**
 * Get batch status for polling.
 */
export async function getBatchStatus(
  supabase: ServiceClient,
  batchId: string
): Promise<{
  batchId: string;
  status: string;
  totalItems: number;
  completedItems: number;
  failedItems: number;
  percentage: number;
  recentItems: Array<{ id: string; topic: string | null; status: string }>;
  failedDetails: Array<{ contentItemId: string; error: string }>;
} | null> {
  const { data: batch } = await supabase
    .from('generation_batches')
    .select('*')
    .eq('id', batchId)
    .single();

  if (!batch) return null;

  // Get recently completed items for live updates
  const { data: recentQueue } = await supabase
    .from('generation_queue')
    .select('content_item_id, status')
    .eq('batch_id', batchId)
    .eq('status', 'completed')
    .order('completed_at', { ascending: false })
    .limit(5);

  let recentItems: Array<{ id: string; topic: string | null; status: string }> = [];
  if (recentQueue && recentQueue.length > 0) {
    const contentIds = recentQueue.map(q => q.content_item_id);
    const { data: contentItems } = await supabase
      .from('content_items')
      .select('id, topic')
      .in('id', contentIds);

    recentItems = (contentItems || []).map(ci => ({
      id: ci.id,
      topic: ci.topic,
      status: 'completed',
    }));
  }

  // Get failed queue items with error messages
  let failedDetails: Array<{ contentItemId: string; error: string }> = [];
  if (batch.failed_items > 0) {
    const { data: failedQueue } = await supabase
      .from('generation_queue')
      .select('content_item_id, error_message')
      .eq('batch_id', batchId)
      .eq('status', 'failed')
      .order('completed_at', { ascending: false })
      .limit(5);

    failedDetails = (failedQueue || []).map(fq => ({
      contentItemId: fq.content_item_id,
      error: fq.error_message || 'Unknown error',
    }));
  }

  const totalDone = batch.completed_items + batch.failed_items;
  const percentage = batch.total_items > 0 ? Math.round((totalDone / batch.total_items) * 100) : 0;

  return {
    batchId: batch.id,
    status: batch.status,
    totalItems: batch.total_items,
    completedItems: batch.completed_items,
    failedItems: batch.failed_items,
    percentage,
    recentItems,
    failedDetails,
  };
}

/**
 * Cancel a batch — remove pending queue items, mark batch cancelled.
 */
export async function cancelBatch(
  supabase: ServiceClient,
  batchId: string
): Promise<{ cancelled: boolean }> {
  // Delete pending queue items
  await supabase
    .from('generation_queue')
    .delete()
    .eq('batch_id', batchId)
    .eq('status', 'pending');

  // Mark batch cancelled
  await supabase
    .from('generation_batches')
    .update({
      status: 'cancelled',
      updated_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
    })
    .eq('id', batchId);

  return { cancelled: true };
}

/**
 * Process exactly ONE pending item from a specific batch.
 * Called synchronously (awaited) by the status endpoint to drive progress
 * while the user watches. Returns whether an item was processed and whether
 * the batch is now complete.
 */
export async function processOneBatchItem(
  supabase: ServiceClient,
  batchId: string
): Promise<{ processed: boolean; batchComplete: boolean; error?: string }> {
  console.log(`[QUEUE-PROCESS] processOneBatchItem called for batch: ${batchId}`);
  const now = new Date().toISOString();
  const lockCutoff = new Date(Date.now() - LOCK_TIMEOUT_MIN * 60 * 1000).toISOString();

  // Unlock stale items in this batch
  const { data: staleUnlocked } = await supabase
    .from('generation_queue')
    .update({ status: 'pending', locked_at: null })
    .eq('status', 'processing')
    .eq('batch_id', batchId)
    .lt('locked_at', lockCutoff)
    .select('id');
  if (staleUnlocked && staleUnlocked.length > 0) {
    console.log(`[QUEUE-PROCESS] Unlocked ${staleUnlocked.length} stale items`);
  }

  // Find ONE pending item from this batch
  const { data: pendingItems, error: pendingError } = await supabase
    .from('generation_queue')
    .select('id, batch_id, content_item_id, organization_id, attempt_count, max_attempts')
    .eq('batch_id', batchId)
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
    .limit(1);

  console.log(`[QUEUE-PROCESS] Pending items query: found=${pendingItems?.length || 0}, error=${pendingError?.message || 'none'}`);

  if (!pendingItems || pendingItems.length === 0) {
    console.log('[QUEUE-PROCESS] No pending items — finalizing batch');
    await finalizeBatchIfComplete(supabase, batchId);
    return { processed: false, batchComplete: true };
  }

  const queueItem = pendingItems[0];
  console.log(`[QUEUE-PROCESS] Claiming queue item: ${queueItem.id}, content_item: ${queueItem.content_item_id}, attempt: ${queueItem.attempt_count}`);

  // Claim the item
  await supabase
    .from('generation_queue')
    .update({ status: 'processing', locked_at: now })
    .eq('id', queueItem.id);

  // Mark batch as processing
  await supabase
    .from('generation_batches')
    .update({ status: 'processing', updated_at: now })
    .eq('id', batchId)
    .eq('status', 'pending');

  // Load batch context
  const { data: batch, error: batchLoadError } = await supabase
    .from('generation_batches')
    .select('model_id, user_id, uniqueness_log, selected_brand_variables')
    .eq('id', batchId)
    .single();

  if (!batch) {
    console.error(`[QUEUE-PROCESS] Batch not found: ${batchId}, error: ${batchLoadError?.message}`);
    await markQueueItemFailed(supabase, queueItem.id, 'Batch not found');
    await incrementBatchFailed(supabase, batchId);
    const done = await finalizeBatchIfComplete(supabase, batchId);
    return { processed: true, batchComplete: done, error: 'Batch not found' };
  }

  console.log(`[QUEUE-PROCESS] Batch context: model=${batch.model_id}, user=${batch.user_id}`);

  // Parse uniqueness log
  const uniquenessLog = Array.isArray(batch.uniqueness_log)
    ? batch.uniqueness_log as Array<{ title: string; hook: string; topic: string }>
    : [];
  console.log(`[QUEUE-PROCESS] Uniqueness log entries: ${uniquenessLog.length}`);

  // Cross-batch uniqueness: last 10 recently generated items for this org
  const { data: recentItems } = await supabase
    .from('content_items')
    .select('topic, hook')
    .eq('organization_id', queueItem.organization_id)
    .eq('ai_generated', true)
    .not('topic', 'is', null)
    .order('updated_at', { ascending: false })
    .limit(10);

  const crossBatchContext = (recentItems || []).map(r => ({
    title: r.topic || '',
    hook: r.hook || '',
    topic: r.topic || '',
  }));

  // Merge: batch uniqueness log + cross-batch recent items (deduplicated)
  // Cap to last 12 entries to prevent prompt bloat (the prompt itself caps to 8)
  const mergedPrevious = [...uniquenessLog];
  for (const item of crossBatchContext) {
    if (item.title && !mergedPrevious.some(p => p.title === item.title)) {
      mergedPrevious.push(item);
    }
  }
  const allPrevious = mergedPrevious.slice(-12);
  console.log(`[QUEUE-PROCESS] Total uniqueness context: ${allPrevious.length} entries (capped from ${mergedPrevious.length})`);

  let itemError: string | undefined;

  try {
    console.log(`[QUEUE-PROCESS] Calling generateSingleItem for content_item=${queueItem.content_item_id}, model=${batch.model_id}`);
    const genStartTime = Date.now();

    const selectedVars = Array.isArray(batch.selected_brand_variables)
      ? batch.selected_brand_variables as string[]
      : null;

    const result = await generateSingleItem(
      supabase,
      queueItem.organization_id,
      batch.user_id,
      queueItem.content_item_id,
      batch.model_id,
      allPrevious,
      selectedVars
    );

    const genElapsed = Date.now() - genStartTime;
    console.log(`[QUEUE-PROCESS] generateSingleItem returned in ${genElapsed}ms: success=${result.success}, error=${result.error || 'none'}, hasContent=${!!result.content}`);
    if (result.content) {
      console.log(`[QUEUE-PROCESS] Generated content preview: title="${result.content.title}", hook="${(result.content.hook || '').substring(0, 60)}..."`);
    }

    if (result.success && result.content) {
      console.log(`[QUEUE-PROCESS] SUCCESS — marking queue item ${queueItem.id} as completed`);
      // Mark queue item completed
      await supabase
        .from('generation_queue')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', queueItem.id);

      // Append to batch uniqueness log + increment counter
      const newLogEntry = {
        title: result.content.title || '',
        hook: result.content.hook || '',
        topic: result.content.topic || '',
      };
      const updatedLog = [...uniquenessLog, newLogEntry];

      const { data: currentBatch } = await supabase
        .from('generation_batches')
        .select('completed_items')
        .eq('id', batchId)
        .single();

      const newCompleted = (currentBatch?.completed_items || 0) + 1;
      console.log(`[QUEUE-PROCESS] Updating batch completed_items: ${currentBatch?.completed_items || 0} → ${newCompleted}`);

      await supabase
        .from('generation_batches')
        .update({
          completed_items: newCompleted,
          uniqueness_log: updatedLog as unknown as Json,
          updated_at: new Date().toISOString(),
        })
        .eq('id', batchId);
    } else {
      // Generation returned failure
      itemError = result.error || 'Generation failed';
      const nonRetryable = result.retryable === false;
      const newAttemptCount = queueItem.attempt_count + 1;
      console.error(`[QUEUE-PROCESS] GENERATION FAILED: ${itemError}, attempt ${newAttemptCount}/${queueItem.max_attempts}, retryable=${!nonRetryable}`);

      if (nonRetryable || newAttemptCount >= queueItem.max_attempts) {
        console.error(`[QUEUE-PROCESS] ${nonRetryable ? 'Non-retryable failure' : 'Max retries reached'} — marking item ${queueItem.id} as failed`);
        await markQueueItemFailed(supabase, queueItem.id, itemError);
        await incrementBatchFailed(supabase, batchId);
      } else {
        console.log(`[QUEUE-PROCESS] Retrying — setting item ${queueItem.id} back to pending`);
        await supabase
          .from('generation_queue')
          .update({
            status: 'pending',
            attempt_count: newAttemptCount,
            locked_at: null,
            error_message: itemError,
          })
          .eq('id', queueItem.id);
      }
    }
  } catch (err) {
    itemError = err instanceof Error ? err.message : 'Unknown error';
    console.error(`[QUEUE-PROCESS] EXCEPTION in generateSingleItem:`, itemError, err);
    const newAttemptCount = queueItem.attempt_count + 1;
    if (newAttemptCount >= queueItem.max_attempts) {
      console.error(`[QUEUE-PROCESS] Max retries reached after exception — marking item ${queueItem.id} as failed`);
      await markQueueItemFailed(supabase, queueItem.id, itemError);
      await incrementBatchFailed(supabase, batchId);
    } else {
      console.log(`[QUEUE-PROCESS] Retrying after exception — setting item ${queueItem.id} back to pending`);
      await supabase
        .from('generation_queue')
        .update({
          status: 'pending',
          attempt_count: newAttemptCount,
          locked_at: null,
          error_message: itemError,
        })
        .eq('id', queueItem.id);
    }
  }

  // Check if batch is now complete
  const batchComplete = await finalizeBatchIfComplete(supabase, batchId);
  console.log(`[QUEUE-PROCESS] processOneBatchItem done. processed=true, batchComplete=${batchComplete}, error=${itemError || 'none'}`);
  return { processed: true, batchComplete, error: itemError };
}

/**
 * Check if a batch has no more pending/processing items, and finalize it if so.
 */
async function finalizeBatchIfComplete(
  supabase: ServiceClient,
  batchId: string
): Promise<boolean> {
  const { data: remaining } = await supabase
    .from('generation_queue')
    .select('id')
    .eq('batch_id', batchId)
    .in('status', ['pending', 'processing'])
    .limit(1);

  if (remaining && remaining.length > 0) {
    return false; // Still has pending items
  }

  // Check if already finalized
  const { data: batchData } = await supabase
    .from('generation_batches')
    .select('completed_items, failed_items, total_items, user_id, organization_id, status')
    .eq('id', batchId)
    .single();

  if (!batchData || batchData.status === 'completed' || batchData.status === 'failed' || batchData.status === 'cancelled') {
    return true; // Already finalized
  }

  const allFailed = batchData.completed_items === 0 && batchData.failed_items > 0;
  await supabase
    .from('generation_batches')
    .update({
      status: allFailed ? 'failed' : 'completed',
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', batchId);

  // Send notification
  await createNotification({
    supabase,
    userId: batchData.user_id,
    orgId: batchData.organization_id,
    type: 'generation_completed',
    title: 'Content generation complete',
    body: `${batchData.completed_items} of ${batchData.total_items} posts generated successfully.${batchData.failed_items > 0 ? ` ${batchData.failed_items} failed.` : ''}`,
    link: '/calendar',
    metadata: { batch_id: batchId },
  });

  return true;
}

// ── Helpers ────────────────────────────────────────────────────

async function markQueueItemFailed(
  supabase: ServiceClient,
  queueItemId: string,
  errorMessage: string
) {
  await supabase
    .from('generation_queue')
    .update({
      status: 'failed',
      error_message: errorMessage,
      completed_at: new Date().toISOString(),
    })
    .eq('id', queueItemId);
}

async function incrementBatchFailed(
  supabase: ServiceClient,
  batchId: string
) {
  const { data: batch } = await supabase
    .from('generation_batches')
    .select('failed_items')
    .eq('id', batchId)
    .single();

  await supabase
    .from('generation_batches')
    .update({
      failed_items: (batch?.failed_items || 0) + 1,
      updated_at: new Date().toISOString(),
    })
    .eq('id', batchId);
}
