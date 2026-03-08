import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// PATCH — Approve or dismiss an adjustment
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; adjId: string }> }
) {
  try {
    const { adjId } = await params;
    const body = await request.json();
    const { status } = body;

    if (!status || !['approved', 'dismissed'].includes(status)) {
      return NextResponse.json({ error: 'status must be "approved" or "dismissed"' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const updateData: Record<string, unknown> = { status };
    if (status === 'approved') updateData.approved_at = new Date().toISOString();
    if (status === 'dismissed') updateData.dismissed_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('campaign_adjustments')
      .update(updateData)
      .eq('id', adjId)
      .select()
      .single();

    if (error) throw error;

    // If approved and has proposed_ratio, update the adset
    if (status === 'approved' && data.proposed_ratio && data.adset_id) {
      await supabase
        .from('campaign_adsets')
        .update({
          content_type_ratio: data.proposed_ratio,
          updated_at: new Date().toISOString(),
        })
        .eq('id', data.adset_id);
    }

    return NextResponse.json({ adjustment: data });
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
