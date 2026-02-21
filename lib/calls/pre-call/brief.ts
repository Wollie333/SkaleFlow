import { createServiceClient } from '@/lib/supabase/server';

export async function generatePreCallBrief(callId: string, orgId: string, hostUserId: string): Promise<string | null> {
  const supabase = createServiceClient();

  const { data: call } = await supabase
    .from('calls')
    .select('title, call_type, call_objective, crm_contact_id, crm_deal_id, call_number, template_id, call_templates(name, phases)')
    .eq('id', callId)
    .single();

  if (!call) return null;

  // Get CRM context
  let contactInfo = '';
  if (call.crm_contact_id) {
    const { data: contact } = await supabase
      .from('crm_contacts')
      .select('first_name, last_name, email, job_title, lifecycle_stage, custom_fields, crm_companies(name, industry, website)')
      .eq('id', call.crm_contact_id)
      .single();

    if (contact) {
      const company = (contact as unknown as { crm_companies: { name: string; industry: string; website: string } | null }).crm_companies;
      contactInfo = `Contact: ${contact.first_name} ${contact.last_name}\nEmail: ${contact.email}\nTitle: ${contact.job_title || 'Unknown'}\nCompany: ${company?.name || 'Unknown'} (${company?.industry || 'N/A'})\nLifecycle: ${contact.lifecycle_stage}`;
    }
  }

  // Get previous call summaries with this contact
  let previousCalls = '';
  if (call.crm_contact_id) {
    const { data: prevCalls } = await supabase
      .from('calls')
      .select('title, call_type, actual_end, call_summaries(summary_text, key_points, next_steps)')
      .eq('crm_contact_id', call.crm_contact_id)
      .neq('id', callId)
      .eq('call_status', 'completed')
      .order('actual_end', { ascending: false })
      .limit(3);

    if (prevCalls && prevCalls.length > 0) {
      previousCalls = prevCalls.map(pc => {
        const summary = pc.call_summaries as { summary_text: string; key_points: string[]; next_steps: Array<{ action: string }> } | null;
        return `Previous: ${pc.title} (${pc.call_type})\n${summary?.summary_text || 'No summary'}\nKey points: ${JSON.stringify(summary?.key_points || [])}\nAction items: ${JSON.stringify(summary?.next_steps || [])}`;
      }).join('\n\n');
    }
  }

  // Get active offers
  const { data: offers } = await supabase
    .from('offers')
    .select('name, price_display, deliverables')
    .eq('organization_id', orgId)
    .eq('is_active', true);

  const offersText = offers?.map(o => `${o.name} (${o.price_display || 'TBD'})`).join(', ') || 'None configured';

  try {
    const { resolveModel, deductCredits } = await import('@/lib/ai/server');
    const { getProviderAdapterForUser } = await import('@/lib/ai/providers/registry');

    const resolved = await resolveModel(orgId, 'video_call_copilot', undefined, hostUserId);
    const { adapter, usingUserKey } = await getProviderAdapterForUser(resolved.provider, hostUserId);

    const response = await adapter.complete({
      systemPrompt: 'You are a pre-call preparation assistant. Generate a concise, actionable brief to help the host prepare for their upcoming call.',
      messages: [{
        role: 'user',
        content: `Prepare a brief for:\nCall: ${call.title} (${call.call_type})\nObjective: ${call.call_objective || 'Not set'}\nCall #${call.call_number} with this prospect\nTemplate: ${(call.call_templates as { name: string } | null)?.name || 'None'}\n\n${contactInfo}\n\nPrevious calls:\n${previousCalls || 'First call with this prospect'}\n\nAvailable offers: ${offersText}\n\nProvide:\n1. Key preparation points (3-5 bullets)\n2. Recommended approach\n3. Potential objections to prepare for\n4. Suggested offer to lead with\n5. Specific questions to ask based on CRM/history`,
      }],
      maxTokens: 1000,
      temperature: 0.3,
      modelId: resolved.modelId,
      jsonMode: true,
    });

    if (!usingUserKey) {
      const { calculateCreditCost } = await import('@/lib/ai/credits');
      const credits = calculateCreditCost(resolved.id, response.inputTokens, response.outputTokens);
      await deductCredits(orgId, hostUserId || null, credits, null, 'Pre-call brief generation');
    }

    return response.text;
  } catch (error) {
    console.error('[PreCall] Brief generation failed:', error);
    return null;
  }
}
