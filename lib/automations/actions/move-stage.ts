import { createServiceClient } from '@/lib/supabase/server';
import { StepConfig, PipelineEvent, MAX_TRIGGER_CHAIN_DEPTH } from '../types';
import type { Json } from '@/types/database';

export async function executeMoveStage(
  contactId: string,
  config: StepConfig,
  triggerChainDepth: number = 0
): Promise<{ success: boolean; error?: string; newEvent?: PipelineEvent }> {
  const supabase = createServiceClient();

  if (!config.stage_id) {
    return { success: false, error: 'No stage_id configured' };
  }

  const { data: contact } = await supabase
    .from('pipeline_contacts')
    .select('stage_id, pipeline_id, organization_id')
    .eq('id', contactId)
    .single();

  if (!contact) {
    return { success: false, error: 'Contact not found' };
  }

  if (contact.stage_id === config.stage_id) {
    return { success: true }; // Already in target stage
  }

  const fromStageId = contact.stage_id;

  const { error } = await supabase
    .from('pipeline_contacts')
    .update({ stage_id: config.stage_id, updated_at: new Date().toISOString() })
    .eq('id', contactId);

  if (error) {
    return { success: false, error: error.message };
  }

  // Log activity
  await supabase.from('pipeline_activity').insert({
    contact_id: contactId,
    organization_id: contact.organization_id,
    event_type: 'stage_changed',
    from_stage_id: fromStageId,
    to_stage_id: config.stage_id,
    metadata: { automated: true } as unknown as Json,
  });

  // Emit new event if within chain depth limit
  if (triggerChainDepth < MAX_TRIGGER_CHAIN_DEPTH) {
    return {
      success: true,
      newEvent: {
        type: 'stage_changed',
        contactId,
        organizationId: contact.organization_id,
        pipelineId: contact.pipeline_id,
        data: { fromStageId, toStageId: config.stage_id },
        triggerChainDepth: triggerChainDepth + 1,
      },
    };
  }

  return { success: true };
}
