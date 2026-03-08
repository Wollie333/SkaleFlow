import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cancelV3Batch } from '@/lib/content-engine/v3-queue-service';
import type { Database } from '@/types/database';

// POST — Cancel a generation batch
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { batchId } = body;

    if (!batchId) return NextResponse.json({ error: 'batchId required' }, { status: 400 });

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await cancelV3Batch(
      supabase as unknown as import('@supabase/supabase-js').SupabaseClient<Database>,
      batchId
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
