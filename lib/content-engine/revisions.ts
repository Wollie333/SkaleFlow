import { createServiceClient } from '@/lib/supabase/server';
import { logActivity } from '@/lib/activity-log';

/**
 * Create a revision snapshot of a post
 */
export async function createRevision(
  postId: string,
  userId: string,
  workspaceId: string,
  orgId: string,
  actionType: 'created' | 'edited' | 'status_changed' | 'media_changed' | 'schedule_changed' | 'reverted',
  changedFields: string[],
  triggeredBy: 'user' | 'ai_regeneration' | 'bulk_edit' | 'approval_workflow' | 'revert_to_revision' = 'user'
): Promise<string | null> {
  try {
    const supabase = createServiceClient();

    // Get current post state
    const { data: post } = await supabase
      .from('content_posts')
      .select('*')
      .eq('id', postId)
      .single();

    if (!post) {
      console.error('[revisions] Post not found:', postId);
      return null;
    }

    // Get current revision count
    const { count } = await supabase
      .from('post_revisions')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', postId);

    const revisionNumber = (count || 0) + 1;
    const changeSummary = generateChangeSummary(changedFields);

    // Create revision snapshot
    const { data: revision, error } = await supabase
      .from('post_revisions')
      .insert({
        post_id: postId,
        user_id: userId,
        workspace_id: workspaceId,
        organization_id: orgId,
        revision_number: revisionNumber,
        snapshot: post, // Full JSONB snapshot
        changed_fields: changedFields,
        change_summary: changeSummary,
        action_type: actionType,
        triggered_by: triggeredBy,
      })
      .select('id')
      .single();

    if (error) {
      console.error('[revisions] Failed to create revision:', error);
      return null;
    }

    return revision.id;
  } catch (err) {
    console.error('[revisions] Unexpected error:', err);
    return null;
  }
}

/**
 * Generate a human-readable summary of what changed
 */
function generateChangeSummary(changedFields: string[]): string {
  if (changedFields.length === 0) return 'Initial version';
  if (changedFields.length === 1) return `Updated ${changedFields[0]}`;
  if (changedFields.length <= 3) return `Updated ${changedFields.join(', ')}`;
  return `Updated ${changedFields.length} fields`;
}

/**
 * Track changes between old and new post states
 */
export async function trackPostChanges(
  postId: string,
  oldPost: any,
  newPost: any,
  userId: string,
  workspaceId: string,
  orgId: string
): Promise<void> {
  const fieldsToTrack = [
    'hook',
    'body',
    'cta',
    'caption',
    'hashtags',
    'visual_brief',
    'shot_suggestions',
    'slide_content',
    'on_screen_text',
    'video_script',
    'topic',
    'content_type',
    'format',
    'placement_type',
    'scheduled_date',
    'scheduled_time',
    'status',
    'assigned_to',
    'target_url',
    'utm_parameters',
  ];

  const changedFields: string[] = [];

  fieldsToTrack.forEach(field => {
    const oldValue = oldPost[field];
    const newValue = newPost[field];

    // Compare values (handle nulls and objects)
    if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
      changedFields.push(field);
    }
  });

  if (changedFields.length > 0) {
    await createRevision(
      postId,
      userId,
      workspaceId,
      orgId,
      'edited',
      changedFields,
      'user'
    );

    // Log the changes
    const oldValues: Record<string, unknown> = {};
    const newValues: Record<string, unknown> = {};
    changedFields.forEach(field => {
      oldValues[field] = oldPost[field];
      newValues[field] = newPost[field];
    });

    await logActivity({
      workspace_id: workspaceId,
      actor_id: userId,
      action: 'post_edited',
      entity_type: 'post',
      entity_id: postId,
      old_value: oldValues,
      new_value: newValues,
      metadata: { changed_fields: changedFields },
    });
  }
}

/**
 * Revert a post to a previous revision
 */
export async function revertToRevision(
  postId: string,
  revisionId: string,
  userId: string,
  workspaceId: string,
  orgId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createServiceClient();

    // Get revision snapshot
    const { data: revision } = await supabase
      .from('post_revisions')
      .select('*')
      .eq('id', revisionId)
      .eq('post_id', postId)
      .single();

    if (!revision) {
      return { success: false, error: 'Revision not found' };
    }

    // Get current post state for creating a new revision
    const { data: currentPost } = await supabase
      .from('content_posts')
      .select('*')
      .eq('id', postId)
      .single();

    if (!currentPost) {
      return { success: false, error: 'Post not found' };
    }

    // Extract snapshot data
    const snapshot = revision.snapshot as any;

    // Fields to revert (exclude immutable fields)
    const fieldsToRevert = [
      'hook',
      'body',
      'cta',
      'caption',
      'hashtags',
      'visual_brief',
      'shot_suggestions',
      'slide_content',
      'on_screen_text',
      'video_script',
      'topic',
      'content_type',
      'format',
      'placement_type',
      'scheduled_date',
      'scheduled_time',
      'target_url',
      'utm_parameters',
    ];

    // Build update object
    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    fieldsToRevert.forEach(field => {
      if (field in snapshot) {
        updates[field] = snapshot[field];
      }
    });

    // Update post with snapshot data
    const { error: updateError } = await supabase
      .from('content_posts')
      .update(updates)
      .eq('id', postId);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    // Create a new revision for the revert action
    await createRevision(
      postId,
      userId,
      workspaceId,
      orgId,
      'reverted',
      fieldsToRevert,
      'revert_to_revision'
    );

    // Log activity
    await logActivity({
      workspace_id: workspaceId,
      actor_id: userId,
      action: 'revision_reverted',
      entity_type: 'post',
      entity_id: postId,
      metadata: {
        reverted_to_revision: revisionId,
        revision_number: revision.revision_number,
      },
    });

    return { success: true };
  } catch (err) {
    console.error('[revisions] Revert error:', err);
    return { success: false, error: 'Internal server error' };
  }
}

/**
 * Get all revisions for a post
 */
export async function getPostRevisions(postId: string): Promise<any[]> {
  try {
    const supabase = createServiceClient();

    const { data: revisions } = await supabase
      .from('post_revisions')
      .select(`
        *,
        user:users(id, full_name, email, avatar_url)
      `)
      .eq('post_id', postId)
      .order('revision_number', { ascending: false });

    return revisions || [];
  } catch (err) {
    console.error('[revisions] Failed to get revisions:', err);
    return [];
  }
}

/**
 * Create a media revision entry
 */
export async function createMediaRevision(
  postId: string,
  mediaId: string | null,
  userId: string,
  workspaceId: string,
  orgId: string,
  action: 'uploaded' | 'replaced' | 'removed' | 'reordered',
  mediaSnapshot?: Record<string, unknown>
): Promise<void> {
  try {
    const supabase = createServiceClient();

    await supabase.from('media_revisions').insert({
      post_id: postId,
      media_id: mediaId,
      user_id: userId,
      workspace_id: workspaceId,
      organization_id: orgId,
      action,
      media_snapshot: mediaSnapshot || null,
    });

    // Log activity
    await logActivity({
      workspace_id: workspaceId,
      actor_id: userId,
      action: `media_${action}`,
      entity_type: 'media',
      entity_id: mediaId || postId,
      metadata: { post_id: postId, action },
    });
  } catch (err) {
    console.error('[revisions] Failed to create media revision:', err);
  }
}

/**
 * Get comparison between two revisions
 */
export async function compareRevisions(
  revisionId1: string,
  revisionId2: string
): Promise<{
  added: Record<string, unknown>;
  removed: Record<string, unknown>;
  changed: Record<string, { old: unknown; new: unknown }>;
} | null> {
  try {
    const supabase = createServiceClient();

    const { data: revisions } = await supabase
      .from('post_revisions')
      .select('snapshot, revision_number')
      .in('id', [revisionId1, revisionId2])
      .order('revision_number', { ascending: true });

    if (!revisions || revisions.length !== 2) {
      return null;
    }

    const [older, newer] = revisions;
    const oldSnapshot = older.snapshot as Record<string, unknown>;
    const newSnapshot = newer.snapshot as Record<string, unknown>;

    const added: Record<string, unknown> = {};
    const removed: Record<string, unknown> = {};
    const changed: Record<string, { old: unknown; new: unknown }> = {};

    // Find added and changed fields
    Object.keys(newSnapshot).forEach(key => {
      if (!(key in oldSnapshot)) {
        added[key] = newSnapshot[key];
      } else if (JSON.stringify(oldSnapshot[key]) !== JSON.stringify(newSnapshot[key])) {
        changed[key] = {
          old: oldSnapshot[key],
          new: newSnapshot[key],
        };
      }
    });

    // Find removed fields
    Object.keys(oldSnapshot).forEach(key => {
      if (!(key in newSnapshot)) {
        removed[key] = oldSnapshot[key];
      }
    });

    return { added, removed, changed };
  } catch (err) {
    console.error('[revisions] Failed to compare revisions:', err);
    return null;
  }
}
