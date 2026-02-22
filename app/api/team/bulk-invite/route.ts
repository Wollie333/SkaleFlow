import { NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { sendTeamInviteEmail } from '@/lib/resend';
import { logTeamActivity } from '@/lib/team-activity';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const { invites } = await request.json();

    if (!Array.isArray(invites) || invites.length === 0) {
      return NextResponse.json({ error: 'No invites provided' }, { status: 400 });
    }

    if (invites.length > 50) {
      return NextResponse.json({ error: 'Maximum 50 invites at once' }, { status: 400 });
    }

    const supabase = await createClient();
    const serviceSupabase = createServiceClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: membership } = await serviceSupabase
      .from('org_members')
      .select('organization_id, role')
      .eq('user_id', user.id)
      .single();

    if (!membership || !['owner', 'admin'].includes(membership.role)) {
      return NextResponse.json({ error: 'Only owners and admins can invite members' }, { status: 403 });
    }

    const { data: org } = await serviceSupabase
      .from('organizations')
      .select('id, name')
      .eq('id', membership.organization_id)
      .single();

    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Get inviter name
    const { data: inviter } = await serviceSupabase
      .from('users')
      .select('full_name, email')
      .eq('id', user.id)
      .single();
    const inviterName = inviter?.full_name || inviter?.email || 'Your team';

    // Get existing members & pending invites for dedup
    const [{ data: existingMembers }, { data: existingInvites }] = await Promise.all([
      serviceSupabase
        .from('org_members')
        .select('users!inner(email)')
        .eq('organization_id', org.id),
      serviceSupabase
        .from('invitations')
        .select('email')
        .eq('organization_name', org.name)
        .eq('status', 'pending'),
    ]);

    const memberEmails = new Set(
      (existingMembers || []).map((m: Record<string, unknown>) => {
        const users = m.users as { email: string } | null;
        return users?.email?.toLowerCase();
      }).filter(Boolean)
    );
    const invitedEmails = new Set(
      (existingInvites || []).map((i: { email: string }) => i.email.toLowerCase())
    );

    const results: { email: string; success: boolean; error?: string }[] = [];

    for (const invite of invites) {
      const email = (invite.email || '').trim().toLowerCase();
      const role = invite.role || 'member';

      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        results.push({ email, success: false, error: 'Invalid email' });
        continue;
      }

      if (memberEmails.has(email)) {
        results.push({ email, success: false, error: 'Already a member' });
        continue;
      }

      if (invitedEmails.has(email)) {
        results.push({ email, success: false, error: 'Already invited' });
        continue;
      }

      // Create invitation
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

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
        results.push({ email, success: false, error: 'Failed to create invitation' });
        continue;
      }

      // Send email
      const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'https://skale-flow.vercel.app';
      const inviteUrl = `${origin}/invite/${token}`;
      try {
        await sendTeamInviteEmail({
          to: email,
          inviterName,
          organizationName: org.name,
          inviteUrl,
        });
      } catch {
        // Email failed but invite was created
      }

      invitedEmails.add(email);
      results.push({ email, success: true });

      // Log each invite
      logTeamActivity(org.id, user.id, 'member_invited', null, {
        email,
        role,
        bulk: true,
      }).catch(() => {});
    }

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Bulk invite error:', error);
    return NextResponse.json({ error: 'Failed to process bulk invite' }, { status: 500 });
  }
}
