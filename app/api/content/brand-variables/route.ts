import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { BRAND_VARIABLE_CATEGORIES } from '@/lib/content-engine/brand-variable-categories';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');

    if (!organizationId) {
      return NextResponse.json({ error: 'organizationId required' }, { status: 400 });
    }

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

    // Get all locked brand outputs
    const { data: outputs } = await supabase
      .from('brand_outputs')
      .select('output_key, output_value, is_locked, updated_at')
      .eq('organization_id', organizationId)
      .eq('is_locked', true);

    // Organize by category
    const outputMap = new Map(outputs?.map(o => [o.output_key, o]) || []);

    // Fallback: if content_pillars has no value, derive from content_themes
    if (!outputMap.has('content_pillars') && outputMap.has('content_themes')) {
      outputMap.set('content_pillars', {
        output_key: 'content_pillars',
        output_value: outputMap.get('content_themes')!.output_value,
        is_locked: true,
        updated_at: outputMap.get('content_themes')!.updated_at,
      });
    }

    const categories = BRAND_VARIABLE_CATEGORIES.map(cat => ({
      ...cat,
      variables: cat.outputKeys.map(key => ({
        key,
        value: outputMap.get(key)?.output_value ?? null,
        isLocked: outputMap.get(key)?.is_locked ?? false,
        updatedAt: outputMap.get(key)?.updated_at ?? null,
      })),
    }));

    return NextResponse.json({ categories });
  } catch (error) {
    console.error('Brand variables fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch brand variables' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const { organizationId, outputKey, outputValue } = await request.json();

    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: membership } = await supabase
      .from('org_members')
      .select('role')
      .eq('organization_id', organizationId)
      .eq('user_id', user.id)
      .single();

    if (!membership || !['owner', 'admin'].includes(membership.role)) {
      return NextResponse.json({ error: 'Only owners/admins can update brand variables' }, { status: 403 });
    }

    const { error } = await supabase
      .from('brand_outputs')
      .update({
        output_value: outputValue,
        updated_at: new Date().toISOString(),
      })
      .eq('organization_id', organizationId)
      .eq('output_key', outputKey);

    if (error) {
      return NextResponse.json({ error: 'Failed to update brand variable' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Brand variable update error:', error);
    return NextResponse.json(
      { error: 'Failed to update brand variable' },
      { status: 500 }
    );
  }
}
