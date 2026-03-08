import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { recyclePost } from '@/lib/content-engine/recycling-engine';

// GET — Winner detail
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: winner, error } = await supabase
      .from('winner_pool')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !winner) {
      return NextResponse.json({ error: 'Winner not found' }, { status: 404 });
    }

    // Get the associated post
    const { data: post } = await supabase
      .from('content_posts')
      .select('*')
      .eq('id', winner.post_id)
      .single();

    return NextResponse.json({ winner, post });
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST — Recycle a winner into a target campaign
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { action, targetCampaignId, targetAdsetId } = body;

    if (action !== 'recycle') {
      return NextResponse.json({ error: 'Only "recycle" action is supported' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Get the winner entry
    const { data: winner, error: winError } = await supabase
      .from('winner_pool')
      .select('post_id, campaign_id, organization_id')
      .eq('id', id)
      .single();

    if (winError || !winner) {
      return NextResponse.json({ error: 'Winner not found' }, { status: 404 });
    }

    // If no target provided, recycle into same campaign
    const campId = targetCampaignId || winner.campaign_id;

    // Find a suitable adset if not provided
    let adsetId = targetAdsetId;
    if (!adsetId) {
      const { data: adsets } = await supabase
        .from('campaign_adsets')
        .select('id')
        .eq('campaign_id', campId)
        .eq('status', 'active')
        .limit(1);

      adsetId = adsets?.[0]?.id;
      if (!adsetId) {
        return NextResponse.json({ error: 'No active ad set found in target campaign' }, { status: 400 });
      }
    }

    const result = await recyclePost(supabase, winner.post_id, campId, adsetId);

    if (!result) {
      return NextResponse.json({ error: 'Failed to recycle post' }, { status: 500 });
    }

    return NextResponse.json({ recycledPostId: result.id });
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
