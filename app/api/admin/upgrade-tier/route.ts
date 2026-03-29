/**
 * Admin API - Upgrade User Tier
 *
 * POST /api/admin/upgrade-tier
 * Body: { email: string, tierSlug: 'beta' | 'foundation' | 'momentum' | 'authority' }
 *
 * Upgrades a user's subscription tier and updates their credits.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isSuperAdmin } from '@/lib/feature-gates';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if super admin
    const isAdmin = await isSuperAdmin(user.id);
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Get request body
    const { email, tierSlug } = await req.json();

    if (!email || !tierSlug) {
      return NextResponse.json(
        { error: 'Email and tier slug are required' },
        { status: 400 }
      );
    }

    // Validate tier slug
    const validTiers = ['beta', 'foundation', 'momentum', 'authority'];
    if (!validTiers.includes(tierSlug)) {
      return NextResponse.json(
        {
          error: `Invalid tier. Must be one of: ${validTiers.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // Call database function to upgrade tier
    const { data, error } = await supabase.rpc('upgrade_user_tier', {
      p_email: email,
      p_new_tier_slug: tierSlug,
    });

    if (error) {
      console.error('Error upgrading tier:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to upgrade tier' },
        { status: 500 }
      );
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: 'Failed to upgrade tier - no data returned' },
        { status: 500 }
      );
    }

    const result = data[0];

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }

    // Success
    return NextResponse.json({
      success: true,
      message: result.message,
      email,
      newTier: tierSlug,
    });
  } catch (error: any) {
    console.error('Error in tier upgrade:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
