import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateCampaignReport } from '@/lib/content-engine/brand-intelligence';

// GET — Get existing report for a campaign
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: campaignId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Get the most recent report
    const { data: report } = await supabase
      .from('brand_intelligence_reports')
      .select('*')
      .eq('campaign_id', campaignId)
      .order('generated_at', { ascending: false })
      .limit(1)
      .single();

    if (!report) {
      return NextResponse.json({ report: null });
    }

    // Get campaign info
    const { data: campaign } = await supabase
      .from('campaigns')
      .select('name, objective, start_date, end_date')
      .eq('id', campaignId)
      .single();

    // Get post counts
    const { count: totalPosts } = await supabase
      .from('content_posts')
      .select('id', { count: 'exact', head: true })
      .eq('campaign_id', campaignId);

    const { count: publishedPosts } = await supabase
      .from('content_posts')
      .select('id', { count: 'exact', head: true })
      .eq('campaign_id', campaignId)
      .eq('status', 'published');

    return NextResponse.json({
      report: {
        campaign_id: campaignId,
        campaign_name: campaign?.name || '',
        objective: campaign?.objective || '',
        date_range: { start: campaign?.start_date, end: campaign?.end_date },
        total_posts: totalPosts || 0,
        published_posts: publishedPosts || 0,
        content_type_performance: report.content_type_performance || [],
        platform_performance: report.format_performance || [],
        top_posts: [],
        recommendations: (report.next_campaign_recommendation as any)?.recommendations || [],
        generated_at: report.generated_at,
        avg_engagement_rate: 0,
        total_impressions: 0,
        total_winners: 0,
      },
    });
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST — Generate a new report
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: campaignId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const report = await generateCampaignReport(supabase, campaignId);

    if (!report) {
      return NextResponse.json({ error: 'Failed to generate report. Campaign may not have published posts.' }, { status: 400 });
    }

    return NextResponse.json({ report });
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
