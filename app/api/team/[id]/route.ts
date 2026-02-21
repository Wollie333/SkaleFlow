import { NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { logTeamActivity } from '@/lib/team-activity';
import type { OrgMemberRole } from '@/types/database';

const VALID_ROLES: OrgMemberRole[] = ['admin', 'member', 'viewer'];

// PATCH ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Update a team member's role
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
  const { id } = await params;
    const memberId = id;
    const { role } = await request.json();

    if (!role || !VALID_ROLES.includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    const supabase = await createClient();
    const serviceSupabase = createServiceClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current user's org membership
    const { data: myMembership } = await serviceSupabase
      .from('org_members')
      .select('organization_id, role')
      .eq('user_id', user.id)
      .single();

    if (!myMembership || !['owner', 'admin'].includes(myMembership.role)) {
      return NextResponse.json({ error: 'Only owners and admins can change roles' }, { status: 403 });
    }

    // Get the target member record
    const { data: targetMember } = await serviceSupabase
      .from('org_members')
      .select('id, user_id, role, organization_id')
      .eq('id', memberId)
      .single();

    if (!targetMember) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    // Ensure same org
    if (targetMember.organization_id !== myMembership.organization_id) {
      return NextResponse.json({ error: 'Member not in your organization' }, { status: 403 });
    }

    // Cannot change your own role
    if (targetMember.user_id === user.id) {
      return NextResponse.json({ error: 'You cannot change your own role' }, { status: 400 });
    }

    // Cannot change the owner's role
    if (targetMember.role === 'owner') {
      return NextResponse.json({ error: 'Cannot change the owner\'s role' }, { status: 400 });
    }

    // Admins cannot promote someone to admin (only owners can)
    if (myMembership.role === 'admin' && role === 'admin') {
      return NextResponse.json({ error: 'Only the owner can assign admin roles' }, { status: 403 });
    }

    // Update the role
    const { error: updateError } = await serviceSupabase
      .from('org_members')
      .update({ role })
      .eq('id', memberId);

    if (updateError) {
      console.error('Failed to update member role:', updateError);
      return NextResponse.json({ error: 'Failed to update role' }, { status: 500 });
    }

    logTeamActivity(myMembership.organization_id, user.id, 'role_changed', targetMember.user_id, {
      previousRole: targetMember.role,
      newRole: role,
    }).catch(() => {});

    return NextResponse.json({ success: true, role });
  } catch (error) {
    console.error('Team PATCH error:', error);
    return NextResponse.json({ error: 'Failed to update role' }, { status: 500 });
  }
}

// DELETE ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Remove a team member
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
  const { id } = await params;
    const memberId = id;

    const supabase = await createClient();
    const serviceSupabase = createServiceClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current user's org membership
    const { data: myMembership } = await serviceSupabase
      .from('org_members')
      .select('organization_id, role')
      .eq('user_id', user.id)
      .single();

    if (!myMembership || !['owner', 'admin'].includes(myMembership.role)) {
      return NextResponse.json({ error: 'Only owners and admins can remove members' }, { status: 403 });
    }

    // Get the target member record
    const { data: targetMember } = await serviceSupabase
      .from('org_members')
      .select('id, user_id, role, organization_id')
      .eq('id', memberId)
      .single();

    if (!targetMember) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    // Ensure same org
    if (targetMember.organization_id !== myMembership.organization_id) {
      return NextResponse.json({ error: 'Member not in your organization' }, { status: 403 });
    }

    // Cannot remove yourself
    if (targetMember.user_id === user.id) {
      return NextResponse.json({ error: 'You cannot remove yourself' }, { status: 400 });
    }

    // Cannot remove the owner
    if (targetMember.role === 'owner') {
      return NextResponse.json({ error: 'Cannot remove the organization owner' }, { status: 400 });
    }

    // Delete the org_members record
    const { error: deleteError } = await serviceSupabase
      .from('org_members')
      .delete()
      .eq('id', memberId);

    if (deleteError) {
      console.error('Failed to remove member:', deleteError);
      return NextResponse.json({ error: 'Failed to remove member' }, { status: 500 });
    }

    logTeamActivity(myMembership.organization_id, user.id, 'member_removed', targetMember.user_id, {
      removedRole: targetMember.role,
    }).catch(() => {});

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Team DELETE error:', error);
    return NextResponse.json({ error: 'Failed to remove member' }, { status: 500 });
  }
}
