import { Json } from '@/types/database';

export interface PipelineEvent {
  type: 'stage_changed' | 'contact_created' | 'tag_added' | 'tag_removed';
  contactId: string;
  organizationId: string;
  pipelineId: string;
  performedBy?: string;
  data: {
    fromStageId?: string;
    toStageId?: string;
    tagId?: string;
    [key: string]: unknown;
  };
  triggerChainDepth?: number;
}

export interface StepConfig {
  template_id?: string;
  from_name?: string;
  stage_id?: string;
  tag_id?: string;
  endpoint_id?: string;
  url?: string;
  method?: string;
  headers?: Record<string, string>;
  duration_minutes?: number;
  field?: string;
  operator?: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'is_empty' | 'is_not_empty' | 'greater_than' | 'less_than';
  value?: string;
}

export interface TriggerConfig {
  from_stage_id?: string;
  to_stage_id?: string;
  pipeline_id?: string;
  tag_id?: string;
}

export interface WorkflowStep {
  id: string;
  workflow_id: string;
  step_order: number;
  step_type: string;
  config: StepConfig;
  next_step_id: string | null;
  condition_true_step_id: string | null;
  condition_false_step_id: string | null;
}

export const MAX_TRIGGER_CHAIN_DEPTH = 3;
