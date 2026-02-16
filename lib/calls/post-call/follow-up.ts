import { createServiceClient } from '@/lib/supabase/server';

export async function draftFollowUpEmail(callId: string, orgId: string, userId: string) {
  const supabase = createServiceClient();

  const { data: summary } = await supabase
    .from('call_summaries')
    .select('summary_text, key_points, next_steps')
    .eq('call_id', callId)
    .single();

  const { data: call } = await supabase
    .from('calls')
    .select('title, crm_contact_id')
    .eq('id', callId)
    .single();

  let guestName = 'there';
  if (call?.crm_contact_id) {
    const { data: contact } = await supabase
      .from('crm_contacts')
      .select('first_name')
      .eq('id', call.crm_contact_id)
      .single();
    if (contact) guestName = contact.first_name;
  }

  // Get brand voice
  const { data: brandOutputs } = await supabase
    .from('brand_outputs')
    .select('variable_key, value')
    .eq('organization_id', orgId)
    .eq('is_locked', true)
    .in('variable_key', ['brand_voice', 'brand_tone', 'brand_name']);

  const brandVoice = brandOutputs?.find(o => o.variable_key === 'brand_voice')?.value || '';
  const brandName = brandOutputs?.find(o => o.variable_key === 'brand_name')?.value || 'Our team';

  try {
    const { resolveModel } = await import('@/lib/ai/middleware');
    const { getProviderAdapterForUser } = await import('@/lib/ai/providers/registry');
    const { getModelConfig } = await import('@/lib/ai/providers/catalog');
    const { deductCredits } = await import('@/lib/ai/credits');

    const resolved = await resolveModel(orgId, 'video_call_copilot', undefined, userId);
    const config = getModelConfig(resolved.modelId);
    if (!config) throw new Error('No model config');
    const { adapter, usingUserKey } = await getProviderAdapterForUser(config.provider, userId);

    const response = await adapter.complete({
      systemPrompt: `Draft a professional follow-up email after a business call. Use the brand voice: ${brandVoice}. Be warm but concise. Sign off as ${brandName}.`,
      messages: [{
        role: 'user',
        content: `Guest: ${guestName}\nCall: ${call?.title}\nSummary: ${summary?.summary_text || 'N/A'}\nKey Points: ${JSON.stringify(summary?.key_points || [])}\nNext Steps: ${JSON.stringify(summary?.next_steps || [])}\n\nDraft the follow-up email (plain text, no HTML).`,
      }],
      maxTokens: 800,
      temperature: 0.4,
      modelId: config.modelId,
    });

    if (!usingUserKey) {
      await deductCredits(orgId, 'video_call_copilot', response.inputTokens, response.outputTokens, config.provider, resolved.modelId, userId);
    }

    await supabase
      .from('call_summaries')
      .update({ follow_up_email_draft: response.text, updated_at: new Date().toISOString() })
      .eq('call_id', callId);

    return response.text;
  } catch (error) {
    console.error('[FollowUp] Failed:', error);
    return null;
  }
}
