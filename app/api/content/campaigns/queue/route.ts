import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getV3BatchStatus, processOneV3Item } from '@/lib/content-engine/v3-queue-service';
import type { Database } from '@/types/database';

export const maxDuration = 60;

// GET — Poll batch status + optionally process next item
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const batchId = searchParams.get('batchId');
    const action = searchParams.get('action'); // 'process' to trigger processing

    if (!batchId) {
      return NextResponse.json({ error: 'batchId required' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // If action=process, process one item before returning status
    if (action === 'process') {
      const result = await processOneV3Item(
        supabase as unknown as import('@supabase/supabase-js').SupabaseClient<Database>,
        batchId
      );

      const status = await getV3BatchStatus(
        supabase as unknown as import('@supabase/supabase-js').SupabaseClient<Database>,
        batchId
      );

      return NextResponse.json({ ...status, processed: result.processed });
    }

    // Just return status
    const status = await getV3BatchStatus(
      supabase as unknown as import('@supabase/supabase-js').SupabaseClient<Database>,
      batchId
    );

    return NextResponse.json(status);
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
