import { createServiceClient } from '@/lib/supabase/server';
import { PipelineEvent, WorkflowStep, StepConfig, MAX_TRIGGER_CHAIN_DEPTH } from './types';
import { evaluateCondition } from './conditions';
import { executeSendEmail } from './actions/send-email';
import { executeMoveStage } from './actions/move-stage';
import { executeAddTag } from './actions/add-tag';
import { executeRemoveTag } from './actions/remove-tag';
import { executeWebhook } from './actions/webhook';
import type { Json } from '@/types/database';

export async function executeWorkflowForContact(
  workflowId: string,
  contactId: string,
  triggerChainDepth: number = 0
): Promise<void> {
  const supabase = createServiceClient();

  // Create automation run
  const { data: run, error: runError } = await supabase
    .from('automation_runs')
    .insert({
      workflow_id: workflowId,
      contact_id: contactId,
      status: 'running',
      metadata: { trigger_chain_depth: triggerChainDepth } as unknown as Json,
    })
    .select()
    .single();

  if (runError || !run) {
    console.error('Failed to create automation run:', runError);
    return;
  }

  // Load all steps for this workflow ordered by step_order
  const { data: steps } = await supabase
    .from('automation_steps')
    .select('*')
    .eq('workflow_id', workflowId)
    .order('step_order', { ascending: true });

  if (!steps || steps.length === 0) {
    await supabase
      .from('automation_runs')
      .update({ status: 'completed', completed_at: new Date().toISOString() })
      .eq('id', run.id);
    return;
  }

  // Find the first step (step_order = 0 or the minimum)
  let currentStep: typeof steps[0] | undefined = steps[0];

  const pendingEvents: PipelineEvent[] = [];

  while (currentStep) {
    // Update run with current step
    await supabase
      .from('automation_runs')
      .update({ current_step_id: currentStep.id })
      .eq('id', run.id);

    // Create step log
    const { data: stepLog } = await supabase
      .from('automation_step_logs')
      .insert({
        run_id: run.id,
        step_id: currentStep.id,
        status: 'running',
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    const config = (currentStep.config || {}) as unknown as StepConfig;
    let result: { success: boolean; error?: string; newEvent?: PipelineEvent } = { success: false };
    let nextStepId: string | null = currentStep.next_step_id;

    try {
      switch (currentStep.step_type) {
        case 'send_email':
          result = await executeSendEmail(contactId, config);
          break;

        case 'move_stage':
          result = await executeMoveStage(contactId, config, triggerChainDepth);
          break;

        case 'add_tag':
          result = await executeAddTag(contactId, config, triggerChainDepth);
          break;

        case 'remove_tag':
          result = await executeRemoveTag(contactId, config, triggerChainDepth);
          break;

        case 'webhook':
          result = await executeWebhook(contactId, config);
          break;

        case 'delay': {
          const durationMinutes = config.duration_minutes || 60;
          const nextRetryAt = new Date(Date.now() + durationMinutes * 60 * 1000).toISOString();

          if (stepLog) {
            await supabase
              .from('automation_step_logs')
              .update({
                status: 'waiting',
                result: { duration_minutes: durationMinutes } as unknown as Json,
                next_retry_at: nextRetryAt,
              })
              .eq('id', stepLog.id);
          }

          // Update run to waiting
          await supabase
            .from('automation_runs')
            .update({ status: 'waiting' })
            .eq('id', run.id);

          return; // Stop execution, cron will pick up later
        }

        case 'condition': {
          const { data: contact } = await supabase
            .from('pipeline_contacts')
            .select('full_name, email, phone, company, value_cents, custom_fields')
            .eq('id', contactId)
            .single();

          if (contact) {
            const contactData = {
              ...contact,
              custom_fields: (contact.custom_fields || {}) as Record<string, unknown>,
            };
            const passes = evaluateCondition(config, contactData);
            nextStepId = passes
              ? currentStep.condition_true_step_id
              : currentStep.condition_false_step_id;
            result = { success: true };
          } else {
            result = { success: false, error: 'Contact not found for condition evaluation' };
          }
          break;
        }

        default:
          result = { success: false, error: `Unknown step type: ${currentStep.step_type}` };
      }
    } catch (err) {
      result = { success: false, error: err instanceof Error ? err.message : 'Step execution error' };
    }

    // Update step log
    if (stepLog) {
      await supabase
        .from('automation_step_logs')
        .update({
          status: result.success ? 'completed' : 'failed',
          completed_at: new Date().toISOString(),
          result: (result || {}) as unknown as Json,
        })
        .eq('id', stepLog.id);
    }

    if (!result.success) {
      // Mark run as failed
      await supabase
        .from('automation_runs')
        .update({
          status: 'failed',
          error_message: result.error || 'Unknown error',
          completed_at: new Date().toISOString(),
        })
        .eq('id', run.id);
      return;
    }

    // Collect any new events to emit after workflow completes
    if (result.newEvent) {
      pendingEvents.push(result.newEvent);
    }

    // Move to next step
    if (nextStepId) {
      currentStep = steps.find(s => s.id === nextStepId);
    } else {
      currentStep = undefined;
    }
  }

  // Workflow completed successfully
  await supabase
    .from('automation_runs')
    .update({ status: 'completed', completed_at: new Date().toISOString() })
    .eq('id', run.id);

  // Emit pending events (for cascading triggers)
  // We import emitPipelineEvent dynamically to avoid circular imports
  if (pendingEvents.length > 0) {
    const { emitPipelineEvent } = await import('./events');
    for (const event of pendingEvents) {
      await emitPipelineEvent(event);
    }
  }
}

export async function resumeFromDelay(runId: string, stepId: string): Promise<void> {
  const supabase = createServiceClient();

  // Get the run and step info
  const { data: run } = await supabase
    .from('automation_runs')
    .select('workflow_id, contact_id, metadata')
    .eq('id', runId)
    .single();

  if (!run) return;

  const { data: step } = await supabase
    .from('automation_steps')
    .select('next_step_id')
    .eq('id', stepId)
    .single();

  if (!step) return;

  // Mark delay step as completed
  await supabase
    .from('automation_step_logs')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
    })
    .eq('run_id', runId)
    .eq('step_id', stepId)
    .eq('status', 'waiting');

  if (!step.next_step_id) {
    // No more steps, mark run as complete
    await supabase
      .from('automation_runs')
      .update({ status: 'completed', completed_at: new Date().toISOString() })
      .eq('id', runId);
    return;
  }

  // Update run status back to running
  await supabase
    .from('automation_runs')
    .update({ status: 'running' })
    .eq('id', runId);

  // Load all steps for resumption
  const { data: allSteps } = await supabase
    .from('automation_steps')
    .select('*')
    .eq('workflow_id', run.workflow_id)
    .order('step_order', { ascending: true });

  if (!allSteps) return;

  const metadata = (run.metadata || {}) as Record<string, unknown>;
  const triggerChainDepth = (metadata.trigger_chain_depth as number) || 0;

  // Continue execution from the next step
  let currentStep = allSteps.find(s => s.id === step.next_step_id);

  // (Duplicated inline execution loop from executeWorkflowForContact to avoid complex refactor)
  const pendingEvents: import('./types').PipelineEvent[] = [];

  while (currentStep) {
    await supabase
      .from('automation_runs')
      .update({ current_step_id: currentStep.id })
      .eq('id', runId);

    const { data: stepLog } = await supabase
      .from('automation_step_logs')
      .insert({
        run_id: runId,
        step_id: currentStep.id,
        status: 'running',
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    const config = (currentStep.config || {}) as unknown as import('./types').StepConfig;
    let result: { success: boolean; error?: string; newEvent?: import('./types').PipelineEvent } = { success: false };
    let nextStepId: string | null = currentStep.next_step_id;

    try {
      switch (currentStep.step_type) {
        case 'send_email': {
          const { executeSendEmail: execEmail } = await import('./actions/send-email');
          result = await execEmail(run.contact_id, config);
          break;
        }
        case 'move_stage': {
          const { executeMoveStage: execMove } = await import('./actions/move-stage');
          result = await execMove(run.contact_id, config, triggerChainDepth);
          break;
        }
        case 'add_tag': {
          const { executeAddTag: execAdd } = await import('./actions/add-tag');
          result = await execAdd(run.contact_id, config, triggerChainDepth);
          break;
        }
        case 'remove_tag': {
          const { executeRemoveTag: execRemove } = await import('./actions/remove-tag');
          result = await execRemove(run.contact_id, config, triggerChainDepth);
          break;
        }
        case 'webhook': {
          const { executeWebhook: execWebhook } = await import('./actions/webhook');
          result = await execWebhook(run.contact_id, config);
          break;
        }
        case 'delay': {
          const durationMinutes = config.duration_minutes || 60;
          const nextRetryAt = new Date(Date.now() + durationMinutes * 60 * 1000).toISOString();
          if (stepLog) {
            await supabase.from('automation_step_logs').update({
              status: 'waiting',
              result: { duration_minutes: durationMinutes } as unknown as import('@/types/database').Json,
              next_retry_at: nextRetryAt,
            }).eq('id', stepLog.id);
          }
          await supabase.from('automation_runs').update({ status: 'waiting' }).eq('id', runId);
          return;
        }
        case 'condition': {
          const { evaluateCondition: evalCond } = await import('./conditions');
          const { data: contact } = await supabase.from('pipeline_contacts')
            .select('full_name, email, phone, company, value_cents, custom_fields')
            .eq('id', run.contact_id).single();
          if (contact) {
            const contactData = { ...contact, custom_fields: (contact.custom_fields || {}) as Record<string, unknown> };
            const passes = evalCond(config, contactData);
            nextStepId = passes ? currentStep.condition_true_step_id : currentStep.condition_false_step_id;
            result = { success: true };
          } else {
            result = { success: false, error: 'Contact not found' };
          }
          break;
        }
        default:
          result = { success: false, error: `Unknown step type: ${currentStep.step_type}` };
      }
    } catch (err) {
      result = { success: false, error: err instanceof Error ? err.message : 'Step error' };
    }

    if (stepLog) {
      await supabase.from('automation_step_logs').update({
        status: result.success ? 'completed' : 'failed',
        completed_at: new Date().toISOString(),
        result: (result || {}) as unknown as import('@/types/database').Json,
      }).eq('id', stepLog.id);
    }

    if (!result.success) {
      await supabase.from('automation_runs').update({
        status: 'failed',
        error_message: result.error || 'Unknown error',
        completed_at: new Date().toISOString(),
      }).eq('id', runId);
      return;
    }

    if (result.newEvent) pendingEvents.push(result.newEvent);

    currentStep = nextStepId ? allSteps.find(s => s.id === nextStepId) : undefined;
  }

  await supabase.from('automation_runs').update({
    status: 'completed',
    completed_at: new Date().toISOString(),
  }).eq('id', runId);

  if (pendingEvents.length > 0) {
    const { emitPipelineEvent } = await import('./events');
    for (const event of pendingEvents) {
      await emitPipelineEvent(event);
    }
  }
}
