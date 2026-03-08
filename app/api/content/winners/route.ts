import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET — List all winners for an organization
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');

    if (!organizationId) {
      return NextResponse.json({ error: 'organizationId required' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Get winners with post and campaign data
    const { data: winners, error } = await supabase
      .from('winner_pool')
      .select(`
        id,
        post_id,
        campaign_id,
        winner_category,
        performance_snapshot,
        hook_pattern,
        content_type,
        format,
        posting_time,
        posting_day,
        flagged_at,
        amplified_to_paid
      `)
      .eq('organization_id', organizationId)
      .order('flagged_at', { ascending: false });

    if (error) throw error;

    // Fetch associated post and campaign names
    const postIds = (winners || []).map(w => w.post_id);
    const campaignIds = Array.from(new Set((winners || []).map(w => w.campaign_id)));

    const [postsRes, campaignsRes] = await Promise.all([
      postIds.length > 0
        ? supabase.from('content_posts').select('id, topic, hook, platform').in('id', postIds)
        : { data: [] },
      campaignIds.length > 0
        ? supabase.from('campaigns').select('id, name').in('id', campaignIds)
        : { data: [] },
    ]);

    const postMap: Record<string, any> = {};
    for (const p of (postsRes.data || [])) postMap[p.id] = p;

    const campaignMap: Record<string, string> = {};
    for (const c of (campaignsRes.data || [])) campaignMap[c.id] = c.name;

    // Count recycles per source
    const { data: recycleCounts } = await supabase
      .from('content_posts')
      .select('recycled_from')
      .eq('organization_id', organizationId)
      .not('recycled_from', 'is', null);

    const recycleCountMap: Record<string, number> = {};
    for (const r of (recycleCounts || [])) {
      recycleCountMap[r.recycled_from] = (recycleCountMap[r.recycled_from] || 0) + 1;
    }

    // Get last recycled date per source
    const { data: lastRecycles } = await supabase
      .from('content_posts')
      .select('recycled_from, created_at')
      .eq('organization_id', organizationId)
      .not('recycled_from', 'is', null)
      .order('created_at', { ascending: false });

    const lastRecycledMap: Record<string, string> = {};
    for (const r of (lastRecycles || [])) {
      if (!lastRecycledMap[r.recycled_from]) {
        lastRecycledMap[r.recycled_from] = r.created_at;
      }
    }

    // Build response
    const enriched = (winners || []).map(w => {
      const post = postMap[w.post_id] || {};
      const perf = (w.performance_snapshot || {}) as Record<string, number>;
      const baselineER = perf.engagement_rate || 0;

      return {
        id: w.id,
        post_id: w.post_id,
        campaign_id: w.campaign_id,
        campaign_name: campaignMap[w.campaign_id] || 'Unknown',
        content_type: w.content_type,
        platform: post.platform || '',
        format: w.format,
        topic: post.topic || '',
        hook: w.hook_pattern || post.hook || '',
        category: w.winner_category,
        metric_value: baselineER,
        baseline_value: 0,
        multiplier: 0,
        last_recycled_at: lastRecycledMap[w.post_id] || null,
        recycle_count: recycleCountMap[w.post_id] || 0,
        created_at: w.flagged_at,
      };
    });

    return NextResponse.json({ winners: enriched });
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
