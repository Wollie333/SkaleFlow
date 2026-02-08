import { createServiceClient } from '@/lib/supabase/server';
import { StepConfig, PipelineEvent, MAX_TRIGGER_CHAIN_DEPTH } from '../types';
import type { Json } from '@/types/database';

export async function executeAddTag(
  contactId: string,
  config: StepConfig,
  triggerChainDepth: number = 0
): Promise<{ success: boolean; error?: string; newEvent?: PipelineEvent }> {
  const supabase = createServiceClient();

  if (!config.tag_id) {
    return { success: false, error: 'No tag_id configured' };
  }

  const { data: contact } = await supabase
    .from('pipeline_contacts')
    .select('organization_id, pipeline_id')
    .eq('id', contactId)
    .single();

  if (!contact) {
    return { success: false, error: 'Contact not found' };
  }

  // Upsert — ignore if already tagged
  const { error } = await supabase
    .from('pipeline_contact_tags')
    .upsert(
      { contact_id: contactId, tag_id: config.tag_id },
      { onConflict: 'contact_id,tag_id' }
    );

  if (error) {
    return { success: false, error: error.message };
  }

  await supabase.from('pipeline_activity').insert({
    contact_id: contactId,
    organization_id: contact.organization_id,
    event_type: 'tag_added',
    metadata: { tag_id: config.tag_id } as unknown as Json,
  });

  if (triggerChainDepth < MAX_TRIGGER_CHAIN_DEPTH) {
    return {
      success: true,
      newEvent: {
        type: 'tag_added',
        contactId,
        organizationId: contact.organization_id,
        pipelineId: contact.pipeline_id,
        data: { tagId: config.tag_id },
        triggerChainDepth: triggerChainDepth + 1,
      },
    };
  }

  return { success: true };
}
