import { NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { sendTeamInviteEmail } from '@/lib/resend';
import crypto from 'crypto';

// GET — List team members + pending invites for the current user's org
export async function GET() {
  try {
    const supabase = await createClient();
    const serviceSupabase = createServiceClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current user's org membership
    const { data: membership } = await serviceSupabase
      .from('org_members')
      .select('organization_id, role')
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return NextResponse.json({ members: [], pendingInvites: [], userRole: null });
    }

    // Get org details
    const { data: org } = await serviceSupabase
      .from('organizations')
      .select('id, name')
      .eq('id', membership.organization_id)
      .single();

    if (!org) {
      return NextResponse.json({ members: [], pendingInvites: [], userRole: membership.role });
    }

    // Get all org members with user details
    const { data: members } = await serviceSupabase
      .from('org_members')
      .select(`
        id,
        role,
        joined_at,
        user_id,
        users (
          id,
          email,
          full_name,
          last_login_at
        )
      `)
      .eq('organization_id', org.id)
      .order('joined_at', { ascending: true });

    // Get pending invitations for this org
    const { data: pendingInvites } = await serviceSupabase
      .from('invitations')
      .select('id, email, created_at, expires_at, status, email_status, email_sent_at, email_error')
      .eq('organization_name', org.name)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    return NextResponse.json({
      members: members || [],
      pendingInvites: pendingInvites || [],
      userRole: membership.role,
      organizationName: org.name,
    });
  } catch (error) {
    console.error('Team GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch team' }, { status: 500 });
  }
}

// POST — Invite a team member
export async function POST(request: Request) {
  try {
    const { email, role = 'member' } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const supabase = await createClient();
    const serviceSupabase = createServiceClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check user's org membership and role
    const { data: membership } = await serviceSupabase
      .from('org_members')
      .select('organization_id, role')
      .eq('user_id', user.id)
      .single();

    if (!membership || !['owner', 'admin'].includes(membership.role)) {
      return NextResponse.json({ error: 'Only owners and admins can invite members' }, { status: 403 });
    }

    // Get org name
    const { data: org } = await serviceSupabase
      .from('organizations')
      .select('id, name')
      .eq('id', membership.organization_id)
      .single();

    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Check if email is already a member of this org
    const { data: existingMember } = await serviceSupabase
      .from('org_members')
      .select('id, users!inner(email)')
      .eq('organization_id', org.id)
      .filter('users.email', 'eq', email)
      .maybeSingle();

    if (existingMember) {
      return NextResponse.json({ error: 'This person is already a member of your team' }, { status: 400 });
    }

    // Check if there's already a pending invite for this email + org
    const { data: existingInvite } = await serviceSupabase
      .from('invitations')
      .select('id')
      .eq('email', email)
      .eq('organization_name', org.name)
      .eq('status', 'pending')
      .maybeSingle();

    if (existingInvite) {
      return NextResponse.json({ error: 'An invitation is already pending for this email' }, { status: 400 });
    }

    // Generate token and expiry
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Create invitation record
    const { data: invitation, error: inviteError } = await serviceSupabase
      .from('invitations')
      .insert({
        email,
        organization_name: org.name,
        token,
        expires_at: expiresAt.toISOString(),
        invited_by: user.id,
      })
      .select('id')
      .single();

    if (inviteError || !invitation) {
      console.error('Failed to create invitation:', inviteError);
      return NextResponse.json({ error: 'Failed to create invitation' }, { status: 500 });
    }

    // Build invite URL
    const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/invite/${token}`;

    // Get inviter's name for the email
    const { data: inviter } = await serviceSupabase
      .from('users')
      .select('full_name, email')
      .eq('id', user.id)
      .single();

    const inviterName = inviter?.full_name || inviter?.email || 'Your team';

    // Send invite email via Resend + track status
    let emailStatus: string = 'pending';
    try {
      const emailResult = await sendTeamInviteEmail({
        to: email,
        inviterName,
        organizationName: org.name,
        inviteUrl,
      });

      emailStatus = 'sent';
      await serviceSupabase
        .from('invitations')
        .update({
          email_status: 'sent',
          email_sent_at: new Date().toISOString(),
          resend_email_id: emailResult?.id || null,
        })
        .eq('id', invitation.id);
    } catch (emailError) {
      console.error('Failed to send invitation email:', emailError);
      emailStatus = 'failed';
      await serviceSupabase
        .from('invitations')
        .update({
          email_status: 'failed',
          email_error: emailError instanceof Error ? emailError.message : 'Unknown error',
        })
        .eq('id', invitation.id);
    }

    return NextResponse.json({
      success: true,
      inviteUrl,
      emailStatus,
    });
  } catch (error) {
    console.error('Team POST error:', error);
    return NextResponse.json({ error: 'Failed to send invitation' }, { status: 500 });
  }
}

// PATCH — Cancel or resend a pending invitation
export async function PATCH(request: Request) {
  try {
    const { invitationId, action } = await request.json();

    if (!invitationId || !['cancel', 'resend'].includes(action)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const supabase = await createClient();
    const serviceSupabase = createServiceClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check user's org membership and role
    const { data: membership } = await serviceSupabase
      .from('org_members')
      .select('organization_id, role')
      .eq('user_id', user.id)
      .single();

    if (!membership || !['owner', 'admin'].includes(membership.role)) {
      return NextResponse.json({ error: 'Only owners and admins can manage invitations' }, { status: 403 });
    }

    // Get org name to verify the invitation belongs to this org
    const { data: org } = await serviceSupabase
      .from('organizations')
      .select('name')
      .eq('id', membership.organization_id)
      .single();

    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    if (action === 'cancel') {
      const { error: updateError } = await serviceSupabase
        .from('invitations')
        .update({ status: 'cancelled' })
        .eq('id', invitationId)
        .eq('organization_name', org.name)
        .eq('status', 'pending');

      if (updateError) {
        console.error('Failed to cancel invitation:', updateError);
        return NextResponse.json({ error: 'Failed to cancel invitation' }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    }

    // action === 'resend'
    const { data: invite } = await serviceSupabase
      .from('invitations')
      .select('id, email, token, expires_at, organization_name')
      .eq('id', invitationId)
      .eq('organization_name', org.name)
      .eq('status', 'pending')
      .single();

    if (!invite) {
      return NextResponse.json({ error: 'Invitation not found or already used' }, { status: 404 });
    }

    // Refresh token and expiry if expired
    let token = invite.token;
    const isExpired = new Date(invite.expires_at) < new Date();
    if (isExpired) {
      token = crypto.randomBytes(32).toString('hex');
      const newExpiry = new Date();
      newExpiry.setDate(newExpiry.getDate() + 7);
      await serviceSupabase
        .from('invitations')
        .update({ token, expires_at: newExpiry.toISOString() })
        .eq('id', invite.id);
    }

    const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/invite/${token}`;

    const { data: inviter } = await serviceSupabase
      .from('users')
      .select('full_name, email')
      .eq('id', user.id)
      .single();

    const inviterName = inviter?.full_name || inviter?.email || 'Your team';

    let emailStatus: string = 'pending';
    try {
      const emailResult = await sendTeamInviteEmail({
        to: invite.email,
        inviterName,
        organizationName: invite.organization_name,
        inviteUrl,
      });

      emailStatus = 'sent';
      await serviceSupabase
        .from('invitations')
        .update({
          email_status: 'sent',
          email_sent_at: new Date().toISOString(),
          email_error: null,
          resend_email_id: emailResult?.id || null,
        })
        .eq('id', invite.id);
    } catch (emailError) {
      console.error('Failed to resend invitation email:', emailError);
      emailStatus = 'failed';
      await serviceSupabase
        .from('invitations')
        .update({
          email_status: 'failed',
          email_error: emailError instanceof Error ? emailError.message : 'Unknown error',
        })
        .eq('id', invite.id);
    }

    return NextResponse.json({ success: true, emailStatus });
  } catch (error) {
    console.error('Team PATCH error:', error);
    return NextResponse.json({ error: 'Failed to process invitation action' }, { status: 500 });
  }
}
