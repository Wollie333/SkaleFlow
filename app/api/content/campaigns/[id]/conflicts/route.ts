import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET — Check for scheduling conflicts across campaigns
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: campaignId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Get this campaign's posts
    const { data: campaignPosts } = await supabase
      .from('content_posts')
      .select('id, platform, scheduled_date, scheduled_time, objective')
      .eq('campaign_id', campaignId)
      .not('status', 'in', '("idea","rejected","archived")');

    if (!campaignPosts || campaignPosts.length === 0) {
      return NextResponse.json({ conflicts: [] });
    }

    // Get the org id from the campaign
    const { data: campaign } = await supabase
      .from('campaigns')
      .select('organization_id')
      .eq('id', campaignId)
      .single();

    if (!campaign) return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });

    // Find other posts on the same platform + date + time from other campaigns
    const { data: allOrgPosts } = await supabase
      .from('content_posts')
      .select('id, campaign_id, platform, scheduled_date, scheduled_time, objective')
      .eq('organization_id', campaign.organization_id)
      .neq('campaign_id', campaignId)
      .not('status', 'in', '("idea","rejected","archived")');

    const conflicts: Array<{
      postId: string;
      conflictingPostId: string;
      platform: string;
      date: string;
      time: string;
      type: string;
    }> = [];

    for (const post of campaignPosts) {
      for (const other of (allOrgPosts || [])) {
        if (
          post.platform === other.platform &&
          post.scheduled_date === other.scheduled_date &&
          post.scheduled_time === other.scheduled_time
        ) {
          conflicts.push({
            postId: post.id,
            conflictingPostId: other.id,
            platform: post.platform,
            date: post.scheduled_date || '',
            time: post.scheduled_time || '',
            type: 'time_conflict',
          });
        }
      }
    }

    return NextResponse.json({ conflicts });
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
