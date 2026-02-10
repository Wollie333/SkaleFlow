import { NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { sendTeamInviteEmail } from '@/lib/resend';
import crypto from 'crypto';

// POST — Admin-initiated team invite for a user's org
export async function POST(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const supabase = await createClient();
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

    const { userId } = await params;
    const { email, teamRole } = await request.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const serviceSupabase = createServiceClient();

    // Look up target user's org
    const { data: membership } = await serviceSupabase
      .from('org_members')
      .select('organization_id, organizations(id, name)')
      .eq('user_id', userId)
      .limit(1)
      .maybeSingle();

    if (!membership) {
      return NextResponse.json({ error: 'User has no organization' }, { status: 400 });
    }

    const org = membership.organizations as { id: string; name: string } | null;
    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Check if email is already a member
    const { data: existingMember } = await serviceSupabase
      .from('org_members')
      .select('id, users!inner(email)')
      .eq('organization_id', org.id)
      .filter('users.email', 'eq', email.toLowerCase().trim())
      .maybeSingle();

    if (existingMember) {
      return NextResponse.json({ error: 'This person is already a team member' }, { status: 400 });
    }

    // Check for pending invite
    const { data: existingInvite } = await serviceSupabase
      .from('invitations')
      .select('id')
      .eq('email', email.toLowerCase().trim())
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
        email: email.toLowerCase().trim(),
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

    const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/invite/${token}`;

    // Send email + track status
    let emailStatus: string = 'pending';
    try {
      const emailResult = await sendTeamInviteEmail({
        to: email.toLowerCase().trim(),
        inviterName: 'SkaleFlow Admin',
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
      teamRole: teamRole || null,
    });
  } catch (error) {
    console.error('Admin team invite error:', error);
    return NextResponse.json({ error: 'Failed to send invitation' }, { status: 500 });
  }
}
