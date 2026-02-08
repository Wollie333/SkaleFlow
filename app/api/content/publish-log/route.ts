import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { PublishStatus, SocialPlatform } from '@/types/database';

export async function GET(request: NextRequest) {
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

  const searchParams = request.nextUrl.searchParams;
  const statusFilter = searchParams.get('status');
  const platformFilter = searchParams.get('platform');
  const dateFrom = searchParams.get('dateFrom');
  const dateTo = searchParams.get('dateTo');

  let query = supabase
    .from('published_posts')
    .select(`
      id,
      content_item_id,
      platform,
      platform_post_id,
      post_url,
      published_at,
      publish_status,
      error_message,
      retry_count,
      metadata,
      created_at,
      content_items (
        topic,
        hook,
        caption,
        format,
        scheduled_date,
        scheduled_time
      )
    `)
    .eq('organization_id', membership.organization_id)
    .order('created_at', { ascending: false });

  if (statusFilter && statusFilter !== 'all') {
    query = query.eq('publish_status', statusFilter as PublishStatus);
  }

  if (platformFilter && platformFilter !== 'all') {
    query = query.eq('platform', platformFilter as SocialPlatform);
  }

  if (dateFrom) {
    query = query.gte('created_at', `${dateFrom}T00:00:00`);
  }

  if (dateTo) {
    query = query.lte('created_at', `${dateTo}T23:59:59`);
  }

  const { data, error } = await query.limit(200);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ records: data || [] });
}
