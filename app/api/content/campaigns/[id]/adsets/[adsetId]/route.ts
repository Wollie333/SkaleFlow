import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { Json } from '@/types/database';

// PATCH — Update ad set (aggressiveness, ratios, schedule)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; adsetId: string }> }
) {
  try {
    const { adsetId } = await params;
    const body = await request.json();

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

    if (body.aggressiveness !== undefined) updates.aggressiveness = body.aggressiveness;
    if (body.posts_per_week !== undefined) updates.posts_per_week = body.posts_per_week;
    if (body.total_posts !== undefined) updates.total_posts = body.total_posts;
    if (body.content_type_ratio !== undefined) updates.content_type_ratio = body.content_type_ratio as Json;
    if (body.content_type_counts !== undefined) updates.content_type_counts = body.content_type_counts as Json;
    if (body.format_ratio !== undefined) updates.format_ratio = body.format_ratio as Json;
    if (body.posting_schedule !== undefined) updates.posting_schedule = body.posting_schedule as Json;
    if (body.status !== undefined) updates.status = body.status;

    const { data, error } = await supabase
      .from('campaign_adsets')
      .update(updates)
      .eq('id', adsetId)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ adset: data });
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE — Remove ad set
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; adsetId: string }> }
) {
  try {
    const { adsetId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await supabase.from('campaign_adsets').delete().eq('id', adsetId);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
