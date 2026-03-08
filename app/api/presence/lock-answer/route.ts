import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getPresencePhaseByNumber, getOutputVariablesForQuestion } from '@/config/presence-phases';
import { logger } from '@/lib/logger';

export async function POST(request: Request) {
  try {
    const { organizationId, phaseId, questionIndex, force } = await request.json();

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get phase
    const { data: phase } = await supabase
      .from('presence_phases')
      .select('*')
      .eq('id', phaseId)
      .single();

    if (!phase) {
      return NextResponse.json({ error: 'Phase not found' }, { status: 404 });
    }

    const phaseTemplate = getPresencePhaseByNumber(phase.phase_number);
    if (!phaseTemplate) {
      return NextResponse.json({ error: 'Phase template not found' }, { status: 404 });
    }

    // Get output variables for this question
    const outputKeys = getOutputVariablesForQuestion(phase.phase_number, questionIndex);

    // Lock the outputs for this question
    if (outputKeys.length > 0 && !force) {
      // Check all outputs exist
      const { data: outputs } = await supabase
        .from('presence_outputs')
        .select('output_key, output_value')
        .eq('organization_id', organizationId)
        .eq('phase_id', phaseId)
        .in('output_key', outputKeys);

      const filledKeys = (outputs || []).filter(
        o => o.output_value !== null && o.output_value !== '' && o.output_value !== undefined
      ).map(o => o.output_key);

      const missingKeys = outputKeys.filter(k => !filledKeys.includes(k));

      if (missingKeys.length > 0 && !force) {
        return NextResponse.json({
          error: 'Some outputs are missing',
          missingKeys,
          canForce: true,
        }, { status: 400 });
      }
    }

    // Lock all outputs for this question
    if (outputKeys.length > 0) {
      await supabase
        .from('presence_outputs')
        .update({ is_locked: true, updated_at: new Date().toISOString() })
        .eq('organization_id', organizationId)
        .eq('phase_id', phaseId)
        .in('output_key', outputKeys);
    }

    // Check if this is the last question in the phase
    const totalQuestions = phaseTemplate.questions.length;
    const isLastQuestion = questionIndex >= totalQuestions - 1;

    if (isLastQuestion) {
      // Mark phase as completed
      await supabase
        .from('presence_phases')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', phaseId);

      logger.info('Presence phase completed', { phaseId, phaseNumber: phase.phase_number });

      // Check if this is the last phase — update org status
      const { data: allPhases } = await supabase
        .from('presence_phases')
        .select('status')
        .eq('organization_id', organizationId)
        .neq('status', 'skipped');

      const allComplete = (allPhases || []).every(p => p.status === 'completed' || p.status === 'locked');
      if (allComplete) {
        await supabase
          .from('organizations')
          .update({ presence_engine_status: 'completed' })
          .eq('id', organizationId);

        logger.info('Presence Engine completed', { organizationId });
      }
    }

    // Add separator to conversation
    const { data: conversation } = await supabase
      .from('presence_conversations')
      .select('messages')
      .eq('organization_id', organizationId)
      .eq('phase_id', phaseId)
      .single();

    if (conversation) {
      const messages = conversation.messages as Array<{ role: string; content: string }>;
      messages.push({
        role: 'system',
        content: `--- Question ${questionIndex + 1} completed. Moving to question ${questionIndex + 2}. ---`,
      });

      await supabase
        .from('presence_conversations')
        .update({ messages, updated_at: new Date().toISOString() })
        .eq('organization_id', organizationId)
        .eq('phase_id', phaseId);
    }

    return NextResponse.json({
      success: true,
      phaseCompleted: isLastQuestion,
      nextQuestionIndex: isLastQuestion ? null : questionIndex + 1,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('Presence lock-answer error', { error: errorMessage });
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}