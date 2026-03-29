import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { PLATFORM_DEFAULTS, AGGRESSIVENESS_TIERS, type SocialChannel, type Aggressiveness } from '@/config/platform-defaults';
import { CAMPAIGN_OBJECTIVES, type CampaignObjectiveId } from '@/config/campaign-objectives';
import type { Json } from '@/types/database';

// GET — List ad sets for a campaign
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data, error } = await supabase
      .from('campaign_adsets')
      .select('*')
      .eq('campaign_id', id)
      .order('created_at');

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ adsets: data });
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST — Add an ad set to a campaign
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: campaignId } = await params;
    const body = await request.json();
    const { channel, aggressiveness, postsPerWeek } = body;

    if (!channel) return NextResponse.json({ error: 'channel required' }, { status: 400 });

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Load campaign for objective + dates
    const { data: campaign } = await supabase
      .from('campaigns')
      .select('objective, organization_id, workspace_id, start_date, end_date')
      .eq('id', campaignId)
      .single();

    if (!campaign) return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });

    const ch = channel as SocialChannel;
    const agg = (aggressiveness || 'focused') as Aggressiveness;
    const platformConfig = PLATFORM_DEFAULTS[ch];
    const aggConfig = AGGRESSIVENESS_TIERS[agg];
    const objectiveConfig = CAMPAIGN_OBJECTIVES[campaign.objective as CampaignObjectiveId];

    const start = new Date(campaign.start_date);
    const end = campaign.end_date ? new Date(campaign.end_date) : new Date(start.getTime() + 30 * 24 * 60 * 60 * 1000);
    const weeks = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (7 * 24 * 60 * 60 * 1000)));

    // Use manual override if provided, otherwise use aggressiveness tier default
    const finalPostsPerWeek = postsPerWeek || aggConfig.postsPerWeek;

    const { data: adset, error } = await supabase
      .from('campaign_adsets')
      .insert({
        campaign_id: campaignId,
        organization_id: campaign.organization_id,
        workspace_id: campaign.workspace_id,
        channel: ch,
        aggressiveness: agg,
        posts_per_week: finalPostsPerWeek,
        total_posts: weeks * finalPostsPerWeek,
        content_type_ratio: (objectiveConfig?.defaultRatio || {}) as unknown as Json,
        content_type_counts: {} as Json,
        format_ratio: platformConfig.formatRatio as unknown as Json,
        posting_schedule: platformConfig.defaultSchedule as unknown as Json,
        status: 'active',
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ adset });
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
