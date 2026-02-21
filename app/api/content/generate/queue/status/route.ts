import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/server';
import { getBatchStatus, processOneBatchItem } from '@/lib/content-engine/queue-service';

// Allow up to 60s for AI generation per item
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.log('[QUEUE-STATUS] No user — returning 401');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const batchId = request.nextUrl.searchParams.get('batchId');
  if (!batchId) {
    return NextResponse.json({ error: 'batchId is required' }, { status: 400 });
  }

  const action = request.nextUrl.searchParams.get('action');
  console.log(`[QUEUE-STATUS] batchId=${batchId}, action=${action || 'none'}, user=${user.id}`);

  // Verify user belongs to the batch's org
  const serviceClient = createServiceClient();
  const { data: batch } = await serviceClient.from('generation_batches').select('organization_id').eq('id', batchId).single();
  if (batch) {
    const { data: member } = await supabase.from('org_members').select('id').eq('user_id', user.id).eq('organization_id', batch.organization_id).single();
    if (!member) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  }

  // When the tracker requests processing, generate ONE item synchronously
  // before returning the updated status. This ensures the AI call completes
  // within the request lifecycle (not fire-and-forget).
  let processError: string | null = null;

  if (action === 'process') {
    console.log('[QUEUE-STATUS] Starting processOneBatchItem...');
    const startTime = Date.now();
    try {
      const result = await processOneBatchItem(serviceClient, batchId);
      const elapsed = Date.now() - startTime;
      console.log(`[QUEUE-STATUS] processOneBatchItem completed in ${elapsed}ms:`, JSON.stringify(result));
      // Capture item-level errors so the tracker can display them
      if (result.error) processError = result.error;
    } catch (err) {
      const elapsed = Date.now() - startTime;
      processError = err instanceof Error ? err.message : 'Processing failed';
      console.error(`[QUEUE-STATUS] processOneBatchItem FAILED after ${elapsed}ms:`, err);
    }
  }

  const status = await getBatchStatus(serviceClient, batchId);

  if (!status) {
    console.log('[QUEUE-STATUS] Batch not found:', batchId);
    return NextResponse.json({ error: 'Batch not found' }, { status: 404 });
  }

  console.log(`[QUEUE-STATUS] Returning status: ${status.status}, ${status.completedItems}/${status.totalItems} done, ${status.failedItems} failed, processError=${processError || 'none'}`);
  return NextResponse.json({ ...status, processError });
}
