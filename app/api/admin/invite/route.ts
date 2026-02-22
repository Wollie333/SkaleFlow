import { NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import crypto from 'crypto';

// Admin-only endpoint for sending invitations
export async function POST(request: Request) {
  try {
    const { email, organizationName } = await request.json();

    const supabase = await createClient();
    const serviceSupabase = createServiceClient();

    // Verify user is authenticated and is an admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is a super admin (you can customize this check)
    const { data: adminUser } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (adminUser?.role !== 'super_admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Check if email already exists
    const { data: existingUser } = await serviceSupabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    // Create organization
    const { data: org, error: orgError } = await serviceSupabase
      .from('organizations')
      .insert({
        name: organizationName,
        slug: organizationName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      })
      .select()
      .single();

    if (orgError || !org) {
      console.error('Failed to create organization:', orgError);
      return NextResponse.json(
        { error: 'Failed to create organization' },
        { status: 500 }
      );
    }

    // Generate invitation token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

    // Create invitation
    const { error: inviteError } = await serviceSupabase
      .from('invitations')
      .insert({
        email,
        organization_name: org.name,
        token,
        expires_at: expiresAt.toISOString(),
        invited_by: user.id,
      });

    if (inviteError) {
      // Clean up organization
      await serviceSupabase.from('organizations').delete().eq('id', org.id);
      console.error('Failed to create invitation:', inviteError);
      return NextResponse.json(
        { error: 'Failed to create invitation' },
        { status: 500 }
      );
    }

    // Build invitation URL
    const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'https://skale-flow.vercel.app';
    const inviteUrl = `${origin}/invite/${token}`;

    // Send invitation email via Supabase
    // Note: You may want to use a custom email service for branded emails
    const { error: emailError } = await serviceSupabase.auth.admin.inviteUserByEmail(email, {
      redirectTo: inviteUrl,
    });

    if (emailError) {
      console.error('Failed to send invitation email:', emailError);
      // Don't fail the request - the invitation was created
      // Admin can share the link manually
    }

    return NextResponse.json({
      success: true,
      invitation: {
        email,
        organizationId: org.id,
        organizationName: org.name,
        inviteUrl,
        expiresAt: expiresAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Invite error:', error);
    return NextResponse.json(
      { error: 'Failed to create invitation' },
      { status: 500 }
    );
  }
}

// Get all pending invitations
export async function GET() {
  try {
    const supabase = await createClient();

    // Verify user is authenticated and is an admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: adminUser } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (adminUser?.role !== 'super_admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const serviceSupabase = createServiceClient();

    const { data: invitations } = await serviceSupabase
      .from('invitations')
      .select(`
        *,
        organization:organizations(name)
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    return NextResponse.json({ invitations: invitations || [] });
  } catch (error) {
    console.error('Error fetching invitations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch invitations' },
      { status: 500 }
    );
  }
}
