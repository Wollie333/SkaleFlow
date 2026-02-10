import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { MODEL_CATALOG } from '@/lib/ai/providers/registry';

function getDateFilter(period: string): string | null {
  const now = new Date();
  switch (period) {
    case '7d': now.setDate(now.getDate() - 7); return now.toISOString();
    case '30d': now.setDate(now.getDate() - 30); return now.toISOString();
    case '90d': now.setDate(now.getDate() - 90); return now.toISOString();
    case 'all': return null;
    default: now.setDate(now.getDate() - 30); return now.toISOString();
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = request.nextUrl;
    const organizationId = searchParams.get('organizationId');
    const period = searchParams.get('period') || '30d';
    const modelFilter = searchParams.get('model'); // optional: filter to single model

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

    const dateFilter = getDateFilter(period);

    // Fetch ai_usage rows for this org
    let query = supabase
      .from('ai_usage')
      .select('id, user_id, model, provider, feature, input_tokens, output_tokens, credits_charged, is_free_model, created_at')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (dateFilter) {
      query = query.gte('created_at', dateFilter);
    }

    if (modelFilter) {
      // Match both model ID and modelId from catalog
      const catalogEntry = MODEL_CATALOG.find(m => m.id === modelFilter);
      if (catalogEntry) {
        query = query.or(`model.eq.${catalogEntry.modelId},model.eq.${catalogEntry.id}`);
      } else {
        query = query.eq('model', modelFilter);
      }
    }

    const { data: usageRows, error: usageError } = await query.limit(1000);

    if (usageError) {
      return NextResponse.json({ error: usageError.message }, { status: 500 });
    }

    const rows = usageRows || [];

    // Fetch user names for attribution
    const userIds = Array.from(new Set(rows.map(r => r.user_id).filter(Boolean))) as string[];
    const userMap = new Map<string, string>();

    if (userIds.length > 0) {
      const { data: users } = await supabase
        .from('users')
        .select('id, full_name, email')
        .in('id', userIds);

      for (const u of users || []) {
        userMap.set(u.id, u.full_name || u.email || 'Unknown');
      }
    }

    // Aggregate by model
    const modelAgg = new Map<string, {
      modelKey: string;
      provider: string;
      isFree: boolean;
      requests: number;
      inputTokens: number;
      outputTokens: number;
      creditsCharged: number;
    }>();

    // Aggregate by feature
    const featureAgg = new Map<string, {
      requests: number;
      creditsCharged: number;
    }>();

    // Aggregate by user
    const userAgg = new Map<string, {
      userName: string;
      requests: number;
      creditsCharged: number;
      inputTokens: number;
      outputTokens: number;
    }>();

    let totalRequests = 0;
    let totalCredits = 0;
    let freeRequests = 0;

    for (const row of rows) {
      const inputTokens = row.input_tokens || 0;
      const outputTokens = row.output_tokens || 0;
      const credits = row.credits_charged || 0;
      const isFree = row.is_free_model || false;
      const model = row.model || 'unknown';
      const provider = row.provider || 'unknown';
      const feature = row.feature || 'unknown';
      const userId = row.user_id || 'system';

      totalRequests++;
      totalCredits += credits;
      if (isFree) freeRequests++;

      // Find catalog key for this model
      const catalogEntry = MODEL_CATALOG.find(m => m.modelId === model || m.id === model);
      const modelKey = catalogEntry?.id || model;

      // Model agg
      const mExisting = modelAgg.get(modelKey) || {
        modelKey,
        provider,
        isFree,
        requests: 0,
        inputTokens: 0,
        outputTokens: 0,
        creditsCharged: 0,
      };
      mExisting.requests++;
      mExisting.inputTokens += inputTokens;
      mExisting.outputTokens += outputTokens;
      mExisting.creditsCharged += credits;
      modelAgg.set(modelKey, mExisting);

      // Feature agg
      const fExisting = featureAgg.get(feature) || { requests: 0, creditsCharged: 0 };
      fExisting.requests++;
      fExisting.creditsCharged += credits;
      featureAgg.set(feature, fExisting);

      // User agg
      const uExisting = userAgg.get(userId) || {
        userName: userMap.get(userId) || (userId === 'system' ? 'System' : 'Unknown'),
        requests: 0,
        creditsCharged: 0,
        inputTokens: 0,
        outputTokens: 0,
      };
      uExisting.requests++;
      uExisting.creditsCharged += credits;
      uExisting.inputTokens += inputTokens;
      uExisting.outputTokens += outputTokens;
      userAgg.set(userId, uExisting);
    }

    const byModel = Array.from(modelAgg.entries()).map(([key, data]) => {
      const catalogEntry = MODEL_CATALOG.find(m => m.id === key || m.modelId === key);
      return {
        modelKey: key,
        modelName: catalogEntry?.name || key,
        provider: data.provider,
        isFree: data.isFree,
        requests: data.requests,
        inputTokens: data.inputTokens,
        outputTokens: data.outputTokens,
        creditsCharged: data.creditsCharged,
      };
    }).sort((a, b) => b.requests - a.requests);

    const byFeature = Array.from(featureAgg.entries()).map(([feature, data]) => ({
      feature,
      requests: data.requests,
      creditsCharged: data.creditsCharged,
    })).sort((a, b) => b.creditsCharged - a.creditsCharged);

    const byUser = Array.from(userAgg.entries()).map(([userId, data]) => ({
      userId,
      userName: data.userName,
      requests: data.requests,
      creditsCharged: data.creditsCharged,
      inputTokens: data.inputTokens,
      outputTokens: data.outputTokens,
    })).sort((a, b) => b.creditsCharged - a.creditsCharged);

    // Recent logs (last 50 individual requests) — only when model filter is active
    let recentLogs: Array<{
      id: string;
      feature: string;
      userName: string;
      inputTokens: number;
      outputTokens: number;
      creditsCharged: number;
      isFree: boolean;
      createdAt: string;
    }> = [];

    if (modelFilter) {
      recentLogs = rows.slice(0, 50).map(r => ({
        id: r.id,
        feature: r.feature || 'unknown',
        userName: userMap.get(r.user_id || '') || (r.user_id ? 'Unknown' : 'System'),
        inputTokens: r.input_tokens || 0,
        outputTokens: r.output_tokens || 0,
        creditsCharged: r.credits_charged || 0,
        isFree: r.is_free_model || false,
        createdAt: r.created_at,
      }));
    }

    return NextResponse.json({
      summary: { totalRequests, totalCredits, freeRequests },
      byModel,
      byFeature,
      byUser,
      recentLogs,
    });
  } catch (error) {
    console.error('Usage fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch usage data' }, { status: 500 });
  }
}
