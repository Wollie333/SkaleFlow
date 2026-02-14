import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkAuthorityAccess } from '@/lib/authority/auth';
import { getTierForPoints } from '@/lib/authority/scoring';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const orgId = request.nextUrl.searchParams.get('organizationId');
  if (!orgId) return NextResponse.json({ error: 'organizationId required' }, { status: 400 });

  // Verify membership (super_admin bypass)
  const access = await checkAuthorityAccess(supabase, user.id, orgId);
  if (!access.authorized) return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  const db = access.queryClient;

  // Get all scores
  const { data: scores } = await db
    .from('authority_scores')
    .select(`
      *,
      authority_pipeline_cards(opportunity_name, category)
    `)
    .eq('organization_id', orgId)
    .order('scored_at', { ascending: false });

  const totalPoints = (scores || []).reduce((sum, s) => sum + (s.total_points || 0), 0);
  const tier = getTierForPoints(totalPoints);

  // Get recent scores (last 10)
  const recentScores = (scores || []).slice(0, 10);

  // Category breakdown
  const categoryBreakdown: Record<string, number> = {};
  for (const s of scores || []) {
    const cat = s.activity_category || 'unknown';
    categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + s.total_points;
  }

  // Monthly trend (last 6 months)
  const monthlyTrend: Array<{ month: string; points: number }> = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const monthPoints = (scores || [])
      .filter(s => s.scored_at && s.scored_at.startsWith(monthKey))
      .reduce((sum, s) => sum + (s.total_points || 0), 0);
    monthlyTrend.push({ month: monthKey, points: monthPoints });
  }

  return NextResponse.json({
    total_points: totalPoints,
    tier,
    placement_count: (scores || []).length,
    recent_scores: recentScores,
    category_breakdown: categoryBreakdown,
    monthly_trend: monthlyTrend,
  });
}
