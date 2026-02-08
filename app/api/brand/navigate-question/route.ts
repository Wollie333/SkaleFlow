import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getPhaseTemplate } from '@/config/phases';

export async function POST(request: Request) {
  try {
    const { organizationId, phaseId, targetQuestionIndex } = await request.json();

    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: membership } = await supabase
      .from('org_members')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { data: phase } = await supabase
      .from('brand_phases')
      .select('*')
      .eq('id', phaseId)
      .single();

    if (!phase) {
      return NextResponse.json({ error: 'Phase not found' }, { status: 404 });
    }

    const phaseTemplate = getPhaseTemplate(phase.phase_number);
    if (!phaseTemplate) {
      return NextResponse.json({ error: 'Phase template not found' }, { status: 404 });
    }

    // Validate target index is within bounds
    if (targetQuestionIndex < 0 || targetQuestionIndex >= phaseTemplate.questions.length) {
      return NextResponse.json({ error: 'Invalid question index' }, { status: 400 });
    }

    // Update question index on the phase
    const { error: updateError } = await supabase
      .from('brand_phases')
      .update({
        current_question_index: targetQuestionIndex,
        updated_at: new Date().toISOString(),
      })
      .eq('id', phaseId);

    if (updateError) {
      console.error('Failed to navigate question:', updateError.message);
      return NextResponse.json({ error: 'Failed to navigate' }, { status: 500 });
    }

    // Clear conversation messages for fresh thread
    await supabase
      .from('brand_conversations')
      .update({
        messages: [],
        updated_at: new Date().toISOString(),
      })
      .eq('organization_id', organizationId)
      .eq('phase_id', phaseId);

    return NextResponse.json({
      success: true,
      questionIndex: targetQuestionIndex,
    });
  } catch (error) {
    console.error('Navigate question error:', error);
    return NextResponse.json(
      { error: 'Failed to navigate question' },
      { status: 500 }
    );
  }
}
