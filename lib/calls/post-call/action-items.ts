import { createServiceClient } from '@/lib/supabase/server';

export async function extractActionItems(callId: string, summaryId: string, orgId: string, userId: string) {
  const supabase = createServiceClient();

  // Get summary next_steps
  const { data: summary } = await supabase
    .from('call_summaries')
    .select('next_steps')
    .eq('id', summaryId)
    .single();

  const nextSteps = (summary?.next_steps || []) as Array<{ action: string; owner?: string; deadline?: string }>;

  // Get host user ID for assignment
  const { data: call } = await supabase
    .from('calls')
    .select('host_user_id')
    .eq('id', callId)
    .single();

  const items = nextSteps.map(step => ({
    call_id: callId,
    call_summary_id: summaryId,
    assigned_to: step.owner === 'host' ? call?.host_user_id || null : null,
    description: step.action,
    due_date: step.deadline || null,
    status: 'pending' as const,
  }));

  if (items.length > 0) {
    await supabase.from('call_action_items').insert(items);
  }

  return items;
}
