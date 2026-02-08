import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const { fullName, email, organizationName, password } = await request.json();

    // Validate input
    if (!fullName || !email || !organizationName || !password) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address' },
        { status: 400 }
      );
    }

    const serviceSupabase = createServiceClient();

    // Check if email already exists in users table
    const { data: existingUser } = await serviceSupabase
      .from('users')
      .select('id')
      .eq('email', email.trim().toLowerCase())
      .single();

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 400 }
      );
    }

    // Create Supabase Auth user
    const { data: authData, error: authError } = await serviceSupabase.auth.admin.createUser({
      email: email.trim().toLowerCase(),
      password,
      email_confirm: true,
    });

    if (authError || !authData.user) {
      console.error('Failed to create auth user:', authError);
      return NextResponse.json(
        { error: authError?.message || 'Failed to create account' },
        { status: 500 }
      );
    }

    const userId = authData.user.id;

    // Create users record (approved: false — admin must approve)
    const { error: userError } = await serviceSupabase
      .from('users')
      .insert({
        id: userId,
        email: email.trim().toLowerCase(),
        full_name: fullName.trim(),
        role: 'client',
        approved: false,
        email_verified: true,
      });

    if (userError) {
      // Clean up auth user if users record fails
      await serviceSupabase.auth.admin.deleteUser(userId);
      console.error('Failed to create user record:', userError);
      return NextResponse.json(
        { error: 'Failed to create account' },
        { status: 500 }
      );
    }

    // Create organization
    const slug = organizationName
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    const { data: org, error: orgError } = await serviceSupabase
      .from('organizations')
      .insert({
        name: organizationName.trim(),
        slug: slug || `org-${userId.slice(0, 8)}`,
        owner_id: userId,
      })
      .select()
      .single();

    if (orgError || !org) {
      console.error('Failed to create organization:', orgError);
      // Don't fail the entire registration — user account is created
      // Admin can fix org assignment later
      return NextResponse.json({
        success: true,
        message: 'Account created successfully. Please wait for admin approval before logging in.',
      });
    }

    // Create org_members record (owner role)
    const { error: memberError } = await serviceSupabase
      .from('org_members')
      .insert({
        organization_id: org.id,
        user_id: userId,
        role: 'owner',
      });

    if (memberError) {
      console.error('Failed to create org member:', memberError);
    }

    return NextResponse.json({
      success: true,
      message: 'Account created successfully. Please wait for admin approval before logging in.',
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
