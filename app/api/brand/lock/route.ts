import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const { organizationId, phaseId } = await request.json();

    const supabase = await createClient();

    // Verify user has access to this organization
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

    // Lock all outputs for this phase
    await supabase
      .from('brand_outputs')
      .update({
        is_locked: true,
        updated_at: new Date().toISOString(),
      })
      .eq('organization_id', organizationId)
      .eq('phase_id', phaseId);

    // Update phase status to locked
    await supabase
      .from('brand_phases')
      .update({
        status: 'locked',
        locked_at: new Date().toISOString(),
        locked_by: user.id,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', phaseId);

    // Check if all phases are complete
    const { data: phases } = await supabase
      .from('brand_phases')
      .select('status')
      .eq('organization_id', organizationId);

    const allComplete = phases?.every(p => p.status === 'locked' || p.status === 'completed');

    if (allComplete) {
      // Enable content engine
      await supabase
        .from('organizations')
        .update({
          brand_engine_status: 'completed',
          content_engine_enabled: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', organizationId);
    } else {
      // Update brand engine status to in_progress
      await supabase
        .from('organizations')
        .update({
          brand_engine_status: 'in_progress',
          updated_at: new Date().toISOString(),
        })
        .eq('id', organizationId);
    }

    return NextResponse.json({ success: true, allComplete });
  } catch (error) {
    console.error('Lock phase error:', error);
    return NextResponse.json(
      { error: 'Failed to lock phase' },
      { status: 500 }
    );
  }
}
