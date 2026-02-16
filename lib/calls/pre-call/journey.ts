import { createServiceClient } from '@/lib/supabase/server';

export interface CallJourneyEntry {
  callId: string;
  title: string;
  callType: string;
  date: string | null;
  summaryText: string | null;
  keyPoints: string[];
  nextSteps: Array<{ action: string; owner: string }>;
  actionItems: Array<{ description: string; status: string }>;
}

export async function loadCallJourney(contactId: string, orgId: string): Promise<CallJourneyEntry[]> {
  const supabase = createServiceClient();

  const { data: calls } = await supabase
    .from('calls')
    .select('id, title, call_type, actual_end, call_summaries(summary_text, key_points, next_steps), call_action_items(description, status)')
    .eq('crm_contact_id', contactId)
    .eq('organization_id', orgId)
    .eq('call_status', 'completed')
    .order('actual_end', { ascending: true });

  if (!calls) return [];

  return calls.map(call => {
    const summary = call.call_summaries as { summary_text: string; key_points: string[]; next_steps: Array<{ action: string; owner: string }> } | null;
    const actions = (call.call_action_items || []) as Array<{ description: string; status: string }>;

    return {
      callId: call.id,
      title: call.title,
      callType: call.call_type,
      date: call.actual_end,
      summaryText: summary?.summary_text || null,
      keyPoints: summary?.key_points || [],
      nextSteps: summary?.next_steps || [],
      actionItems: actions,
    };
  });
}
