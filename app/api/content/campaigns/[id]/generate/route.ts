import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { calculatePostDistribution, type AdSetInput } from '@/lib/content-engine/ratio-calculator';
import { CONTENT_TYPES, type ContentTypeId } from '@/config/content-types';
import { enqueueCampaignBatch } from '@/lib/content-engine/v3-queue-service';
import type { CampaignObjectiveId } from '@/config/campaign-objectives';
import type { SocialChannel, Aggressiveness } from '@/config/platform-defaults';
import type { Database, Json } from '@/types/database';

// POST — Generate all posts for a campaign (or specific ad set)
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: campaignId } = await params;
    const body = await request.json();
    const { adsetId, modelId, creativeDirection, selectedBrandVariables } = body;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Load campaign
    const { data: campaign } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', campaignId)
      .single();

    if (!campaign) return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });

    // Load ad sets (all or specific)
    let adsetQuery = supabase
      .from('campaign_adsets')
      .select('*')
      .eq('campaign_id', campaignId)
      .eq('status', 'active');

    if (adsetId) {
      adsetQuery = adsetQuery.eq('id', adsetId);
    }

    const { data: adsets } = await adsetQuery;
    if (!adsets || adsets.length === 0) {
      return NextResponse.json({ error: 'No active ad sets found' }, { status: 400 });
    }

    // Check super admin
    const { data: userRecord } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();
    const isSuperAdmin = userRecord?.role === 'super_admin';

    const startDate = new Date(campaign.start_date);
    const endDate = campaign.end_date
      ? new Date(campaign.end_date)
      : new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000);

    // Calculate post distribution using ratio calculator
    const adsetInputs: AdSetInput[] = adsets.map(a => ({
      id: a.id,
      channel: a.channel as SocialChannel,
      aggressiveness: a.aggressiveness as Aggressiveness,
      postsPerWeek: a.posts_per_week, // Use actual posts_per_week from database (includes manual override)
      contentTypeRatio: a.content_type_ratio as Record<string, number> | undefined,
      formatRatio: a.format_ratio as Record<string, number> | undefined,
      postingSchedule: a.posting_schedule as Record<string, string[]> | undefined,
    }));

    const slots = calculatePostDistribution(
      campaign.objective as CampaignObjectiveId,
      adsetInputs,
      startDate,
      endDate
    );

    if (slots.length === 0) {
      return NextResponse.json({ error: 'No posts to generate — check ad set schedules' }, { status: 400 });
    }

    // Create content_posts records (status = idea)
    const postInserts = slots.map(slot => ({
      adset_id: slot.adsetId,
      campaign_id: campaignId,
      organization_id: campaign.organization_id,
      workspace_id: campaign.workspace_id,
      content_type: slot.contentType,
      content_type_name: slot.contentTypeName,
      objective: campaign.objective,
      platform: slot.platform,
      format: slot.format,
      scheduled_date: slot.scheduledDate,
      scheduled_time: slot.scheduledTime,
      generation_week: slot.generationWeek,
      status: 'idea' as const,
      performance: {} as unknown as Json,
    }));

    const { data: createdPosts, error: insertError } = await supabase
      .from('content_posts')
      .insert(postInserts)
      .select('id');

    if (insertError || !createdPosts) {
      return NextResponse.json({ error: insertError?.message || 'Failed to create posts' }, { status: 500 });
    }

    const postIds = createdPosts.map(p => p.id);

    // Enqueue batch generation
    const { batchId, totalItems } = await enqueueCampaignBatch(
      supabase as unknown as import('@supabase/supabase-js').SupabaseClient<Database>,
      {
        organizationId: campaign.organization_id,
        workspaceId: campaign.workspace_id,
        campaignId,
        adsetId: adsetId || adsets[0].id,
        userId: user.id,
        postIds,
        modelId: modelId || 'claude-sonnet-4',
        selectedBrandVariables,
        creativeDirection,
      },
      isSuperAdmin
    );

    // Update campaign status to active if still draft
    if (campaign.status === 'draft') {
      await supabase
        .from('campaigns')
        .update({ status: 'active', updated_at: new Date().toISOString() })
        .eq('id', campaignId);
    }

    return NextResponse.json({
      batchId,
      totalItems,
      postsCreated: postIds.length,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
