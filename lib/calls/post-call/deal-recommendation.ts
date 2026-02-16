import { createServiceClient } from '@/lib/supabase/server';

export async function recommendDealStage(callId: string, orgId: string, userId: string) {
  const supabase = createServiceClient();

  const { data: summary } = await supabase
    .from('call_summaries')
    .select('deal_stage_recommendation')
    .eq('call_id', callId)
    .single();

  if (!summary?.deal_stage_recommendation) return null;

  // Update linked CRM contact lifecycle stage
  const { data: call } = await supabase
    .from('calls')
    .select('crm_contact_id')
    .eq('id', callId)
    .single();

  if (call?.crm_contact_id) {
    // Only suggest, don't auto-update — store in summary for review
    console.log(`[DealRec] Recommending stage "${summary.deal_stage_recommendation}" for contact ${call.crm_contact_id}`);
  }

  return summary.deal_stage_recommendation;
}
