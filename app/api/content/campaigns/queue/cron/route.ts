import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { processV3QueueCron } from '@/lib/content-engine/v3-queue-service';
import type { Database } from '@/types/database';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * Dedicated Queue Processing Cron Job
 * Runs every 15 minutes to process any pending generation batches
 * This ensures posts are generated even if users close their browser
 */
export async function GET(request: Request) {
  try {
    // Verify cron secret (Vercel cron)
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}` && process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createServiceClient();
    const db = supabase as unknown as import('@supabase/supabase-js').SupabaseClient<Database>;

    // Process queue items
    const result = await processV3QueueCron(db);

    return NextResponse.json({
      success: true,
      processed: result.processed,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
