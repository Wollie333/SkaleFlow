import { createServiceClient } from '@/lib/supabase/server';
import { checkCredits, deductCredits, isSuperAdmin } from '@/lib/ai/credits';
import { isOrgOwnerOrAdmin } from '@/lib/permissions';
import { createNotification } from '@/lib/notifications';
import type { FeatureType } from '@/types/database';

interface TeamCreditBalance {
  remaining: number;
  allocated: number;
  hasCredits: boolean;
}

/**
 * Check team member's credit allocation for a feature.
 * Owner/admin use org pool directly; team members use their allocation.
 */
export async function checkTeamCredits(
  orgId: string,
  userId: string,
  feature: FeatureType,
  required: number = 0
): Promise<TeamCreditBalance> {
  // Super admins bypass all
  if (await isSuperAdmin(userId)) {
    return { remaining: 999999, allocated: 999999, hasCredits: true };
  }

  // Owner/admin use org pool directly
  if (await isOrgOwnerOrAdmin(orgId, userId)) {
    const orgBalance = await checkCredits(orgId, required, userId);
    return {
      remaining: orgBalance.totalRemaining,
      allocated: orgBalance.totalRemaining,
      hasCredits: orgBalance.hasCredits,
    };
  }

  // Team member — check their allocation
  const supabase = createServiceClient();
  const { data } = await supabase
    .from('team_credit_allocations')
    .select('credits_allocated, credits_remaining')
    .eq('organization_id', orgId)
    .eq('user_id', userId)
    .eq('feature', feature)
    .single();

  if (!data) {
    return { remaining: 0, allocated: 0, hasCredits: required === 0 };
  }

  return {
    remaining: data.credits_remaining,
    allocated: data.credits_allocated,
    hasCredits: data.credits_remaining >= required,
  };
}

/**
 * Deduct credits for a team member.
 * Owner/admin → deduct from org pool (existing flow).
 * Team member → deduct from their feature allocation.
 */
export async function deductTeamCredits(
  orgId: string,
  userId: string,
  feature: FeatureType,
  amount: number,
  description: string,
  aiUsageId: string | null = null
): Promise<void> {
  if (amount <= 0) return;

  // Owner/admin (including super admins) use org pool
  if (await isOrgOwnerOrAdmin(orgId, userId)) {
    await deductCredits(orgId, userId, amount, aiUsageId, description);
    return;
  }

  // Team member — deduct from allocation
  const supabase = createServiceClient();
  const { data: allocation } = await supabase
    .from('team_credit_allocations')
    .select('*')
    .eq('organization_id', orgId)
    .eq('user_id', userId)
    .eq('feature', feature)
    .single();

  if (!allocation) return;

  const newRemaining = Math.max(0, allocation.credits_remaining - amount);

  await supabase
    .from('team_credit_allocations')
    .update({
      credits_remaining: newRemaining,
      updated_at: new Date().toISOString(),
    })
    .eq('id', allocation.id);

  // Log transaction on the org level too
  await supabase
    .from('credit_transactions')
    .insert({
      organization_id: orgId,
      user_id: userId,
      transaction_type: 'ai_usage_deduction',
      credits_amount: -amount,
      credits_before: allocation.credits_remaining,
      credits_after: newRemaining,
      source: `team_${feature}`,
      description: `[Team] ${description}`,
      ai_usage_id: aiUsageId,
    });

  // Check if credits are low (< 20%)
  const threshold = allocation.credits_allocated * 0.2;
  if (newRemaining > 0 && newRemaining < threshold) {
    // Notify the team member
    await createNotification({
      supabase,
      userId,
      orgId,
      type: 'credits_low',
      title: 'Credits running low',
      body: `Your ${feature.replace('_', ' ')} credits are below 20%. Contact your team admin for a top-up.`,
      link: '/team',
    });

    // Notify org owner/admins
    const { data: admins } = await supabase
      .from('org_members')
      .select('user_id')
      .eq('organization_id', orgId)
      .in('role', ['owner', 'admin']);

    if (admins) {
      const { data: memberUser } = await supabase
        .from('users')
        .select('full_name')
        .eq('id', userId)
        .single();

      for (const admin of admins) {
        await createNotification({
          supabase,
          userId: admin.user_id,
          orgId,
          type: 'credits_low',
          title: 'Team member credits low',
          body: `${memberUser?.full_name || 'A team member'}'s ${feature.replace('_', ' ')} credits are below 20%.`,
          link: '/team',
        });
      }
    }
  }
}

/**
 * Allocate credits to a team member for a specific feature.
 * Deducts from org pool and adds to member's allocation.
 */
export async function allocateCredits(
  orgId: string,
  allocatorUserId: string,
  targetUserId: string,
  feature: FeatureType,
  amount: number
): Promise<{ success: boolean; error?: string }> {
  if (amount <= 0) return { success: false, error: 'Amount must be positive' };

  // Check org has enough credits
  const orgBalance = await checkCredits(orgId, amount, allocatorUserId);
  if (!orgBalance.hasCredits) {
    return { success: false, error: `Insufficient org credits. Available: ${orgBalance.totalRemaining}` };
  }

  // Deduct from org pool
  await deductCredits(orgId, allocatorUserId, amount, null, `Team allocation to member for ${feature}`);

  // Add to member's allocation
  const supabase = createServiceClient();
  const { data: existing } = await supabase
    .from('team_credit_allocations')
    .select('*')
    .eq('organization_id', orgId)
    .eq('user_id', targetUserId)
    .eq('feature', feature)
    .single();

  if (existing) {
    await supabase
      .from('team_credit_allocations')
      .update({
        credits_allocated: existing.credits_allocated + amount,
        credits_remaining: existing.credits_remaining + amount,
        allocated_by: allocatorUserId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id);
  } else {
    await supabase
      .from('team_credit_allocations')
      .insert({
        organization_id: orgId,
        user_id: targetUserId,
        feature,
        credits_allocated: amount,
        credits_remaining: amount,
        allocated_by: allocatorUserId,
      });
  }

  // Notify team member
  await createNotification({
    supabase,
    userId: targetUserId,
    orgId,
    type: 'credits_allocated',
    title: 'Credits allocated',
    body: `You've been allocated ${amount} credits for ${feature.replace('_', ' ')}.`,
    link: '/team',
  });

  return { success: true };
}

/**
 * Reclaim unused credits from a team member back to the org pool.
 */
export async function reclaimCredits(
  orgId: string,
  ownerUserId: string,
  targetUserId: string,
  feature: FeatureType,
  amount: number
): Promise<{ success: boolean; error?: string }> {
  if (amount <= 0) return { success: false, error: 'Amount must be positive' };

  const supabase = createServiceClient();
  const { data: allocation } = await supabase
    .from('team_credit_allocations')
    .select('*')
    .eq('organization_id', orgId)
    .eq('user_id', targetUserId)
    .eq('feature', feature)
    .single();

  if (!allocation) {
    return { success: false, error: 'No allocation found' };
  }

  if (allocation.credits_remaining < amount) {
    return { success: false, error: `Only ${allocation.credits_remaining} credits available to reclaim` };
  }

  // Reduce member allocation
  await supabase
    .from('team_credit_allocations')
    .update({
      credits_allocated: allocation.credits_allocated - amount,
      credits_remaining: allocation.credits_remaining - amount,
      updated_at: new Date().toISOString(),
    })
    .eq('id', allocation.id);

  // Return to org pool (add as topup credits)
  const { data: balance } = await supabase
    .from('credit_balances')
    .select('*')
    .eq('organization_id', orgId)
    .single();

  if (balance) {
    const totalBefore = balance.monthly_credits_remaining + balance.topup_credits_remaining;
    await supabase
      .from('credit_balances')
      .update({
        topup_credits_remaining: balance.topup_credits_remaining + amount,
        updated_at: new Date().toISOString(),
      })
      .eq('organization_id', orgId);

    await supabase
      .from('credit_transactions')
      .insert({
        organization_id: orgId,
        user_id: ownerUserId,
        transaction_type: 'admin_adjustment',
        credits_amount: amount,
        credits_before: totalBefore,
        credits_after: totalBefore + amount,
        source: 'team_reclaim',
        description: `Reclaimed ${amount} credits from team member for ${feature}`,
      });
  }

  return { success: true };
}

/**
 * Get credit summary for all team members in an org.
 */
export async function getTeamCreditSummary(orgId: string) {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from('team_credit_allocations')
    .select('*, users:user_id(full_name, email)')
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false });

  return data || [];
}
