import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

export async function PATCH(request: Request) {
  try {
    const { organizationId, outputKey, outputValue, action } = await request.json();

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify membership
    const { data: membership } = await supabase
      .from('org_members')
      .select('role')
      .eq('organization_id', organizationId)
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get existing output
    const { data: existing } = await supabase
      .from('presence_outputs')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('output_key', outputKey)
      .single();

    if (action === 'update') {
      if (existing?.is_locked) {
        return NextResponse.json({ error: 'Cannot update a locked variable' }, { status: 400 });
      }

      if (existing) {
        const { error } = await supabase
          .from('presence_outputs')
          .update({
            output_value: outputValue,
            version: (existing.version || 1) + 1,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id);

        if (error) throw error;
      }
    } else if (action === 'lock') {
      if (existing) {
        const updateData: Record<string, unknown> = {
          is_locked: true,
          updated_at: new Date().toISOString(),
        };
        if (outputValue !== undefined) {
          updateData.output_value = outputValue;
        }

        const { error } = await supabase
          .from('presence_outputs')
          .update(updateData)
          .eq('id', existing.id);

        if (error) throw error;
      }
    } else if (action === 'unlock') {
      if (existing) {
        const { error } = await supabase
          .from('presence_outputs')
          .update({
            is_locked: false,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id);

        if (error) throw error;
      }
    }

    // Return updated output
    const { data: updated } = await supabase
      .from('presence_outputs')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('output_key', outputKey)
      .single();

    return NextResponse.json({ output: updated });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('Presence variable error', { error: errorMessage });
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}