/**
 * Admin API - Create Beta Users
 *
 * POST /api/admin/beta-users
 * Body: { email: string, fullName: string }
 *
 * Creates a new beta user with:
 * - 0 monthly credits
 * - Beta tier (brand + content only)
 * - Owner role in their org
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
    const { email, fullName } = await req.json();

    if (!email || !fullName) {
      return NextResponse.json(
        { error: 'Email and full name are required' },
        { status: 400 }
      );
    }

    // Call database function to create beta user
    const { data, error } = await supabase.rpc('create_beta_user', {
      p_email: email,
      p_full_name: fullName,
    });

    if (error) {
      console.error('Error creating beta user:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to create beta user' },
        { status: 500 }
      );
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: 'Failed to create beta user - no data returned' },
        { status: 500 }
      );
    }

    const result = data[0];

    // Check if user already existed
    if (result.message?.includes('already exists')) {
      return NextResponse.json(
        {
          error: result.message,
          userId: result.user_id,
        },
        { status: 409 }
      );
    }

    // Success
    return NextResponse.json({
      success: true,
      message: result.message,
      userId: result.user_id,
      orgId: result.org_id,
      email,
      fullName,
    });
  } catch (error: any) {
    console.error('Error in beta user creation:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// ================================================
// GET - List all beta users
// ================================================

export async function GET(req: NextRequest) {
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

    // Get all users with beta tier
    const { data: betaUsers, error } = await supabase
      .from('user_feature_access')
      .select('*')
      .eq('tier_slug', 'beta')
      .order('email');

    if (error) {
      console.error('Error fetching beta users:', error);
      return NextResponse.json(
        { error: 'Failed to fetch beta users' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      users: betaUsers || [],
      count: betaUsers?.length || 0,
    });
  } catch (error: any) {
    console.error('Error listing beta users:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
