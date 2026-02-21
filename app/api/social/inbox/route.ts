import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sanitizeSearch } from '@/lib/sanitize-search';

// GET /api/social/inbox - Fetch interactions with filtering
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's organization
    const { data: membership } = await supabase
      .from('org_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .single();

    if (!membership?.organization_id) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    const orgId = membership.organization_id;
    const { searchParams } = new URL(request.url);

    const type = searchParams.get('type') || 'all';
    const platform = searchParams.get('platform') || 'all';
    const sentiment = searchParams.get('sentiment') || 'all';
    const status = searchParams.get('status') || 'all';
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = (page - 1) * limit;

    // Build query
    let query = supabase
      .from('social_interactions')
      .select('*', { count: 'exact' })
      .eq('organization_id', orgId)
      .neq('interaction_type', 'reply') // Exclude our own replies from the list
      .order('interaction_timestamp', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (type !== 'all') {
      query = query.eq('interaction_type', type);
    }

    if (platform !== 'all') {
      query = query.eq('platform', platform);
    }

    if (sentiment !== 'all') {
      query = query.eq('sentiment', sentiment);
    }

    if (status === 'unread') {
      query = query.eq('is_read', false);
    } else if (status === 'read') {
      query = query.eq('is_read', true);
    }

    if (search) {
      const s = sanitizeSearch(search);
      query = query.or(`message.ilike.%${s}%,author_name.ilike.%${s}%,author_username.ilike.%${s}%`);
    }

    const { data: interactions, error, count } = await query;

    if (error) {
      console.error('Error fetching interactions:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Get unread counts per platform
    const { data: unreadCounts } = await supabase
      .from('social_interactions')
      .select('platform')
      .eq('organization_id', orgId)
      .eq('is_read', false)
      .neq('interaction_type', 'reply');

    const platformUnreadCounts: Record<string, number> = {};
    let totalUnread = 0;
    if (unreadCounts) {
      for (const row of unreadCounts) {
        platformUnreadCounts[row.platform] = (platformUnreadCounts[row.platform] || 0) + 1;
        totalUnread++;
      }
    }

    // Get connected platforms
    const { data: connections } = await supabase
      .from('social_media_connections')
      .select('id, platform, platform_username, platform_page_name, is_active')
      .eq('organization_id', orgId)
      .eq('is_active', true);

    // For selected interaction, get thread replies
    const selectedId = searchParams.get('selected');
    let thread: any[] = [];
    if (selectedId) {
      const { data: threadData } = await supabase
        .from('social_interactions')
        .select('*')
        .eq('parent_interaction_id', selectedId)
        .order('interaction_timestamp', { ascending: true });

      thread = threadData || [];
    }

    return NextResponse.json({
      interactions: interactions || [],
      thread,
      total: count || 0,
      page,
      limit,
      unreadCounts: platformUnreadCounts,
      totalUnread,
      connections: connections || [],
    });
  } catch (error: any) {
    console.error('Error in GET /api/social/inbox:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH /api/social/inbox - Mark interaction as read/unread, assign, flag
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { interactionId, isRead, assignedTo, isFlagged } = body;

    if (!interactionId) {
      return NextResponse.json({ error: 'Interaction ID required' }, { status: 400 });
    }

    // Build update object
    const updates: any = {
      updated_at: new Date().toISOString(),
    };

    if (typeof isRead === 'boolean') {
      updates.is_read = isRead;
    }

    if (assignedTo !== undefined) {
      updates.assigned_to = assignedTo;
    }

    if (typeof isFlagged === 'boolean') {
      updates.is_flagged = isFlagged;
    }

    // Update interaction
    const { data, error } = await supabase
      .from('social_interactions')
      .update(updates)
      .eq('id', interactionId)
      .select()
      .single();

    if (error) {
      console.error('Error updating interaction:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error: any) {
    console.error('Error in PATCH /api/social/inbox:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
