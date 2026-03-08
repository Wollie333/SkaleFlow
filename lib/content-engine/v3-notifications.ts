// ============================================================
// V3 Content Engine — Notification Integration
// Sends notifications for campaign lifecycle events
// ============================================================

import type { SupabaseClient } from '@supabase/supabase-js';
import { createNotification } from '@/lib/notifications';
import type { NotificationType } from '@/types/database';

// ---- Campaign lifecycle notifications ----

/**
 * Notify when a campaign is activated.
 */
export async function notifyCampaignActivated(
  supabase: SupabaseClient,
  campaignId: string,
  campaignName: string,
  orgId: string,
  activatedBy: string
): Promise<void> {
  // Get all org members
  const members = await getOrgMembers(supabase, orgId);

  for (const member of members) {
    if (member.user_id === activatedBy) continue; // Don't notify the person who did it
    await createNotification({
      supabase,
      userId: member.user_id,
      orgId,
      type: 'content_submitted' as NotificationType,
      title: `Campaign "${campaignName}" is now active`,
      body: 'Content generation has started. Posts will appear in the campaign table as they are generated.',
      link: `/content/campaigns/${campaignId}`,
    });
  }
}

/**
 * Notify when content generation completes for a campaign batch.
 */
export async function notifyCampaignGenerationComplete(
  supabase: SupabaseClient,
  campaignId: string,
  campaignName: string,
  orgId: string,
  userId: string,
  totalGenerated: number,
  totalFailed: number
): Promise<void> {
  await createNotification({
    supabase,
    userId,
    orgId,
    type: 'generation_completed' as NotificationType,
    title: `Campaign "${campaignName}" — ${totalGenerated} posts generated`,
    body: totalFailed > 0
      ? `${totalGenerated} posts generated successfully, ${totalFailed} failed. Review and edit your content.`
      : `All ${totalGenerated} posts generated successfully. Review and edit your content.`,
    link: `/content/campaigns/${campaignId}`,
  });
}

/**
 * Notify when a post is submitted for review.
 */
export async function notifyV3PostSubmitted(
  supabase: SupabaseClient,
  postId: string,
  campaignId: string,
  campaignName: string,
  orgId: string,
  submittedBy: string,
  postTopic: string
): Promise<void> {
  const members = await getOrgMembers(supabase, orgId);
  const approvers = members.filter(m => m.role === 'owner' || m.role === 'admin');

  for (const approver of approvers) {
    await createNotification({
      supabase,
      userId: approver.user_id,
      orgId,
      type: 'content_submitted' as NotificationType,
      title: `New post for review: ${postTopic || 'Untitled'}`,
      body: `A post from campaign "${campaignName}" has been submitted for review.`,
      link: `/content/campaigns/${campaignId}/posts/${postId}`,
    });
  }
}

/**
 * Notify when a post review decision is made.
 */
export async function notifyV3PostReviewed(
  supabase: SupabaseClient,
  postId: string,
  campaignId: string,
  orgId: string,
  creatorId: string,
  action: 'approved' | 'rejected' | 'revision_requested',
  postTopic: string,
  comment?: string
): Promise<void> {
  const typeMap: Record<string, NotificationType> = {
    approved: 'content_approved' as NotificationType,
    rejected: 'content_rejected' as NotificationType,
    revision_requested: 'revision_requested' as NotificationType,
  };

  const titleMap: Record<string, string> = {
    approved: `Post approved: ${postTopic || 'Untitled'}`,
    rejected: `Post rejected: ${postTopic || 'Untitled'}`,
    revision_requested: `Revision requested: ${postTopic || 'Untitled'}`,
  };

  await createNotification({
    supabase,
    userId: creatorId,
    orgId,
    type: typeMap[action],
    title: titleMap[action],
    body: comment || undefined,
    link: `/content/campaigns/${campaignId}/posts/${postId}`,
  });
}

/**
 * Notify when a winner is detected.
 */
export async function notifyWinnerDetected(
  supabase: SupabaseClient,
  orgId: string,
  campaignName: string,
  winnerCategory: string,
  postTopic: string,
  campaignId: string,
  postId: string
): Promise<void> {
  const members = await getOrgMembers(supabase, orgId);

  for (const member of members) {
    await createNotification({
      supabase,
      userId: member.user_id,
      orgId,
      type: 'content_approved' as NotificationType, // Reuse approval type for positive notification
      title: `Winner detected: ${postTopic || 'Untitled'}`,
      body: `A ${winnerCategory} winner was detected in campaign "${campaignName}". Consider recycling this content.`,
      link: `/content/campaigns/${campaignId}/posts/${postId}`,
    });
  }
}

/**
 * Notify when an adjustment recommendation is created.
 */
export async function notifyAdjustmentCreated(
  supabase: SupabaseClient,
  orgId: string,
  campaignId: string,
  campaignName: string,
  adjustmentTitle: string
): Promise<void> {
  const members = await getOrgMembers(supabase, orgId);
  const owners = members.filter(m => m.role === 'owner' || m.role === 'admin');

  for (const owner of owners) {
    await createNotification({
      supabase,
      userId: owner.user_id,
      orgId,
      type: 'content_submitted' as NotificationType,
      title: `Campaign adjustment: ${adjustmentTitle}`,
      body: `A new recommendation was generated for campaign "${campaignName}". Review and approve or dismiss.`,
      link: `/content/campaigns/${campaignId}`,
    });
  }
}

// ---- Helpers ----

async function getOrgMembers(
  supabase: SupabaseClient,
  orgId: string
): Promise<Array<{ user_id: string; role: string }>> {
  const { data } = await supabase
    .from('organization_members')
    .select('user_id, role')
    .eq('organization_id', orgId);

  return data || [];
}
