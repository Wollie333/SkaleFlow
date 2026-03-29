import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET — Check for active generation batches for this campaign
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: campaignId } = await params;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Find the most recent active batch for this campaign
    const { data: batch } = await supabase
      .from('v3_generation_batches')
      .select('id, status, total_items, completed_items, failed_items')
      .eq('campaign_id', campaignId)
      .in('status', ['pending', 'processing'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!batch) {
      return NextResponse.json({ batchId: null });
    }

    return NextResponse.json({
      batchId: batch.id,
      status: batch.status,
      totalItems: batch.total_items,
      completedItems: batch.completed_items,
      failedItems: batch.failed_items,
    });
  } catch (err) {
    return NextResponse.json({ batchId: null });
  }
}
