import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { MODEL_CATALOG } from '@/lib/ai/providers/registry';

const USD_TO_ZAR = 18;

function getDateFilter(period: string): string | null {
  const now = new Date();
  switch (period) {
    case '7d':
      now.setDate(now.getDate() - 7);
      return now.toISOString();
    case '30d':
      now.setDate(now.getDate() - 30);
      return now.toISOString();
    case '90d':
      now.setDate(now.getDate() - 90);
      return now.toISOString();
    case 'all':
      return null;
    default:
      now.setDate(now.getDate() - 30);
      return now.toISOString();
  }
}

function computeApiCostUSD(model: string, inputTokens: number, outputTokens: number): number {
  const config = MODEL_CATALOG.find(m => m.id === model || m.modelId === model);
  if (!config) return 0;
  const inputCost = (inputTokens / 1_000_000) * config.inputPricePer1M;
  const outputCost = (outputTokens / 1_000_000) * config.outputPricePer1M;
  return inputCost + outputCost;
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();

    // Verify super_admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: adminUser } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (adminUser?.role !== 'super_admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const serviceSupabase = createServiceClient();
    const period = request.nextUrl.searchParams.get('period') || '30d';
    const dateFilter = getDateFilter(period);

    // 1. Fetch ai_usage rows
    let usageQuery = serviceSupabase
      .from('ai_usage')
      .select('organization_id, model, provider, feature, input_tokens, output_tokens, credits_charged, is_free_model, created_at');

    if (dateFilter) {
      usageQuery = usageQuery.gte('created_at', dateFilter);
    }

    const { data: usageRows, error: usageError } = await usageQuery;

    if (usageError) {
      console.error('Failed to fetch ai_usage:', usageError);
      return NextResponse.json({ error: 'Failed to fetch usage data' }, { status: 500 });
    }

    const rows = usageRows || [];

    // 2. Fetch organizations with tier info
    const { data: orgs } = await serviceSupabase
      .from('organizations')
      .select(`
        id,
        name,
        subscriptions (
          subscription_tiers (
            name
          )
        )
      `);

    const orgMap = new Map<string, { name: string; tierName: string }>();
    for (const org of orgs || []) {
      const tierName = (org.subscriptions as any)?.[0]?.subscription_tiers?.name || 'No tier';
      orgMap.set(org.id, { name: org.name, tierName });
    }

    // 3. Fetch credit_balances for monthly allocation
    const { data: balances } = await serviceSupabase
      .from('credit_balances')
      .select('organization_id, monthly_credits_total');

    const balanceMap = new Map<string, number>();
    for (const b of balances || []) {
      balanceMap.set(b.organization_id, b.monthly_credits_total || 0);
    }

    // 4. Fetch topup invoice revenue
    let invoiceQuery = serviceSupabase
      .from('invoices')
      .select('total_cents')
      .eq('invoice_type', 'topup')
      .eq('status', 'paid');

    if (dateFilter) {
      invoiceQuery = invoiceQuery.gte('created_at', dateFilter);
    }

    const { data: invoiceRows } = await invoiceQuery;

    const topupRevenue = {
      totalZAR: ((invoiceRows || []).reduce((sum, inv) => sum + (inv.total_cents || 0), 0)) / 100,
      count: (invoiceRows || []).length,
    };

    // Aggregate summary
    let totalApiCostUSD = 0;
    let totalCreditsCharged = 0;
    let totalRequests = rows.length;
    let freeModelRequests = 0;

    // Per-organization aggregation
    const orgAgg = new Map<string, {
      totalCreditsUsed: number;
      totalRequests: number;
      apiCostUSD: number;
    }>();

    // Per-model aggregation
    const modelAgg = new Map<string, {
      provider: string;
      isFree: boolean;
      requests: number;
      inputTokens: number;
      outputTokens: number;
      creditsCharged: number;
      apiCostUSD: number;
    }>();

    // Per-feature aggregation
    const featureAgg = new Map<string, {
      requests: number;
      creditsCharged: number;
      apiCostUSD: number;
    }>();

    for (const row of rows) {
      const inputTokens = row.input_tokens || 0;
      const outputTokens = row.output_tokens || 0;
      const credits = row.credits_charged || 0;
      const isFree = row.is_free_model || false;
      const model = row.model || 'unknown';
      const provider = row.provider || 'unknown';
      const feature = row.feature || 'unknown';
      const orgId = row.organization_id;

      const costUSD = computeApiCostUSD(model, inputTokens, outputTokens);

      totalApiCostUSD += costUSD;
      totalCreditsCharged += credits;
      if (isFree) freeModelRequests++;

      // Org aggregation
      if (orgId) {
        const existing = orgAgg.get(orgId) || { totalCreditsUsed: 0, totalRequests: 0, apiCostUSD: 0 };
        existing.totalCreditsUsed += credits;
        existing.totalRequests += 1;
        existing.apiCostUSD += costUSD;
        orgAgg.set(orgId, existing);
      }

      // Model aggregation
      const mKey = model;
      const mExisting = modelAgg.get(mKey) || {
        provider,
        isFree,
        requests: 0,
        inputTokens: 0,
        outputTokens: 0,
        creditsCharged: 0,
        apiCostUSD: 0,
      };
      mExisting.requests += 1;
      mExisting.inputTokens += inputTokens;
      mExisting.outputTokens += outputTokens;
      mExisting.creditsCharged += credits;
      mExisting.apiCostUSD += costUSD;
      modelAgg.set(mKey, mExisting);

      // Feature aggregation
      const fExisting = featureAgg.get(feature) || { requests: 0, creditsCharged: 0, apiCostUSD: 0 };
      fExisting.requests += 1;
      fExisting.creditsCharged += credits;
      fExisting.apiCostUSD += costUSD;
      featureAgg.set(feature, fExisting);
    }

    const totalApiCostZAR = totalApiCostUSD * USD_TO_ZAR;
    const totalRevenueZAR = totalCreditsCharged / 100;
    const profitZAR = totalRevenueZAR - totalApiCostZAR;
    const profitMargin = totalRevenueZAR > 0 ? (profitZAR / totalRevenueZAR) * 100 : 0;

    const summary = {
      totalApiCostUSD: Math.round(totalApiCostUSD * 100) / 100,
      totalApiCostZAR: Math.round(totalApiCostZAR * 100) / 100,
      totalCreditsCharged,
      totalRevenueZAR: Math.round(totalRevenueZAR * 100) / 100,
      profitZAR: Math.round(profitZAR * 100) / 100,
      profitMargin: Math.round(profitMargin * 10) / 10,
      totalRequests,
      freeModelRequests,
    };

    const byOrganization = Array.from(orgAgg.entries()).map(([orgId, data]) => ({
      orgId,
      orgName: orgMap.get(orgId)?.name || 'Unknown',
      tierName: orgMap.get(orgId)?.tierName || 'No tier',
      totalCreditsUsed: data.totalCreditsUsed,
      totalRequests: data.totalRequests,
      apiCostUSD: Math.round(data.apiCostUSD * 100) / 100,
      monthlyAllocation: balanceMap.get(orgId) || 0,
    })).sort((a, b) => b.totalCreditsUsed - a.totalCreditsUsed);

    // Ensure all catalog models appear (even with zero usage)
    for (const catalogModel of MODEL_CATALOG) {
      const key = catalogModel.modelId;
      if (!modelAgg.has(key)) {
        modelAgg.set(key, {
          provider: catalogModel.provider,
          isFree: catalogModel.isFree,
          requests: 0,
          inputTokens: 0,
          outputTokens: 0,
          creditsCharged: 0,
          apiCostUSD: 0,
        });
      }
    }

    const byModel = Array.from(modelAgg.entries()).map(([model, data]) => {
      // Use the catalog display name if available
      const catalogEntry = MODEL_CATALOG.find(m => m.modelId === model || m.id === model);
      return {
        model: catalogEntry?.name || model,
        provider: data.provider,
        isFree: data.isFree,
        requests: data.requests,
        inputTokens: data.inputTokens,
        outputTokens: data.outputTokens,
        creditsCharged: data.creditsCharged,
        apiCostUSD: Math.round(data.apiCostUSD * 100) / 100,
      };
    }).sort((a, b) => b.apiCostUSD - a.apiCostUSD);

    const byFeature = Array.from(featureAgg.entries()).map(([feature, data]) => ({
      feature,
      requests: data.requests,
      creditsCharged: data.creditsCharged,
      apiCostUSD: Math.round(data.apiCostUSD * 100) / 100,
    })).sort((a, b) => b.creditsCharged - a.creditsCharged);

    return NextResponse.json({
      summary,
      byOrganization,
      byModel,
      byFeature,
      topupRevenue,
    });
  } catch (error) {
    console.error('Error fetching cost data:', error);
    return NextResponse.json({ error: 'Failed to fetch cost data' }, { status: 500 });
  }
}
