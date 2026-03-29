import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getV3BatchStatus, processOneV3Item, processMultipleV3Items } from '@/lib/content-engine/v3-queue-service';
import type { Database } from '@/types/database';

export const maxDuration = 300; // 5 minutes for batch processing

// GET — Poll batch status + optionally process next item(s)
// Returns shape compatible with GenerationBatchTracker
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const batchId = searchParams.get('batchId');
    const action = searchParams.get('action');
    const concurrency = parseInt(searchParams.get('concurrency') || '3');

    if (!batchId) {
      return NextResponse.json({ error: 'batchId required' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const db = supabase as unknown as import('@supabase/supabase-js').SupabaseClient<Database>;
    let processError: string | null = null;

    // If action=process, process item(s) before returning status
    if (action === 'process') {
      try {
        // Use concurrent processing if concurrency > 1
        if (concurrency > 1) {
          await processMultipleV3Items(db, batchId, Math.min(concurrency, 5));
        } else {
          await processOneV3Item(db, batchId);
        }
      } catch (err) {
        processError = err instanceof Error ? err.message : 'Processing failed';
      }
    }

    const status = await getV3BatchStatus(db, batchId);

    // Fetch recently completed posts for display
    const { data: recentPosts } = await supabase
      .from('v3_generation_queue')
      .select('post_id')
      .eq('batch_id', batchId)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .limit(3);

    const recentItems: Array<{ id: string; topic: string | null; status: string }> = [];
    if (recentPosts && recentPosts.length > 0) {
      const postIds = recentPosts.map(r => r.post_id);
      const { data: posts } = await supabase
        .from('content_posts')
        .select('id, topic, status')
        .in('id', postIds);
      if (posts) {
        recentItems.push(...posts.map(p => ({ id: p.id, topic: p.topic, status: p.status })));
      }
    }

    // Fetch failed details
    const { data: failedItems } = await supabase
      .from('v3_generation_queue')
      .select('post_id, error_message')
      .eq('batch_id', batchId)
      .eq('status', 'failed')
      .limit(5);

    const failedDetails = failedItems?.map(f => ({
      contentItemId: f.post_id,
      error: f.error_message || 'Unknown error',
    })) || [];

    const total = status.totalItems || 1;
    const percentage = Math.round(((status.completedItems + status.failedItems) / total) * 100);

    return NextResponse.json({
      batchId: status.batchId,
      status: status.status,
      totalItems: status.totalItems,
      completedItems: status.completedItems,
      failedItems: status.failedItems,
      percentage,
      recentItems,
      failedDetails,
      processError,
    });
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
