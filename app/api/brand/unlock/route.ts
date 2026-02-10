import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const { organizationId, phaseId } = await request.json();

    const supabase = await createClient();

    // Verify user has access
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

    // Verify the phase exists and is locked
    const { data: phase } = await supabase
      .from('brand_phases')
      .select('id, status')
      .eq('id', phaseId)
      .eq('organization_id', organizationId)
      .single();

    if (!phase) {
      return NextResponse.json({ error: 'Phase not found' }, { status: 404 });
    }

    if (phase.status !== 'locked' && phase.status !== 'completed') {
      return NextResponse.json({ error: 'Phase is not locked' }, { status: 400 });
    }

    // Unlock all outputs for this phase
    await supabase
      .from('brand_outputs')
      .update({
        is_locked: false,
        updated_at: new Date().toISOString(),
      })
      .eq('organization_id', organizationId)
      .eq('phase_id', phaseId);

    // Set phase back to in_progress and reset question index
    await supabase
      .from('brand_phases')
      .update({
        status: 'in_progress',
        current_question_index: 0,
        locked_at: null,
        locked_by: null,
        completed_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', phaseId);

    // Update org brand_engine_status back to in_progress
    await supabase
      .from('organizations')
      .update({
        brand_engine_status: 'in_progress',
        updated_at: new Date().toISOString(),
      })
      .eq('id', organizationId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Unlock phase error:', error);
    return NextResponse.json(
      { error: 'Failed to unlock phase' },
      { status: 500 }
    );
  }
}
