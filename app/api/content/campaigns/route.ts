import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { CAMPAIGN_OBJECTIVES, type CampaignObjectiveId } from '@/config/campaign-objectives';
import { PLATFORM_DEFAULTS, AGGRESSIVENESS_TIERS, type SocialChannel, type Aggressiveness } from '@/config/platform-defaults';
import type { Json } from '@/types/database';

// GET — List campaigns for org
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    const status = searchParams.get('status');

    if (!organizationId) {
      return NextResponse.json({ error: 'organizationId required' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    let query = supabase
      .from('campaigns')
      .select(`
        *,
        campaign_adsets (id, channel, aggressiveness, posts_per_week, total_posts, status)
      `)
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ campaigns: data });
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST — Create a new campaign with ad sets
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      organizationId,
      name,
      objective,
      startDate,
      endDate,
      channels, // Array<{ channel: SocialChannel, aggressiveness: Aggressiveness }>
    } = body;

    if (!organizationId || !name || !objective) {
      return NextResponse.json({ error: 'organizationId, name, and objective required' }, { status: 400 });
    }

    if (!CAMPAIGN_OBJECTIVES[objective as CampaignObjectiveId]) {
      return NextResponse.json({ error: `Invalid objective: ${objective}` }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Verify org membership
    const { data: membership } = await supabase
      .from('org_members')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('user_id', user.id)
      .single();
    if (!membership) return NextResponse.json({ error: 'Access denied' }, { status: 403 });

    const objectiveConfig = CAMPAIGN_OBJECTIVES[objective as CampaignObjectiveId];

    // Get user's default workspace
    const { data: workspace } = await supabase
      .from('workspaces')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('is_default', true)
      .single();

    if (!workspace) {
      return NextResponse.json({ error: 'No default workspace found for organization' }, { status: 400 });
    }

    // Create campaign
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .insert({
        organization_id: organizationId,
        workspace_id: workspace.id,
        name,
        objective,
        objective_category: objectiveConfig.category,
        status: 'draft',
        start_date: startDate || new Date().toISOString().split('T')[0],
        end_date: endDate || null,
        created_by: user.id,
      })
      .select()
      .single();

    if (campaignError || !campaign) {
      return NextResponse.json({ error: campaignError?.message || 'Failed to create campaign' }, { status: 500 });
    }

    // Create ad sets for each selected channel
    const adsets = [];
    const channelList = channels || [{ channel: 'linkedin', aggressiveness: 'focused' }];

    for (const ch of channelList) {
      const channel = ch.channel as SocialChannel;
      const aggressiveness = (ch.aggressiveness || 'focused') as Aggressiveness;
      const platformConfig = PLATFORM_DEFAULTS[channel];
      const aggConfig = AGGRESSIVENESS_TIERS[aggressiveness];

      // Use manual override if provided, otherwise use aggressiveness tier default
      const postsPerWeek = ch.postsPerWeek ?? aggConfig.postsPerWeek;

      // Calculate total posts
      const start = new Date(campaign.start_date);
      const end = campaign.end_date ? new Date(campaign.end_date) : new Date(start.getTime() + 30 * 24 * 60 * 60 * 1000);
      const weeks = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (7 * 24 * 60 * 60 * 1000)));
      const totalPosts = weeks * postsPerWeek;

      const { data: adset } = await supabase
        .from('campaign_adsets')
        .insert({
          campaign_id: campaign.id,
          organization_id: organizationId,
          workspace_id: workspace.id,
          channel,
          aggressiveness,
          posts_per_week: postsPerWeek,
          total_posts: totalPosts,
          content_type_ratio: objectiveConfig.defaultRatio as unknown as Json,
          content_type_counts: {} as Json,
          format_ratio: platformConfig.formatRatio as unknown as Json,
          posting_schedule: platformConfig.defaultSchedule as unknown as Json,
        })
        .select()
        .single();

      if (adset) adsets.push(adset);
    }

    // Update campaign total_posts_target
    const totalTarget = adsets.reduce((sum, a) => sum + a.total_posts, 0);
    await supabase
      .from('campaigns')
      .update({ total_posts_target: totalTarget })
      .eq('id', campaign.id);

    return NextResponse.json({
      campaign: { ...campaign, total_posts_target: totalTarget },
      adsets,
    });
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
