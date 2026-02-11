import { createServiceClient } from '@/lib/supabase/server';
import { getModelConfig } from './providers/registry';

/**
 * Re-export client-safe utility functions.
 * These are defined in utils.ts to avoid server-only imports in client components.
 */
export { creditsToUSD, formatCreditsToUSD } from './utils';

/**
 * Check if a user has the super_admin role.
 * Super admins bypass all credit constraints.
 */
export async function isSuperAdmin(userId: string): Promise<boolean> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from('users')
    .select('role')
    .eq('id', userId)
    .single();
  return data?.role === 'super_admin';
}

// ZAR/USD exchange rate approximation (updated periodically)
const ZAR_PER_USD = 18.0;
// Markup multiplier: 2x actual cost
const MARKUP = 2.0;

/**
 * Calculate credit cost for an AI call.
 * 1 credit = 1 ZAR cent of marked-up cost.
 * Free models always return 0.
 */
export function calculateCreditCost(
  modelId: string,
  inputTokens: number,
  outputTokens: number
): number {
  const config = getModelConfig(modelId);
  if (!config || config.isFree) return 0;

  // Cost in USD
  const inputCostUSD = (inputTokens / 1_000_000) * config.inputPricePer1M;
  const outputCostUSD = (outputTokens / 1_000_000) * config.outputPricePer1M;
  const totalUSD = inputCostUSD + outputCostUSD;

  // Convert to ZAR cents with markup
  const zarCents = totalUSD * ZAR_PER_USD * 100 * MARKUP;

  // Round up to nearest credit (integer)
  return Math.ceil(zarCents);
}

/**
 * Estimate credit cost before an AI call (for pre-flight checks).
 */
export function estimateCreditCost(
  modelId: string,
  estInputTokens: number,
  estOutputTokens: number
): number {
  return calculateCreditCost(modelId, estInputTokens, estOutputTokens);
}

interface CreditBalance {
  monthlyRemaining: number;
  monthlyTotal: number;
  topupRemaining: number;
  totalRemaining: number;
  periodEnd: string | null;
  hasCredits: boolean;
  isSuperAdmin?: boolean;
  apiCostUSD?: number;
}

/**
 * Check current credit balance for an org.
 * Performs lazy monthly reset if period has expired.
 * If userId is provided and user is super_admin, returns real balance but always hasCredits=true.
 */
export async function checkCredits(
  orgId: string,
  requiredCredits: number = 0,
  userId?: string | null
): Promise<CreditBalance> {
  // Check super admin status (but still query real balance)
  let isAdmin = false;
  if (userId) {
    isAdmin = await isSuperAdmin(userId);
  }

  const supabase = createServiceClient();

  // Get current balance
  const { data: balance } = await supabase
    .from('credit_balances')
    .select('*')
    .eq('organization_id', orgId)
    .single();

  if (!balance) {
    return {
      monthlyRemaining: 0,
      monthlyTotal: 0,
      topupRemaining: 0,
      totalRemaining: 0,
      periodEnd: null,
      hasCredits: isAdmin || requiredCredits === 0,
      isSuperAdmin: isAdmin,
    };
  }

  // Lazy reset: if period has expired, reset monthly credits
  if (balance.period_end && new Date(balance.period_end) < new Date()) {
    await supabase.rpc('reset_monthly_credits', { p_org_id: orgId });

    // Re-fetch after reset
    const { data: refreshed } = await supabase
      .from('credit_balances')
      .select('*')
      .eq('organization_id', orgId)
      .single();

    if (refreshed) {
      const total = refreshed.monthly_credits_remaining + refreshed.topup_credits_remaining;
      return {
        monthlyRemaining: refreshed.monthly_credits_remaining,
        monthlyTotal: refreshed.monthly_credits_total,
        topupRemaining: refreshed.topup_credits_remaining,
        totalRemaining: total,
        periodEnd: refreshed.period_end,
        hasCredits: isAdmin || total >= requiredCredits,
        isSuperAdmin: isAdmin,
      };
    }
  }

  const total = balance.monthly_credits_remaining + balance.topup_credits_remaining;
  return {
    monthlyRemaining: balance.monthly_credits_remaining,
    monthlyTotal: balance.monthly_credits_total,
    topupRemaining: balance.topup_credits_remaining,
    totalRemaining: total,
    periodEnd: balance.period_end,
    hasCredits: isAdmin || total >= requiredCredits,
    isSuperAdmin: isAdmin,
  };
}

/**
 * Deduct credits from an org's balance.
 * Consumes monthly credits first (use-it-or-lose-it), then topup.
 * Super admins are never charged.
 */
export async function deductCredits(
  orgId: string,
  userId: string | null,
  credits: number,
  aiUsageId: string | null,
  description: string
): Promise<void> {
  if (credits <= 0) return;

  // Super admins bypass credit deduction
  if (userId) {
    const isAdmin = await isSuperAdmin(userId);
    if (isAdmin) return;
  }

  const supabase = createServiceClient();

  const { data: balance } = await supabase
    .from('credit_balances')
    .select('*')
    .eq('organization_id', orgId)
    .single();

  if (!balance) return;

  const totalBefore = balance.monthly_credits_remaining + balance.topup_credits_remaining;

  let monthlyDeduction = Math.min(credits, balance.monthly_credits_remaining);
  let topupDeduction = credits - monthlyDeduction;

  // Safety: don't deduct more than available
  if (topupDeduction > balance.topup_credits_remaining) {
    topupDeduction = balance.topup_credits_remaining;
  }

  const newMonthly = balance.monthly_credits_remaining - monthlyDeduction;
  const newTopup = balance.topup_credits_remaining - topupDeduction;
  const totalAfter = newMonthly + newTopup;

  // Update balance
  await supabase
    .from('credit_balances')
    .update({
      monthly_credits_remaining: newMonthly,
      topup_credits_remaining: newTopup,
      updated_at: new Date().toISOString(),
    })
    .eq('organization_id', orgId);

  // Log transaction
  await supabase
    .from('credit_transactions')
    .insert({
      organization_id: orgId,
      user_id: userId,
      transaction_type: 'ai_usage_deduction',
      credits_amount: -credits,
      credits_before: totalBefore,
      credits_after: totalAfter,
      source: description,
      description,
      ai_usage_id: aiUsageId,
    });
}

/**
 * Add top-up credits to an org's balance.
 */
export async function addTopupCredits(
  orgId: string,
  userId: string | null,
  credits: number,
  invoiceId: string | null,
  description: string
): Promise<void> {
  if (credits <= 0) return;

  const supabase = createServiceClient();

  // Ensure credit_balances row exists
  const { data: existing } = await supabase
    .from('credit_balances')
    .select('*')
    .eq('organization_id', orgId)
    .single();

  if (!existing) {
    // Create initial balance row
    await supabase
      .from('credit_balances')
      .insert({
        organization_id: orgId,
        monthly_credits_remaining: 0,
        monthly_credits_total: 0,
        topup_credits_remaining: credits,
      });

    await supabase
      .from('credit_transactions')
      .insert({
        organization_id: orgId,
        user_id: userId,
        transaction_type: 'topup_purchase',
        credits_amount: credits,
        credits_before: 0,
        credits_after: credits,
        source: 'topup',
        description,
        invoice_id: invoiceId,
      });
    return;
  }

  const totalBefore = existing.monthly_credits_remaining + existing.topup_credits_remaining;
  const newTopup = existing.topup_credits_remaining + credits;
  const totalAfter = existing.monthly_credits_remaining + newTopup;

  await supabase
    .from('credit_balances')
    .update({
      topup_credits_remaining: newTopup,
      updated_at: new Date().toISOString(),
    })
    .eq('organization_id', orgId);

  await supabase
    .from('credit_transactions')
    .insert({
      organization_id: orgId,
      user_id: userId,
      transaction_type: 'topup_purchase',
      credits_amount: credits,
      credits_before: totalBefore,
      credits_after: totalAfter,
      source: 'topup',
      description,
      invoice_id: invoiceId,
    });
}

/**
 * Initialize credit balance for a new subscription.
 */
export async function initializeCreditBalance(
  orgId: string,
  monthlyCredits: number
): Promise<void> {
  const supabase = createServiceClient();

  const now = new Date();
  const periodEnd = new Date(now);
  periodEnd.setMonth(periodEnd.getMonth() + 1);

  const { data: existing } = await supabase
    .from('credit_balances')
    .select('id')
    .eq('organization_id', orgId)
    .single();

  if (existing) {
    // Update existing
    await supabase
      .from('credit_balances')
      .update({
        monthly_credits_remaining: monthlyCredits,
        monthly_credits_total: monthlyCredits,
        period_start: now.toISOString(),
        period_end: periodEnd.toISOString(),
        updated_at: now.toISOString(),
      })
      .eq('organization_id', orgId);
  } else {
    // Create new
    await supabase
      .from('credit_balances')
      .insert({
        organization_id: orgId,
        monthly_credits_remaining: monthlyCredits,
        monthly_credits_total: monthlyCredits,
        topup_credits_remaining: 0,
        period_start: now.toISOString(),
        period_end: periodEnd.toISOString(),
      });
  }

  // Log allocation
  await supabase
    .from('credit_transactions')
    .insert({
      organization_id: orgId,
      transaction_type: 'monthly_allocation',
      credits_amount: monthlyCredits,
      credits_before: 0,
      credits_after: monthlyCredits,
      source: 'monthly',
      description: 'Initial monthly credit allocation for subscription',
    });
}
