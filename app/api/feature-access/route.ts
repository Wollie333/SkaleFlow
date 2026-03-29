/**
 * Feature Access API
 *
 * GET /api/feature-access
 *
 * Returns the current user's feature access based on their tier.
 * Used by frontend to show/hide features.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getClientFeatureAccess, getUserOrgId, getOrgTier } from '@/lib/feature-gates';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        {
          features: {
            brand_engine: false,
            content_engine: false,
            analytics: false,
            team: false,
            pipeline: false,
            ad_campaigns: false,
          },
          tier: null,
        },
        { status: 200 }
      );
    }

    // Get user's org
    const orgId = await getUserOrgId(user.id);

    if (!orgId) {
      return NextResponse.json(
        {
          error: 'No organization found',
          features: {
            brand_engine: false,
            content_engine: false,
            analytics: false,
            team: false,
            pipeline: false,
            ad_campaigns: false,
          },
          tier: null,
        },
        { status: 200 }
      );
    }

    // Get feature access
    const features = await getClientFeatureAccess(user.id, orgId);

    // Get tier info
    const tier = await getOrgTier(orgId);

    return NextResponse.json({
      features,
      tier: tier
        ? {
            name: tier.name,
            slug: tier.slug,
            monthlyCredits: tier.monthlyCredits,
          }
        : null,
      userId: user.id,
      orgId,
    });
  } catch (error: any) {
    console.error('Error getting feature access:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
