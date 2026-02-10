import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { MODEL_CATALOG } from '@/lib/ai/providers/registry';

/** GET: list all models with their global enable/disable state */
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: adminUser } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (adminUser?.role !== 'super_admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const serviceSupabase = createServiceClient();
    const { data: rules } = await serviceSupabase
      .from('model_access_rules')
      .select('model_id, is_enabled')
      .eq('scope_type', 'global')
      .eq('scope_id', 'platform');

    const ruleMap = new Map<string, boolean>();
    for (const rule of rules || []) {
      ruleMap.set(rule.model_id, rule.is_enabled);
    }

    const models = MODEL_CATALOG.map(m => ({
      id: m.id,
      name: m.name,
      provider: m.provider,
      isFree: m.isFree,
      isEnabled: ruleMap.has(m.id) ? ruleMap.get(m.id)! : true, // default enabled
    }));

    return NextResponse.json({ models });
  } catch (error) {
    console.error('Admin models GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch models' }, { status: 500 });
  }
}

/** PATCH: toggle a model on/off globally */
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: adminUser } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (adminUser?.role !== 'super_admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { modelId, isEnabled } = await request.json();

    if (!modelId || typeof isEnabled !== 'boolean') {
      return NextResponse.json({ error: 'modelId and isEnabled are required' }, { status: 400 });
    }

    // Validate model exists in catalog
    const catalogEntry = MODEL_CATALOG.find(m => m.id === modelId);
    if (!catalogEntry) {
      return NextResponse.json({ error: 'Invalid model' }, { status: 400 });
    }

    const serviceSupabase = createServiceClient();

    // Upsert the global rule
    const { error } = await serviceSupabase
      .from('model_access_rules')
      .upsert({
        model_id: modelId,
        scope_type: 'global',
        scope_id: 'platform',
        is_enabled: isEnabled,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'model_id,scope_type,scope_id',
      });

    if (error) {
      console.error('Failed to update model rule:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, modelId, isEnabled });
  } catch (error) {
    console.error('Admin models PATCH error:', error);
    return NextResponse.json({ error: 'Failed to update model' }, { status: 500 });
  }
}
