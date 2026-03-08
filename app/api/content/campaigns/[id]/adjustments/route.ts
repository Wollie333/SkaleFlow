import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET — List adjustments for a campaign
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: campaignId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: adjustments, error } = await supabase
      .from('campaign_adjustments')
      .select('*')
      .eq('campaign_id', campaignId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Map DB columns to frontend-expected shape
    const mapped = (adjustments || []).map(a => ({
      id: a.id,
      campaign_id: a.campaign_id,
      adset_id: a.adset_id,
      trigger_type: a.trigger_condition,
      severity: inferSeverity(a.trigger_condition),
      title: extractTitle(a.recommendation_text),
      description: a.recommendation_text,
      recommendation: a.recommendation_text,
      data: {
        current_ratio: a.current_ratio,
        proposed_ratio: a.proposed_ratio,
        affected_post_ids: a.affected_post_ids,
      },
      status: a.status,
      created_at: a.created_at,
    }));

    return NextResponse.json({ adjustments: mapped });
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function inferSeverity(trigger: string): 'low' | 'medium' | 'high' {
  if (trigger === 'underperformance' || trigger === 'objective_mismatch') return 'high';
  if (trigger === 'content_fatigue' || trigger === 'format_underperformance') return 'medium';
  return 'low';
}

function extractTitle(text: string): string {
  // Use first sentence as title
  const dot = text.indexOf('.');
  return dot > 0 ? text.slice(0, dot) : text.slice(0, 60);
}
