import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { processNextItems } from '@/lib/content-engine/queue-service';

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = createServiceClient();
    const result = await processNextItems(supabase);

    return NextResponse.json({
      ok: true,
      ...result,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Processing failed';
    console.error('Queue processing error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
