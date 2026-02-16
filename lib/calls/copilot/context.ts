/**
 * Assembles call context for the AI co-pilot.
 * Gathers brand data, offers, CRM info, transcript, and previous guidance.
 */

import { createServiceClient } from '@/lib/supabase/server';

export interface AssembledContext {
  brandData: string;
  offersData: string;
  crmData: string;
  callState: string;
  recentTranscript: string;
  previousGuidance: string;
}

/**
 * Assemble full context for AI co-pilot processing.
 */
export async function assembleCallContext(
  callId: string,
  orgId: string
): Promise<AssembledContext> {
  const supabase = createServiceClient();

  // 1. Brand Engine data (locked variables only)
  const { data: brandOutputs } = await supabase
    .from('brand_outputs')
    .select('variable_key, value')
    .eq('organization_id', orgId)
    .eq('is_locked', true)
    .not('value', 'is', null);

  const brandData = brandOutputs
    ? brandOutputs.map(o => `${o.variable_key}: ${typeof o.value === 'string' ? o.value : JSON.stringify(o.value)}`).join('\n')
    : 'No brand data available';

  // 2. Active offers
  const { data: offers } = await supabase
    .from('offers')
    .select('name, description, price_display, deliverables, value_propositions, common_objections')
    .eq('organization_id', orgId)
    .eq('is_active', true);

  const offersData = offers && offers.length > 0
    ? offers.map(o => {
        const deliverables = Array.isArray(o.deliverables) ? (o.deliverables as string[]).join(', ') : '';
        return `OFFER: ${o.name} (${o.price_display || 'Contact for pricing'})\nDeliverables: ${deliverables}\nValue Props: ${JSON.stringify(o.value_propositions)}\nObjection Responses: ${JSON.stringify(o.common_objections)}`;
      }).join('\n\n')
    : 'No offers configured';

  // 3. CRM contact data (if linked)
  const { data: call } = await supabase
    .from('calls')
    .select('crm_contact_id, crm_deal_id, call_objective, template_id, call_number, call_templates(phases)')
    .eq('id', callId)
    .single();

  let crmData = 'No CRM data linked';
  if (call?.crm_contact_id) {
    const { data: contact } = await supabase
      .from('crm_contacts')
      .select('first_name, last_name, email, job_title, lifecycle_stage, custom_fields, crm_companies(name, industry)')
      .eq('id', call.crm_contact_id)
      .single();

    if (contact) {
      const company = contact.crm_companies as { name: string; industry: string } | null;
      crmData = `Contact: ${contact.first_name} ${contact.last_name} (${contact.email})\nJob: ${contact.job_title || 'Unknown'}\nCompany: ${company?.name || 'Unknown'} (${company?.industry || 'Unknown industry'})\nStage: ${contact.lifecycle_stage}`;
    }
  }

  // 4. Call state
  const templatePhases = call?.call_templates ? JSON.stringify((call.call_templates as { phases: unknown }).phases) : '[]';
  const callState = `Objective: ${call?.call_objective || 'Not set'}\nCall #${call?.call_number || 1}\nTemplate phases: ${templatePhases}`;

  // 5. Recent transcript (last ~10 minutes worth)
  const { data: transcripts } = await supabase
    .from('call_transcripts')
    .select('speaker_label, content, timestamp_start')
    .eq('call_id', callId)
    .order('timestamp_start', { ascending: false })
    .limit(50); // ~10 min at moderate speaking pace

  const recentTranscript = transcripts
    ? transcripts.reverse().map(t => `[${t.speaker_label}]: ${t.content}`).join('\n')
    : 'No transcript yet';

  // 6. Previous guidance (avoid repetition)
  const { data: prevGuidance } = await supabase
    .from('call_ai_guidance')
    .select('guidance_type, content')
    .eq('call_id', callId)
    .order('created_at', { ascending: false })
    .limit(20);

  const previousGuidance = prevGuidance
    ? prevGuidance.map(g => `[${g.guidance_type}]: ${g.content}`).join('\n')
    : '';

  return {
    brandData,
    offersData,
    crmData,
    callState,
    recentTranscript,
    previousGuidance,
  };
}
