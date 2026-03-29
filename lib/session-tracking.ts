import { createServiceClient } from '@/lib/supabase/server';

/**
 * Start a new user session for time tracking
 *
 * @param userId - User ID
 * @param workspaceId - Workspace ID
 * @param orgId - Organization ID
 * @returns Session token to be stored in cookie
 */
export async function startSession(
  userId: string,
  workspaceId: string,
  orgId: string
): Promise<string | null> {
  try {
    const supabase = createServiceClient();
    const sessionToken = crypto.randomUUID();

    const { data: session, error } = await supabase
      .from('user_sessions')
      .insert({
        user_id: userId,
        workspace_id: workspaceId,
        organization_id: orgId,
        session_token: sessionToken,
        started_at: new Date().toISOString(),
        last_activity_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('[session-tracking] Failed to start session:', error);
      return null;
    }

    return sessionToken;
  } catch (err) {
    console.error('[session-tracking] Unexpected error starting session:', err);
    return null;
  }
}

/**
 * Update session activity timestamp (heartbeat)
 *
 * @param sessionToken - Session token from cookie
 */
export async function updateSessionActivity(sessionToken: string): Promise<void> {
  try {
    const supabase = createServiceClient();

    const { error } = await supabase
      .from('user_sessions')
      .update({
        last_activity_at: new Date().toISOString(),
        page_views: supabase.rpc('increment_page_views'),
      })
      .eq('session_token', sessionToken)
      .is('ended_at', null);

    if (error) {
      console.error('[session-tracking] Failed to update session activity:', error);
    }
  } catch (err) {
    console.error('[session-tracking] Unexpected error updating activity:', err);
  }
}

/**
 * End a user session and calculate duration
 *
 * @param sessionToken - Session token from cookie
 */
export async function endSession(sessionToken: string): Promise<void> {
  try {
    const supabase = createServiceClient();

    // Get session start time
    const { data: session } = await supabase
      .from('user_sessions')
      .select('started_at')
      .eq('session_token', sessionToken)
      .single();

    if (!session) {
      console.warn('[session-tracking] Session not found:', sessionToken);
      return;
    }

    const now = new Date();
    const duration = Math.floor(
      (now.getTime() - new Date(session.started_at).getTime()) / 1000
    );

    const { error } = await supabase
      .from('user_sessions')
      .update({
        ended_at: now.toISOString(),
        duration_seconds: duration,
      })
      .eq('session_token', sessionToken);

    if (error) {
      console.error('[session-tracking] Failed to end session:', error);
    }
  } catch (err) {
    console.error('[session-tracking] Unexpected error ending session:', err);
  }
}

/**
 * Get active session for a user
 *
 * @param userId - User ID
 * @returns Active session or null
 */
export async function getActiveSession(userId: string): Promise<{
  id: string;
  session_token: string;
  started_at: string;
} | null> {
  try {
    const supabase = createServiceClient();

    const { data: session } = await supabase
      .from('user_sessions')
      .select('id, session_token, started_at')
      .eq('user_id', userId)
      .is('ended_at', null)
      .order('started_at', { ascending: false })
      .limit(1)
      .single();

    return session || null;
  } catch (err) {
    console.error('[session-tracking] Error getting active session:', err);
    return null;
  }
}

/**
 * Start tracking time on a specific post
 *
 * @param postId - Post ID
 * @param userId - User ID
 * @param workspaceId - Workspace ID
 * @param orgId - Organization ID
 * @param activityType - Type of activity (editing, reviewing, etc.)
 * @param sessionId - Optional session ID to link to
 * @returns Time entry ID
 */
export async function startPostTimeEntry(
  postId: string,
  userId: string,
  workspaceId: string,
  orgId: string,
  activityType: 'editing' | 'reviewing' | 'uploading_media' | 'scheduling',
  sessionId?: string
): Promise<string | null> {
  try {
    const supabase = createServiceClient();

    const { data, error } = await supabase
      .from('post_time_entries')
      .insert({
        post_id: postId,
        user_id: userId,
        workspace_id: workspaceId,
        organization_id: orgId,
        session_id: sessionId || null,
        activity_type: activityType,
        started_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (error) {
      console.error('[session-tracking] Failed to start post time entry:', error);
      return null;
    }

    return data.id;
  } catch (err) {
    console.error('[session-tracking] Unexpected error starting post time entry:', err);
    return null;
  }
}

/**
 * End tracking time on a specific post
 *
 * @param timeEntryId - Time entry ID
 * @returns Duration in seconds
 */
export async function endPostTimeEntry(timeEntryId: string): Promise<number | null> {
  try {
    const supabase = createServiceClient();

    // Get entry start time
    const { data: entry } = await supabase
      .from('post_time_entries')
      .select('started_at')
      .eq('id', timeEntryId)
      .single();

    if (!entry) {
      console.warn('[session-tracking] Time entry not found:', timeEntryId);
      return null;
    }

    const now = new Date();
    const duration = Math.floor(
      (now.getTime() - new Date(entry.started_at).getTime()) / 1000
    );

    const { error } = await supabase
      .from('post_time_entries')
      .update({
        ended_at: now.toISOString(),
        duration_seconds: duration,
      })
      .eq('id', timeEntryId);

    if (error) {
      console.error('[session-tracking] Failed to end post time entry:', error);
      return null;
    }

    return duration;
  } catch (err) {
    console.error('[session-tracking] Unexpected error ending post time entry:', err);
    return null;
  }
}

/**
 * Get total time spent on a post by a user
 *
 * @param postId - Post ID
 * @param userId - User ID
 * @returns Total duration in seconds
 */
export async function getPostTimeByUser(
  postId: string,
  userId: string
): Promise<number> {
  try {
    const supabase = createServiceClient();

    const { data } = await supabase
      .from('post_time_entries')
      .select('duration_seconds')
      .eq('post_id', postId)
      .eq('user_id', userId)
      .not('duration_seconds', 'is', null);

    if (!data || data.length === 0) return 0;

    return data.reduce((total, entry) => total + (entry.duration_seconds || 0), 0);
  } catch (err) {
    console.error('[session-tracking] Error getting post time:', err);
    return 0;
  }
}

/**
 * Get total time spent by a user in a workspace
 *
 * @param workspaceId - Workspace ID
 * @param userId - User ID
 * @param startDate - Optional start date filter
 * @param endDate - Optional end date filter
 * @returns Total duration in seconds
 */
export async function getUserWorkspaceTime(
  workspaceId: string,
  userId: string,
  startDate?: Date,
  endDate?: Date
): Promise<number> {
  try {
    const supabase = createServiceClient();

    let query = supabase
      .from('user_sessions')
      .select('duration_seconds')
      .eq('workspace_id', workspaceId)
      .eq('user_id', userId)
      .not('duration_seconds', 'is', null);

    if (startDate) {
      query = query.gte('started_at', startDate.toISOString());
    }

    if (endDate) {
      query = query.lte('started_at', endDate.toISOString());
    }

    const { data } = await query;

    if (!data || data.length === 0) return 0;

    return data.reduce((total, session) => total + (session.duration_seconds || 0), 0);
  } catch (err) {
    console.error('[session-tracking] Error getting user workspace time:', err);
    return 0;
  }
}
