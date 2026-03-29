/**
 * SIMPLIFIED FEATURE GATE SYSTEM
 *
 * One function to check all permissions: canAccessFeature()
 *
 * Flow:
 * 1. Is super_admin? → YES
 * 2. Does tier include feature? → NO = reject
 * 3. Is owner/admin? → YES = full access
 * 4. Is member? → LIMITED access
 */

import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/server';

// ================================================
// TYPES
// ================================================

export type Feature =
  | 'brand_engine'
  | 'content_engine'
  | 'analytics'
  | 'team'
  | 'pipeline'
  | 'ad_campaigns';

export type AccessLevel = 'full' | 'limited' | 'none';

export interface FeatureAccessResult {
  allowed: boolean;
  level: AccessLevel;
  reason?: string;
  tier?: string;
  requiresUpgrade?: boolean;
}

interface TierFeatures {
  brand_engine?: boolean;
  content_engine?: boolean;
  analytics?: boolean;
  team?: boolean;
  pipeline?: boolean;
  ad_campaigns?: boolean;
}

// ================================================
// MAIN FUNCTION - ONE PERMISSION CHECK
// ================================================

/**
 * Check if a user can access a feature.
 * This is THE function to use everywhere.
 *
 * @param userId - User ID
 * @param orgId - Organization ID
 * @param feature - Feature to check
 * @param requireAdmin - Require owner/admin role (default: false)
 * @returns FeatureAccessResult
 */
export async function canAccessFeature(
  userId: string,
  orgId: string,
  feature: Feature,
  requireAdmin = false
): Promise<FeatureAccessResult> {
  const supabase = createServiceClient();

  // ================================================
  // STEP 1: Check if super admin (bypass everything)
  // ================================================
  const { data: user } = await supabase
    .from('users')
    .select('role')
    .eq('id', userId)
    .single();

  if (user?.role === 'super_admin') {
    return {
      allowed: true,
      level: 'full',
      reason: 'Super admin access',
      tier: 'Super Admin',
    };
  }

  // ================================================
  // STEP 2: Check org membership and role
  // ================================================
  const { data: membership } = await supabase
    .from('org_members')
    .select('role')
    .eq('organization_id', orgId)
    .eq('user_id', userId)
    .single();

  if (!membership) {
    return {
      allowed: false,
      level: 'none',
      reason: 'Not a member of this organization',
    };
  }

  const isAdmin = membership.role === 'owner' || membership.role === 'admin';

  // If admin is required and user is not admin, deny
  if (requireAdmin && !isAdmin) {
    return {
      allowed: false,
      level: 'none',
      reason: 'Admin access required',
    };
  }

  // ================================================
  // STEP 3: Check tier features (THE MAIN GATE)
  // ================================================
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select(`
      tier_id,
      subscription_tiers (
        name,
        slug,
        features
      )
    `)
    .eq('organization_id', orgId)
    .eq('status', 'active')
    .single();

  if (!subscription || !subscription.subscription_tiers) {
    return {
      allowed: false,
      level: 'none',
      reason: 'No active subscription found',
      requiresUpgrade: true,
    };
  }

  const tier = subscription.subscription_tiers as {
    name: string;
    slug: string;
    features: TierFeatures;
  };

  // Check if tier includes this feature
  const featureAllowed = tier.features[feature] === true;

  if (!featureAllowed) {
    return {
      allowed: false,
      level: 'none',
      reason: `Feature not included in ${tier.name} tier`,
      tier: tier.name,
      requiresUpgrade: true,
    };
  }

  // ================================================
  // STEP 4: Feature is allowed - determine access level
  // ================================================
  if (isAdmin) {
    return {
      allowed: true,
      level: 'full',
      reason: 'Full admin access',
      tier: tier.name,
    };
  }

  // Member role - limited access
  return {
    allowed: true,
    level: 'limited',
    reason: 'Limited member access',
    tier: tier.name,
  };
}

// ================================================
// HELPER FUNCTIONS
// ================================================

/**
 * Check if user is super admin
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

/**
 * Check if user is org owner or admin
 */
export async function isOrgAdmin(userId: string, orgId: string): Promise<boolean> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from('org_members')
    .select('role')
    .eq('organization_id', orgId)
    .eq('user_id', userId)
    .single();

  return data?.role === 'owner' || data?.role === 'admin';
}

/**
 * Get user's org ID (first org they're a member of)
 */
export async function getUserOrgId(userId: string): Promise<string | null> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from('org_members')
    .select('organization_id')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
    .limit(1)
    .single();

  return data?.organization_id || null;
}

/**
 * Get all features a user has access to
 */
export async function getUserFeatures(
  userId: string,
  orgId: string
): Promise<Feature[]> {
  const allFeatures: Feature[] = [
    'brand_engine',
    'content_engine',
    'analytics',
    'team',
    'pipeline',
    'ad_campaigns',
  ];

  const allowedFeatures: Feature[] = [];

  for (const feature of allFeatures) {
    const access = await canAccessFeature(userId, orgId, feature);
    if (access.allowed) {
      allowedFeatures.push(feature);
    }
  }

  return allowedFeatures;
}

/**
 * Get tier info for an organization
 */
export async function getOrgTier(orgId: string): Promise<{
  name: string;
  slug: string;
  features: TierFeatures;
  monthlyCredits: number;
} | null> {
  const supabase = createServiceClient();

  const { data } = await supabase
    .from('subscriptions')
    .select(`
      subscription_tiers (
        name,
        slug,
        features,
        monthly_credits
      )
    `)
    .eq('organization_id', orgId)
    .eq('status', 'active')
    .single();

  if (!data || !data.subscription_tiers) {
    return null;
  }

  const tier = data.subscription_tiers as {
    name: string;
    slug: string;
    features: TierFeatures;
    monthly_credits: number;
  };

  return {
    name: tier.name,
    slug: tier.slug,
    features: tier.features,
    monthlyCredits: tier.monthly_credits,
  };
}

/**
 * Require feature access - throws error if not allowed
 * Use this in API routes for easy protection
 */
export async function requireFeatureAccess(
  userId: string,
  orgId: string,
  feature: Feature,
  requireAdmin = false
): Promise<void> {
  const access = await canAccessFeature(userId, orgId, feature, requireAdmin);

  if (!access.allowed) {
    const error: any = new Error(access.reason || 'Access denied');
    error.status = access.requiresUpgrade ? 402 : 403; // 402 = Payment Required
    error.tier = access.tier;
    error.requiresUpgrade = access.requiresUpgrade;
    throw error;
  }
}

// ================================================
// CLIENT-SAFE FUNCTIONS (no sensitive data)
// ================================================

/**
 * Get feature access for client-side use
 * Safe to expose to frontend
 */
export async function getClientFeatureAccess(
  userId: string,
  orgId: string
): Promise<Record<Feature, boolean>> {
  const features = await getUserFeatures(userId, orgId);

  return {
    brand_engine: features.includes('brand_engine'),
    content_engine: features.includes('content_engine'),
    analytics: features.includes('analytics'),
    team: features.includes('team'),
    pipeline: features.includes('pipeline'),
    ad_campaigns: features.includes('ad_campaigns'),
  };
}
