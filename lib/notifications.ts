import { SupabaseClient } from '@supabase/supabase-js';
import type { Database, NotificationType } from '@/types/database';
import { sendNotificationEmail } from '@/lib/resend';

type ServiceClient = SupabaseClient<Database>;

interface CreateNotificationParams {
  supabase: ServiceClient;
  userId: string;
  orgId: string;
  type: NotificationType;
  title: string;
  body?: string;
  link?: string;
  metadata?: Record<string, unknown>;
}

export async function createNotification({
  supabase,
  userId,
  orgId,
  type,
  title,
  body,
  link,
  metadata,
}: CreateNotificationParams) {
  const { error } = await supabase.from('notifications').insert({
    user_id: userId,
    organization_id: orgId,
    type,
    title,
    body: body || null,
    link: link || null,
    metadata: (metadata || {}) as Database['public']['Tables']['notifications']['Insert']['metadata'],
  });

  if (error) {
    console.error('Failed to create notification:', error);
    return;
  }

  // Send email notification (non-blocking, behind flag)
  if (process.env.ENABLE_NOTIFICATION_EMAILS === 'true') {
    const { data: userData } = await supabase
      .from('users')
      .select('email, full_name')
      .eq('id', userId)
      .single();

    if (userData?.email) {
      sendNotificationEmail({
        to: userData.email,
        title,
        body: body || '',
        link: link ? `${process.env.NEXT_PUBLIC_APP_URL || ''}${link}` : undefined,
      }).catch(err => console.error('Notification email failed:', err));
    }
  }
}

interface NotifyApproversParams {
  supabase: ServiceClient;
  orgId: string;
  contentItem: { id: string; topic?: string | null; format: string };
  submitterName?: string;
}

export async function notifyApprovers({
  supabase,
  orgId,
  contentItem,
  submitterName,
}: NotifyApproversParams) {
  // Find all org members with approval roles (owner, admin)
  const { data: approvers } = await supabase
    .from('org_members')
    .select('user_id')
    .eq('organization_id', orgId)
    .in('role', ['owner', 'admin']);

  if (!approvers || approvers.length === 0) return;

  const contentName = contentItem.topic || contentItem.format.replace(/_/g, ' ');
  const title = 'Content submitted for review';
  const body = submitterName
    ? `${submitterName} submitted "${contentName}" for your review.`
    : `"${contentName}" has been submitted for review.`;

  for (const approver of approvers) {
    await createNotification({
      supabase,
      userId: approver.user_id,
      orgId,
      type: 'content_submitted',
      title,
      body,
      link: `/calendar?item=${contentItem.id}`,
      metadata: { content_item_id: contentItem.id },
    });
  }
}

interface NotifyCreatorParams {
  supabase: ServiceClient;
  orgId: string;
  contentItem: { id: string; topic?: string | null; format: string; assigned_to?: string | null };
  action: 'approved' | 'rejected' | 'revision_requested';
  reviewerName?: string;
  comment?: string;
}

export async function notifyCreator({
  supabase,
  orgId,
  contentItem,
  action,
  reviewerName,
  comment,
}: NotifyCreatorParams) {
  if (!contentItem.assigned_to) return;

  const contentName = contentItem.topic || contentItem.format.replace(/_/g, ' ');
  const reviewer = reviewerName || 'A reviewer';

  const config: Record<string, { type: NotificationType; title: string; body: string }> = {
    approved: {
      type: 'content_approved',
      title: 'Content approved',
      body: `${reviewer} approved "${contentName}".${comment ? ` Comment: ${comment}` : ''}`,
    },
    rejected: {
      type: 'content_rejected',
      title: 'Content rejected',
      body: `${reviewer} rejected "${contentName}".${comment ? ` Reason: ${comment}` : ''}`,
    },
    revision_requested: {
      type: 'revision_requested',
      title: 'Revisions requested',
      body: `${reviewer} requested changes to "${contentName}".${comment ? ` Feedback: ${comment}` : ''}`,
    },
  };

  const { type, title, body } = config[action];

  await createNotification({
    supabase,
    userId: contentItem.assigned_to,
    orgId,
    type,
    title,
    body,
    link: `/calendar?item=${contentItem.id}`,
    metadata: {
      content_item_id: contentItem.id,
      reviewer_name: reviewerName,
      comment,
    },
  });
}

/**
 * Notify a specific team member.
 */
export async function notifyTeamMember(
  supabase: ServiceClient,
  userId: string,
  orgId: string,
  type: NotificationType,
  title: string,
  body: string,
  link?: string,
  metadata?: Record<string, unknown>
) {
  await createNotification({ supabase, userId, orgId, type, title, body, link, metadata });
}

/**
 * Notify all org owners and admins.
 */
export async function notifyOrgAdmins(
  supabase: ServiceClient,
  orgId: string,
  type: NotificationType,
  title: string,
  body: string,
  link?: string,
  metadata?: Record<string, unknown>
) {
  const { data: admins } = await supabase
    .from('org_members')
    .select('user_id')
    .eq('organization_id', orgId)
    .in('role', ['owner', 'admin']);

  if (!admins || admins.length === 0) return;

  for (const admin of admins) {
    await createNotification({
      supabase,
      userId: admin.user_id,
      orgId,
      type,
      title,
      body,
      link,
      metadata,
    });
  }
}
