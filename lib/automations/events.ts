import { createServiceClient } from '@/lib/supabase/server';
import { PipelineEvent, TriggerConfig, MAX_TRIGGER_CHAIN_DEPTH } from './types';
import { executeWorkflowForContact } from './executor';

function matchesTrigger(event: PipelineEvent, triggerType: string, triggerConfig: TriggerConfig): boolean {
  if (event.type !== triggerType) return false;

  switch (triggerType) {
    case 'stage_changed': {
      if (triggerConfig.to_stage_id && triggerConfig.to_stage_id !== event.data.toStageId) return false;
      if (triggerConfig.from_stage_id && triggerConfig.from_stage_id !== event.data.fromStageId) return false;
      return true;
    }
    case 'contact_created': {
      if (triggerConfig.pipeline_id && triggerConfig.pipeline_id !== event.pipelineId) return false;
      return true;
    }
    case 'tag_added':
    case 'tag_removed': {
      if (triggerConfig.tag_id && triggerConfig.tag_id !== event.data.tagId) return false;
      return true;
    }
    default:
      return false;
  }
}

export async function emitPipelineEvent(event: PipelineEvent): Promise<void> {
  const depth = event.triggerChainDepth || 0;
  if (depth >= MAX_TRIGGER_CHAIN_DEPTH) {
    console.warn(`Trigger chain depth ${depth} reached max (${MAX_TRIGGER_CHAIN_DEPTH}), skipping`);
    return;
  }

  const supabase = createServiceClient();

  // Find active workflows for this pipeline that match the trigger
  const { data: workflows } = await supabase
    .from('automation_workflows')
    .select('id, trigger_type, trigger_config')
    .eq('pipeline_id', event.pipelineId)
    .eq('is_active', true);

  if (!workflows || workflows.length === 0) return;

  for (const workflow of workflows) {
    const triggerConfig = (workflow.trigger_config || {}) as unknown as TriggerConfig;
    if (matchesTrigger(event, workflow.trigger_type, triggerConfig)) {
      try {
        await executeWorkflowForContact(workflow.id, event.contactId, depth);
      } catch (err) {
        console.error(`Error executing workflow ${workflow.id}:`, err);
      }
    }
  }
}
