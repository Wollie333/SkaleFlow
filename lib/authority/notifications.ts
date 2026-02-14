import { createServiceClient } from '@/lib/supabase/server';
import type { AuthorityNotificationType } from '@/types/database';

interface NotifyParams {
  orgId: string;
  userId: string;
  type: AuthorityNotificationType;
  title: string;
  message: string;
  cardId?: string;
  contactId?: string;
  questId?: string;
}

export async function createAuthorityNotification(params: NotifyParams) {
  const supabase = createServiceClient();

  const { error } = await supabase.from('authority_notifications').insert({
    organization_id: params.orgId,
    user_id: params.userId,
    notification_type: params.type,
    title: params.title,
    message: params.message,
    card_id: params.cardId || null,
    contact_id: params.contactId || null,
    quest_id: params.questId || null,
  });

  return !error;
}

export async function notifyOrgAdmins(orgId: string, type: AuthorityNotificationType, title: string, message: string, extra?: { cardId?: string; contactId?: string }) {
  const supabase = createServiceClient();

  // Get org owners/admins
  const { data: members } = await supabase
    .from('org_members')
    .select('user_id')
    .eq('organization_id', orgId)
    .in('role', ['owner', 'admin']);

  for (const m of members || []) {
    await createAuthorityNotification({
      orgId,
      userId: m.user_id,
      type,
      title,
      message,
      cardId: extra?.cardId,
      contactId: extra?.contactId,
    });
  }
}

/**
 * Process scheduled notifications:
 * - Follow-ups due (cards at Pitched/In Discussion with no activity for 7 days)
 * - Deadline approaching (submission deadline within 3 days)
 * - Embargo lifting (embargo date within 1 day)
 * - Payment overdue (payment_due_date passed)
 */
export async function processAuthorityNotifications() {
  const supabase = createServiceClient();
  const now = new Date();
  const threeDaysFromNow = new Date(now.getTime() + 3 * 86400000).toISOString().slice(0, 10);
  const oneDayFromNow = new Date(now.getTime() + 1 * 86400000).toISOString().slice(0, 10);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000).toISOString();
  const today = now.toISOString().slice(0, 10);

  // 1. Follow-ups due: cards at pitched/in_discussion with no updates for 7 days
  const { data: staleCards } = await supabase
    .from('authority_pipeline_cards')
    .select(`
      id, organization_id, opportunity_name, updated_at,
      authority_pipeline_stages(slug)
    `)
    .lt('updated_at', sevenDaysAgo)
    .in('authority_pipeline_stages.slug', ['pitched', 'in_discussion']);

  for (const card of staleCards || []) {
    const stage = card.authority_pipeline_stages as { slug: string } | null;
    if (!stage || !['pitched', 'in_discussion'].includes(stage.slug)) continue;

    // Check if we already sent this notification recently
    const { count } = await supabase
      .from('authority_notifications')
      .select('id', { count: 'exact', head: true })
      .eq('card_id', card.id)
      .eq('notification_type', 'follow_up_due')
      .gte('created_at', sevenDaysAgo);

    if ((count || 0) === 0) {
      await notifyOrgAdmins(
        card.organization_id,
        'follow_up_due',
        `Follow up: ${card.opportunity_name}`,
        `No activity for 7+ days on "${card.opportunity_name}". Consider following up.`,
        { cardId: card.id }
      );
    }
  }

  // 2. Submission deadlines approaching (within 3 days)
  const { data: deadlineCards } = await supabase
    .from('authority_pipeline_cards')
    .select('id, organization_id, opportunity_name, submission_deadline')
    .not('submission_deadline', 'is', null)
    .gte('submission_deadline', today)
    .lte('submission_deadline', threeDaysFromNow);

  for (const card of deadlineCards || []) {
    const { count } = await supabase
      .from('authority_notifications')
      .select('id', { count: 'exact', head: true })
      .eq('card_id', card.id)
      .eq('notification_type', 'deadline_approaching')
      .gte('created_at', new Date(now.getTime() - 3 * 86400000).toISOString());

    if ((count || 0) === 0) {
      await notifyOrgAdmins(
        card.organization_id,
        'deadline_approaching',
        `Deadline approaching: ${card.opportunity_name}`,
        `Submission deadline for "${card.opportunity_name}" is ${card.submission_deadline}.`,
        { cardId: card.id }
      );
    }
  }

  // 3. Embargo lifting (within 1 day)
  const { data: embargoCards } = await supabase
    .from('authority_pipeline_cards')
    .select('id, organization_id, opportunity_name, embargo_date')
    .eq('embargo_active', true)
    .not('embargo_date', 'is', null)
    .gte('embargo_date', today)
    .lte('embargo_date', oneDayFromNow);

  for (const card of embargoCards || []) {
    const { count } = await supabase
      .from('authority_notifications')
      .select('id', { count: 'exact', head: true })
      .eq('card_id', card.id)
      .eq('notification_type', 'embargo_lifting')
      .gte('created_at', new Date(now.getTime() - 1 * 86400000).toISOString());

    if ((count || 0) === 0) {
      await notifyOrgAdmins(
        card.organization_id,
        'embargo_lifting',
        `Embargo lifts soon: ${card.opportunity_name}`,
        `Embargo for "${card.opportunity_name}" lifts on ${card.embargo_date}. Prepare amplification.`,
        { cardId: card.id }
      );
    }
  }

  // 4. Payment overdue
  const { data: overduePayments } = await supabase
    .from('authority_commercial')
    .select('id, card_id, organization_id, payment_due_date, authority_pipeline_cards(opportunity_name)')
    .eq('payment_status', 'invoiced')
    .not('payment_due_date', 'is', null)
    .lt('payment_due_date', today);

  for (const payment of overduePayments || []) {
    const cardName = (payment.authority_pipeline_cards as { opportunity_name: string } | null)?.opportunity_name || 'Unknown';

    const { count } = await supabase
      .from('authority_notifications')
      .select('id', { count: 'exact', head: true })
      .eq('card_id', payment.card_id)
      .eq('notification_type', 'payment_overdue')
      .gte('created_at', sevenDaysAgo);

    if ((count || 0) === 0) {
      await notifyOrgAdmins(
        payment.organization_id,
        'payment_overdue',
        `Payment overdue: ${cardName}`,
        `Payment for "${cardName}" was due on ${payment.payment_due_date}.`,
        { cardId: payment.card_id }
      );
    }
  }

  return { processed: true };
}
