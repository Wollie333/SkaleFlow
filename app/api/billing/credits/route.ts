import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkCredits, isSuperAdmin } from '@/lib/ai/server';
import { MODEL_CATALOG } from '@/lib/ai/providers/registry';
import { creditsToRealCost } from '@/lib/ai/utils';

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

    // For super admin, compute SYSTEM-WIDE totals (all orgs)
    if (balance.isSuperAdmin) {
      // Get all credit balances across all orgs
      const { data: allBalances } = await supabase
        .from('credit_balances')
        .select('monthly_credits_remaining, topup_credits_remaining');

      let totalSystemCredits = 0;
      for (const bal of allBalances || []) {
        totalSystemCredits += (bal.monthly_credits_remaining || 0) + (bal.topup_credits_remaining || 0);
      }

      // Convert available credits to USD cost value
      const systemTotalCostUSD = creditsToRealCost(totalSystemCredits);

      // Get all-time API usage across all orgs for the admin tab
      const { data: allUsage } = await supabase
        .from('ai_usage')
        .select('model, input_tokens, output_tokens');

      let totalApiCostUSD = 0;
      for (const row of allUsage || []) {
        totalApiCostUSD += computeApiCostUSD(row.model, row.input_tokens || 0, row.output_tokens || 0);
      }

      return NextResponse.json({
        ...balance,
        systemTotalCredits: totalSystemCredits,
        systemTotalCostUSD: Math.round(systemTotalCostUSD * 100) / 100,
        apiCostUSD30d: 0, // Deprecated for system view
        apiCostUSDAllTime: Math.round(totalApiCostUSD * 10000) / 10000,
      });
    }

    return NextResponse.json(balance);
  } catch (error) {
    console.error('Credits fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch credits' }, { status: 500 });
  }
}
