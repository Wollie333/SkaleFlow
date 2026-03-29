import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isWorkspaceAdmin, isOrgOwnerOrAdmin } from '@/lib/permissions';

// GET - Fetch time tracking data for workspace
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current workspace ID from user's current workspace
    const { data: currentWorkspace } = await supabase
      .from('workspace_members')
      .select('workspace_id, workspaces(organization_id)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!currentWorkspace) {
      return NextResponse.json({ error: 'No workspace found' }, { status: 404 });
    }

    const workspaceId = currentWorkspace.workspace_id;
    const orgId = (currentWorkspace.workspaces as any)?.organization_id;

    // Check if user is admin
    const isAdmin = await isWorkspaceAdmin(workspaceId, user.id);
    const isOrgAdmin = orgId ? await isOrgOwnerOrAdmin(orgId, user.id) : false;

    if (!isAdmin && !isOrgAdmin) {
      return NextResponse.json(
        { error: 'Forbidden: Only admins can view time tracking' },
        { status: 403 }
      );
    }

    // Get date range from query params
    const searchParams = req.nextUrl.searchParams;
    const range = searchParams.get('range') || '7days';

    // Calculate date filter
    let dateFilter = new Date();
    switch (range) {
      case 'today':
        dateFilter.setHours(0, 0, 0, 0);
        break;
      case '7days':
        dateFilter.setDate(dateFilter.getDate() - 7);
        break;
      case '30days':
        dateFilter.setDate(dateFilter.getDate() - 30);
        break;
      case '90days':
        dateFilter.setDate(dateFilter.getDate() - 90);
        break;
      default:
        dateFilter.setDate(dateFilter.getDate() - 7);
    }

    // Fetch user sessions
    const { data: sessions } = await supabase
      .from('user_sessions')
      .select(`
        *,
        users(id, full_name, email, avatar_url)
      `)
      .eq('workspace_id', workspaceId)
      .gte('started_at', dateFilter.toISOString())
      .order('started_at', { ascending: false });

    // Fetch post time entries
    const { data: postTimeEntries } = await supabase
      .from('post_time_entries')
      .select(`
        *,
        users(id, full_name, email, avatar_url),
        content_posts(topic, content_type)
      `)
      .eq('workspace_id', workspaceId)
      .gte('started_at', dateFilter.toISOString())
      .order('started_at', { ascending: false });

    // Calculate stats
    const completedSessions = (sessions || []).filter(s => s.ended_at !== null);
    const totalDuration = completedSessions.reduce((sum, s) => sum + (s.duration_seconds || 0), 0);
    const averageSessionDuration = completedSessions.length > 0
      ? Math.floor(totalDuration / completedSessions.length)
      : 0;

    const completedPostEntries = (postTimeEntries || []).filter(e => e.ended_at !== null);
    const totalPostDuration = completedPostEntries.reduce((sum, e) => sum + (e.duration_seconds || 0), 0);

    const uniqueUsers = new Set((sessions || []).map(s => s.user_id));

    const stats = {
      totalSessions: sessions?.length || 0,
      totalDuration,
      averageSessionDuration,
      totalPostTimeEntries: postTimeEntries?.length || 0,
      totalPostDuration,
      activeUsers: uniqueUsers.size,
    };

    return NextResponse.json({
      sessions: sessions || [],
      postTimeEntries: postTimeEntries || [],
      stats,
    });
  } catch (error) {
    console.error('[time-tracking] GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
