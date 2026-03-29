import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { CONTENT_TYPES, type ContentTypeId } from '@/config/content-types';
import type { Json } from '@/types/database';

// POST — Manually create a new post
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      campaignId,
      adsetId,
      contentType,
      format,
      topic,
      hook,
      body: postBody,
      caption,
      scheduledDate,
      scheduledTime,
      status,
    } = body;

    if (!campaignId || !adsetId || !contentType || !format || !topic) {
      return NextResponse.json({
        error: 'campaignId, adsetId, contentType, format, and topic are required'
      }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Load campaign to get organization_id
    const { data: campaign } = await supabase
      .from('campaigns')
      .select('organization_id, workspace_id, objective')
      .eq('id', campaignId)
      .single();

    if (!campaign) return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });

    // Load adset to get platform
    const { data: adset } = await supabase
      .from('campaign_adsets')
      .select('channel')
      .eq('id', adsetId)
      .single();

    if (!adset) return NextResponse.json({ error: 'Adset not found' }, { status: 404 });

    // Get content type name
    const contentTypeConfig = CONTENT_TYPES[contentType as ContentTypeId];
    if (!contentTypeConfig) {
      return NextResponse.json({ error: 'Invalid content type' }, { status: 400 });
    }

    // Create post
    const { data: post, error: insertError } = await supabase
      .from('content_posts')
      .insert({
        campaign_id: campaignId,
        adset_id: adsetId,
        organization_id: campaign.organization_id,
        workspace_id: campaign.workspace_id,
        content_type: contentType,
        content_type_name: contentTypeConfig.name,
        objective: campaign.objective,
        platform: adset.channel,
        format,
        topic,
        hook: hook || null,
        body: postBody || null,
        caption: caption || null,
        scheduled_date: scheduledDate || null,
        scheduled_time: scheduledTime || null,
        status: status || 'scripted',
        ai_generated: false,
        performance: {} as unknown as Json,
      })
      .select()
      .single();

    if (insertError || !post) {
      return NextResponse.json({
        error: insertError?.message || 'Failed to create post'
      }, { status: 500 });
    }

    return NextResponse.json({ post });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
