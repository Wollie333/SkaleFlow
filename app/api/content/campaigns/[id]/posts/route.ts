import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET — List posts for a campaign (filterable)
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: campaignId } = await params;
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const contentType = searchParams.get('contentType');
    const platform = searchParams.get('platform');
    const adsetId = searchParams.get('adsetId');

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    let query = supabase
      .from('content_posts')
      .select('*')
      .eq('campaign_id', campaignId)
      .order('scheduled_date', { ascending: true })
      .order('scheduled_time', { ascending: true });

    if (status) query = query.eq('status', status);
    if (contentType) query = query.eq('content_type', parseInt(contentType));
    if (platform) query = query.eq('platform', platform);
    if (adsetId) query = query.eq('adset_id', adsetId);

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ posts: data });
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
