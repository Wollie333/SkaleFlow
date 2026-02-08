import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  _request: NextRequest,
  { params }: { params: { contentItemId: string } }
) {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: membership } = await supabase
    .from('org_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .single();

  if (!membership) {
    return NextResponse.json({ error: 'No organization found' }, { status: 404 });
  }

  // Get all published posts for this content item with analytics
  const { data: publishedPosts, error } = await supabase
    .from('published_posts')
    .select(`
      id,
      platform,
      platform_post_id,
      post_url,
      published_at,
      publish_status,
      error_message,
      post_analytics (
        likes,
        comments,
        shares,
        saves,
        impressions,
        reach,
        clicks,
        video_views,
        engagement_rate,
        synced_at
      )
    `)
    .eq('content_item_id', params.contentItemId)
    .eq('organization_id', membership.organization_id)
    .order('published_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ publishedPosts });
}
