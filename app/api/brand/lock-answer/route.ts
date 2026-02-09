import { NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { getPhaseTemplate } from '@/config/phases';
import { isPhaseAccessible } from '@/lib/phase-access';
import { isOrgOwnerOrAdmin } from '@/lib/permissions';

export async function POST(request: Request) {
  try {
    const { organizationId, phaseId, questionIndex } = await request.json();

    const supabase = createClient();

    // Verify user has access
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: membership } = await supabase
      .from('org_members')
      .select('id, role')
      .eq('organization_id', organizationId)
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Team member: check for pending change requests on this question's variables
    const isAdmin = await isOrgOwnerOrAdmin(organizationId, user.id);
    if (!isAdmin) {
      const phaseTemplatePre = getPhaseTemplate(
        (await supabase.from('brand_phases').select('phase_number').eq('id', phaseId).single()).data?.phase_number || ''
      );
      if (phaseTemplatePre) {
        const outputKeysForQuestion = phaseTemplatePre.questionOutputMap[questionIndex] || [];
        if (outputKeysForQuestion.length > 0) {
          const serviceClient = createServiceClient();
          const { count } = await serviceClient
            .from('change_requests')
            .select('*', { count: 'exact', head: true })
            .eq('organization_id', organizationId)
            .eq('entity_type', 'brand_variable')
            .in('entity_id', outputKeysForQuestion)
            .in('status', ['pending', 'revision_requested']);

          if (count && count > 0) {
            return NextResponse.json({
              error: 'Pending changes must be reviewed before advancing. Please wait for your changes to be approved.',
              pendingChangeRequests: count,
            }, { status: 400 });
          }
        }
      }
    }

    // Get the phase record
    const { data: phase } = await supabase
      .from('brand_phases')
      .select('*')
      .eq('id', phaseId)
      .single();

    if (!phase) {
      return NextResponse.json({ error: 'Phase not found' }, { status: 404 });
    }

    // --- Server-side sequential phase gate ---
    const { data: allPhases } = await supabase
      .from('brand_phases')
      .select('id, status')
      .eq('organization_id', organizationId)
      .order('sort_order');

    if (!allPhases || !isPhaseAccessible(allPhases, phaseId)) {
      return NextResponse.json({ error: 'This phase is not yet accessible. Complete earlier phases first.' }, { status: 403 });
    }

    // Get phase template to find which outputs belong to this question
    const phaseTemplate = getPhaseTemplate(phase.phase_number);
    if (!phaseTemplate) {
      return NextResponse.json({ error: 'Phase template not found' }, { status: 404 });
    }

    const outputKeys = phaseTemplate.questionOutputMap[questionIndex];
    if (!outputKeys || outputKeys.length === 0) {
      return NextResponse.json({ error: 'No outputs mapped to this question' }, { status: 400 });
    }

    // Check all required outputs exist before locking
    // Query by output_key (not phase_id) since outputs may have a stale phase_id from migration
    const { data: existingOutputs } = await supabase
      .from('brand_outputs')
      .select('output_key')
      .eq('organization_id', organizationId)
      .in('output_key', outputKeys);

    const existingKeys = new Set(existingOutputs?.map(o => o.output_key) || []);
    const missingKeys = outputKeys.filter(k => !existingKeys.has(k));

    if (missingKeys.length > 0) {
      return NextResponse.json({
        success: false,
        missingKeys,
      });
    }

    // Lock the specific outputs for this question and adopt them into the correct phase
    const { error: lockError } = await supabase
      .from('brand_outputs')
      .update({
        is_locked: true,
        phase_id: phaseId,
        updated_at: new Date().toISOString(),
      })
      .eq('organization_id', organizationId)
      .in('output_key', outputKeys);

    if (lockError) {
      console.error('Failed to lock outputs:', lockError.message);
      return NextResponse.json({ error: 'Failed to lock outputs' }, { status: 500 });
    }

    const isLastQuestion = questionIndex >= phaseTemplate.questions.length - 1;

    // If this is the last question, check ALL phase variables are set before completing
    if (isLastQuestion) {
      const allPhaseOutputKeys = phaseTemplate.outputVariables;
      const { data: allOutputs } = await supabase
        .from('brand_outputs')
        .select('output_key')
        .eq('organization_id', organizationId)
        .in('output_key', allPhaseOutputKeys);

      const allExistingKeys = new Set(allOutputs?.map(o => o.output_key) || []);
      const allMissing = allPhaseOutputKeys.filter(k => !allExistingKeys.has(k));

      if (allMissing.length > 0) {
        // Find which question indexes have missing variables
        const missingByQuestion: Record<number, string[]> = {};
        for (const key of allMissing) {
          for (const [qIdx, keys] of Object.entries(phaseTemplate.questionOutputMap)) {
            if (keys.includes(key)) {
              const idx = parseInt(qIdx);
              if (!missingByQuestion[idx]) missingByQuestion[idx] = [];
              missingByQuestion[idx].push(key);
            }
          }
        }

        return NextResponse.json({
          success: false,
          phaseIncomplete: true,
          missingKeys: allMissing,
          missingByQuestion,
          message: 'All variables must be defined before completing this phase. Go back to the questions with missing variables.',
        });
      }
    }

    const nextQuestionIndex = isLastQuestion ? questionIndex : questionIndex + 1;

    // Increment question index on the phase
    const phaseUpdate: Record<string, unknown> = {
      current_question_index: nextQuestionIndex,
      updated_at: new Date().toISOString(),
    };

    // If this was the last question, lock the entire phase
    if (isLastQuestion) {
      phaseUpdate.status = 'locked';
      phaseUpdate.locked_at = new Date().toISOString();
      phaseUpdate.locked_by = user.id;
      phaseUpdate.completed_at = new Date().toISOString();

      // Also lock any remaining unlocked outputs for this phase (by output_key, not phase_id)
      const allKeys = phaseTemplate.outputVariables;
      await supabase
        .from('brand_outputs')
        .update({
          is_locked: true,
          phase_id: phaseId,
          updated_at: new Date().toISOString(),
        })
        .eq('organization_id', organizationId)
        .in('output_key', allKeys)
        .eq('is_locked', false);
    }

    const { error: phaseError } = await supabase
      .from('brand_phases')
      .update(phaseUpdate)
      .eq('id', phaseId);

    if (phaseError) {
      console.error('Failed to update phase:', phaseError.message);
      return NextResponse.json({ error: 'Failed to update phase' }, { status: 500 });
    }

    // Clear conversation messages for fresh thread on the next question
    // Locked outputs provide all needed context via buildSystemPrompt()
    if (!isLastQuestion) {
      await supabase
        .from('brand_conversations')
        .update({
          messages: [],
          updated_at: new Date().toISOString(),
        })
        .eq('organization_id', organizationId)
        .eq('phase_id', phaseId);
    }

    // If phase is complete, check if all phases are done
    if (isLastQuestion) {
      const { data: phases } = await supabase
        .from('brand_phases')
        .select('status')
        .eq('organization_id', organizationId);

      const allComplete = phases?.every(p => p.status === 'locked' || p.status === 'completed');

      if (allComplete) {
        await supabase
          .from('organizations')
          .update({
            brand_engine_status: 'completed',
            content_engine_enabled: true,
            updated_at: new Date().toISOString(),
          })
          .eq('id', organizationId);
      } else {
        await supabase
          .from('organizations')
          .update({
            brand_engine_status: 'in_progress',
            updated_at: new Date().toISOString(),
          })
          .eq('id', organizationId);
      }
    }

    // Re-check if all phases are now complete (for the frontend to know)
    let allPhasesComplete = false;
    if (isLastQuestion) {
      const { data: freshPhases } = await supabase
        .from('brand_phases')
        .select('status')
        .eq('organization_id', organizationId);

      allPhasesComplete = freshPhases?.every(p => p.status === 'locked' || p.status === 'completed') ?? false;
    }

    return NextResponse.json({
      success: true,
      nextQuestionIndex,
      phaseComplete: isLastQuestion,
      allPhasesComplete,
    });
  } catch (error) {
    console.error('Lock answer error:', error);
    return NextResponse.json(
      { error: 'Failed to lock answer' },
      { status: 500 }
    );
  }
}
