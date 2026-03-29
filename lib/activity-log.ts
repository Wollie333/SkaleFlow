import { createServiceClient } from '@/lib/supabase/server';

export interface ActivityLogData {
  workspace_id: string;
  actor_id: string;
  action: string;
  entity_type?: string;
  entity_id?: string;
  target_user_id?: string;
  duration_seconds?: number;
  old_value?: Record<string, unknown>;
  new_value?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

/**
 * Log an activity to the team activity log.
 * This function is used throughout the application to track team member actions.
 *
 * @param data - Activity log data
 *
 * @example
 * ```ts
 * await logActivity({
 *   workspace_id: post.workspace_id,
 *   actor_id: user.id,
 *   action: 'post_edited',
 *   entity_type: 'post',
 *   entity_id: post.id,
 *   old_value: { hook: 'Old hook' },
 *   new_value: { hook: 'New hook' },
 *   metadata: { changed_fields: ['hook'] }
 * });
 * ```
 */
export async function logActivity(data: ActivityLogData): Promise<void> {
  try {
    const supabase = createServiceClient();

    // Get organization_id from workspace
    const { data: workspace } = await supabase
      .from('workspaces')
      .select('organization_id')
      .eq('id', data.workspace_id)
      .single();

    if (!workspace) {
      console.error('[activity-log] Workspace not found:', data.workspace_id);
      return;
    }

    // Insert activity log entry
    const { error } = await supabase
      .from('team_activity_log')
      .insert({
        organization_id: workspace.organization_id,
        workspace_id: data.workspace_id,
        actor_id: data.actor_id,
        action: data.action,
        entity_type: data.entity_type || null,
        entity_id: data.entity_id || null,
        target_user_id: data.target_user_id || null,
        duration_seconds: data.duration_seconds || null,
        old_value: data.old_value || null,
        new_value: data.new_value || null,
        metadata: data.metadata || null,
      });

    if (error) {
      console.error('[activity-log] Failed to log activity:', error);
    }
  } catch (err) {
    console.error('[activity-log] Unexpected error:', err);
  }
}

/**
 * Log a post creation activity
 */
export async function logPostCreated(
  workspaceId: string,
  userId: string,
  postId: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  await logActivity({
    workspace_id: workspaceId,
    actor_id: userId,
    action: 'post_created',
    entity_type: 'post',
    entity_id: postId,
    metadata,
  });
}

/**
 * Log a post edit activity with before/after values
 */
export async function logPostEdited(
  workspaceId: string,
  userId: string,
  postId: string,
  oldValues: Record<string, unknown>,
  newValues: Record<string, unknown>,
  changedFields: string[]
): Promise<void> {
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

/**
 * Log a post status change activity
 */
export async function logPostStatusChanged(
  workspaceId: string,
  userId: string,
  postId: string,
  oldStatus: string,
  newStatus: string
): Promise<void> {
  await logActivity({
    workspace_id: workspaceId,
    actor_id: userId,
    action: 'post_status_changed',
    entity_type: 'post',
    entity_id: postId,
    old_value: { status: oldStatus },
    new_value: { status: newStatus },
    metadata: { old_status: oldStatus, new_status: newStatus },
  });
}

/**
 * Log a post deletion activity
 */
export async function logPostDeleted(
  workspaceId: string,
  userId: string,
  postId: string,
  postData: Record<string, unknown>
): Promise<void> {
  await logActivity({
    workspace_id: workspaceId,
    actor_id: userId,
    action: 'post_deleted',
    entity_type: 'post',
    entity_id: postId,
    old_value: postData,
  });
}

/**
 * Log a media upload activity
 */
export async function logMediaUploaded(
  workspaceId: string,
  userId: string,
  postId: string,
  mediaId: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  await logActivity({
    workspace_id: workspaceId,
    actor_id: userId,
    action: 'media_uploaded',
    entity_type: 'media',
    entity_id: mediaId,
    metadata: { post_id: postId, ...metadata },
  });
}

/**
 * Log approval request activity
 */
export async function logApprovalRequested(
  workspaceId: string,
  userId: string,
  postId: string,
  targetReviewers?: string[]
): Promise<void> {
  await logActivity({
    workspace_id: workspaceId,
    actor_id: userId,
    action: 'approval_requested',
    entity_type: 'post',
    entity_id: postId,
    metadata: { reviewers: targetReviewers },
  });
}

/**
 * Log approval granted activity
 */
export async function logApprovalGranted(
  workspaceId: string,
  reviewerId: string,
  postId: string,
  creatorId: string,
  comment?: string
): Promise<void> {
  await logActivity({
    workspace_id: workspaceId,
    actor_id: reviewerId,
    action: 'approval_granted',
    entity_type: 'post',
    entity_id: postId,
    target_user_id: creatorId,
    metadata: { comment },
  });
}

/**
 * Log approval denied activity
 */
export async function logApprovalDenied(
  workspaceId: string,
  reviewerId: string,
  postId: string,
  creatorId: string,
  reason?: string
): Promise<void> {
  await logActivity({
    workspace_id: workspaceId,
    actor_id: reviewerId,
    action: 'approval_denied',
    entity_type: 'post',
    entity_id: postId,
    target_user_id: creatorId,
    metadata: { reason },
  });
}

/**
 * Log revision requested activity
 */
export async function logRevisionRequested(
  workspaceId: string,
  reviewerId: string,
  postId: string,
  creatorId: string,
  feedback: string
): Promise<void> {
  await logActivity({
    workspace_id: workspaceId,
    actor_id: reviewerId,
    action: 'revision_requested',
    entity_type: 'post',
    entity_id: postId,
    target_user_id: creatorId,
    metadata: { feedback },
  });
}

/**
 * Log comment added activity
 */
export async function logCommentAdded(
  workspaceId: string,
  userId: string,
  postId: string,
  commentId: string,
  isReply: boolean,
  mentionedUsers?: string[]
): Promise<void> {
  await logActivity({
    workspace_id: workspaceId,
    actor_id: userId,
    action: 'comment_added',
    entity_type: 'post',
    entity_id: postId,
    metadata: {
      comment_id: commentId,
      is_reply: isReply,
      mentions: mentionedUsers,
    },
  });
}

/**
 * Log mention created activity
 */
export async function logMentionCreated(
  workspaceId: string,
  mentionerId: string,
  postId: string,
  mentionedUserId: string,
  commentId: string
): Promise<void> {
  await logActivity({
    workspace_id: workspaceId,
    actor_id: mentionerId,
    action: 'mention_created',
    entity_type: 'post',
    entity_id: postId,
    target_user_id: mentionedUserId,
    metadata: { comment_id: commentId },
  });
}
