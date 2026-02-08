import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function PATCH(request: Request) {
  try {
    const { organizationId, phaseId, outputKey, action, value } = await request.json();

    if (!organizationId || !outputKey || !action) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!['update', 'lock', 'unlock'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const supabase = createClient();

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

    if (action === 'update') {
      if (value === undefined || value === null) {
        return NextResponse.json({ error: 'Value is required for update' }, { status: 400 });
      }
      if (!phaseId) {
        return NextResponse.json({ error: 'phaseId is required for update' }, { status: 400 });
      }

      // Check if variable is locked
      const { data: existing } = await supabase
        .from('brand_outputs')
        .select('id, is_locked')
        .eq('organization_id', organizationId)
        .eq('output_key', outputKey)
        .single();

      if (existing?.is_locked) {
        return NextResponse.json({ error: 'Variable is locked. Unlock it first.' }, { status: 409 });
      }

      // Upsert the value
      const { data: updated, error: upsertError } = await supabase
        .from('brand_outputs')
        .upsert({
          organization_id: organizationId,
          phase_id: phaseId,
          output_key: outputKey,
          output_value: value,
          is_locked: false,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'organization_id,output_key' })
        .select('id, output_key, output_value, is_locked')
        .single();

      if (upsertError) {
        console.error('Failed to update variable:', upsertError.message);
        return NextResponse.json({ error: 'Failed to update variable' }, { status: 500 });
      }

      return NextResponse.json({ success: true, output: updated });
    }

    if (action === 'lock') {
      // Check the variable exists
      const { data: existing } = await supabase
        .from('brand_outputs')
        .select('id, is_locked')
        .eq('organization_id', organizationId)
        .eq('output_key', outputKey)
        .single();

      if (!existing) {
        return NextResponse.json({ error: 'Nothing to lock — variable has no value yet' }, { status: 404 });
      }

      if (existing.is_locked) {
        return NextResponse.json({ success: true, message: 'Already locked' });
      }

      const { data: updated, error: lockError } = await supabase
        .from('brand_outputs')
        .update({
          is_locked: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select('id, output_key, output_value, is_locked')
        .single();

      if (lockError) {
        console.error('Failed to lock variable:', lockError.message);
        return NextResponse.json({ error: 'Failed to lock variable' }, { status: 500 });
      }

      return NextResponse.json({ success: true, output: updated });
    }

    if (action === 'unlock') {
      const { data: existing } = await supabase
        .from('brand_outputs')
        .select('id, is_locked')
        .eq('organization_id', organizationId)
        .eq('output_key', outputKey)
        .single();

      if (!existing) {
        return NextResponse.json({ error: 'Variable not found' }, { status: 404 });
      }

      if (!existing.is_locked) {
        return NextResponse.json({ success: true, message: 'Already unlocked' });
      }

      const { data: updated, error: unlockError } = await supabase
        .from('brand_outputs')
        .update({
          is_locked: false,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select('id, output_key, output_value, is_locked')
        .single();

      if (unlockError) {
        console.error('Failed to unlock variable:', unlockError.message);
        return NextResponse.json({ error: 'Failed to unlock variable' }, { status: 500 });
      }

      return NextResponse.json({ success: true, output: updated });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Variable API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
