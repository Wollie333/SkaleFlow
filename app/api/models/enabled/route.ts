import { NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { MODEL_CATALOG } from '@/lib/ai/providers/registry';

/** GET: list all enabled models for regular users */
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

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

    // Filter to only enabled models
    const enabledModels = MODEL_CATALOG
      .filter(m => ruleMap.has(m.id) ? ruleMap.get(m.id)! : true) // default enabled
      .map(m => ({
        id: m.id,
        name: m.name,
        provider: m.provider,
        isFree: m.isFree,
      }));

    return NextResponse.json({ models: enabledModels });
  } catch (error) {
    console.error('Enabled models GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch models' }, { status: 500 });
  }
}
