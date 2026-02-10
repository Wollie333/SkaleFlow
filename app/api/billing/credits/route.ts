import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkCredits, isSuperAdmin } from '@/lib/ai';
import { MODEL_CATALOG } from '@/lib/ai/providers/registry';

function computeApiCostUSD(model: string, inputTokens: number, outputTokens: number): number {
  const config = MODEL_CATALOG.find(m => m.id === model || m.modelId === model);
  if (!config) return 0;
  const inputCost = (inputTokens / 1_000_000) * config.inputPricePer1M;
  const outputCost = (outputTokens / 1_000_000) * config.outputPricePer1M;
  return inputCost + outputCost;
}

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');

    if (!organizationId) {
      return NextResponse.json({ error: 'organizationId is required' }, { status: 400 });
    }

    // Verify org membership
    const { data: membership } = await supabase
      .from('org_members')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const balance = await checkCredits(organizationId, 0, user.id);

    // For super admin, also compute actual API cost from ai_usage
    let apiCostUSD = 0;
    if (balance.isSuperAdmin) {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: usageRows } = await supabase
        .from('ai_usage')
        .select('model, input_tokens, output_tokens')
        .eq('organization_id', organizationId)
        .gte('created_at', thirtyDaysAgo.toISOString());

      for (const row of usageRows || []) {
        apiCostUSD += computeApiCostUSD(row.model, row.input_tokens || 0, row.output_tokens || 0);
      }

      // Also get all-time cost
      const { data: allUsage } = await supabase
        .from('ai_usage')
        .select('model, input_tokens, output_tokens')
        .eq('organization_id', organizationId);

      let allTimeCostUSD = 0;
      for (const row of allUsage || []) {
        allTimeCostUSD += computeApiCostUSD(row.model, row.input_tokens || 0, row.output_tokens || 0);
      }

      return NextResponse.json({
        ...balance,
        apiCostUSD30d: Math.round(apiCostUSD * 10000) / 10000,
        apiCostUSDAllTime: Math.round(allTimeCostUSD * 10000) / 10000,
      });
    }

    return NextResponse.json(balance);
  } catch (error) {
    console.error('Credits fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch credits' }, { status: 500 });
  }
}
