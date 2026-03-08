import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET — Campaign detail with ad sets and post counts
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: campaign, error } = await supabase
      .from('campaigns')
      .select(`
        *,
        campaign_adsets (*),
        content_posts (id, status, content_type, platform, format, scheduled_date)
      `)
      .eq('id', id)
      .single();

    if (error || !campaign) {
      return NextResponse.json({ error: error?.message || 'Not found' }, { status: 404 });
    }

    // Aggregate post counts by status
    const posts = (campaign as Record<string, unknown>).content_posts as Array<{ status: string }> || [];
    const statusCounts: Record<string, number> = {};
    for (const p of posts) {
      statusCounts[p.status] = (statusCounts[p.status] || 0) + 1;
    }

    return NextResponse.json({
      campaign: {
        ...campaign,
        content_posts: undefined, // don't send full post list
        post_count: posts.length,
        status_counts: statusCounts,
      },
    });
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH — Update campaign
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, startDate, endDate, status } = body;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (name !== undefined) updates.name = name;
    if (startDate !== undefined) updates.start_date = startDate;
    if (endDate !== undefined) updates.end_date = endDate;
    if (status !== undefined) updates.status = status;

    const { data, error } = await supabase
      .from('campaigns')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ campaign: data });
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE — Archive campaign
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Check if draft — hard delete; otherwise archive
    const { data: campaign } = await supabase
      .from('campaigns')
      .select('status')
      .eq('id', id)
      .single();

    if (campaign?.status === 'draft') {
      await supabase.from('campaigns').delete().eq('id', id);
    } else {
      await supabase
        .from('campaigns')
        .update({ status: 'archived', updated_at: new Date().toISOString() })
        .eq('id', id);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
