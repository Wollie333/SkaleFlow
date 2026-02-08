'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button, PageHeader } from '@/components/ui';
import { UserGroupIcon } from '@heroicons/react/24/outline';

interface TeamMember {
  id: string;
  role: string;
  joined_at: string;
  user_id: string;
  users: {
    id: string;
    email: string;
    full_name: string;
    last_login_at: string | null;
  } | null;
}

interface PendingInvite {
  id: string;
  email: string;
  created_at: string;
  expires_at: string;
  status: string;
}

type OrgMemberRole = 'owner' | 'admin' | 'member' | 'viewer';

const roleBadgeColors: Record<OrgMemberRole, string> = {
  owner: 'bg-gold/15 text-gold',
  admin: 'bg-purple-100 text-purple-700',
  member: 'bg-teal/10 text-teal',
  viewer: 'bg-stone/10 text-stone',
};

const roleLabels: Record<OrgMemberRole, string> = {
  owner: 'Owner',
  admin: 'Admin',
  member: 'Member',
  viewer: 'Viewer',
};

export default function MyTeamPage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([]);
  const [userRole, setUserRole] = useState<OrgMemberRole | null>(null);
  const [organizationName, setOrganizationName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Invite modal state
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<OrgMemberRole>('member');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState('');

  // Action state
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);
  const [roleChanging, setRoleChanging] = useState<string | null>(null);

  const fetchTeam = useCallback(async () => {
    try {
      const res = await fetch('/api/team');
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to load team');
        return;
      }

      setMembers(data.members || []);
      setPendingInvites(data.pendingInvites || []);
      setUserRole(data.userRole || null);
      setOrganizationName(data.organizationName || null);
    } catch {
      setError('Failed to load team');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTeam();
  }, [fetchTeam]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    setInviteLoading(true);
    setInviteError('');

    try {
      const res = await fetch('/api/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole }),
      });

      const data = await res.json();

      if (!res.ok) {
        setInviteError(data.error || 'Failed to send invitation');
        return;
      }

      setShowInviteModal(false);
      setInviteEmail('');
      setInviteRole('member');
      await fetchTeam();
    } catch {
      setInviteError('Failed to send invitation');
    } finally {
      setInviteLoading(false);
    }
  };

  const handleCancelInvite = async (invitationId: string) => {
    setActionLoading(invitationId);
    try {
      const res = await fetch('/api/team', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invitationId, action: 'cancel' }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to cancel invitation');
        return;
      }

      await fetchTeam();
    } catch {
      setError('Failed to cancel invitation');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    setActionLoading(memberId);
    try {
      const res = await fetch(`/api/team/${memberId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to remove member');
        return;
      }

      setConfirmRemove(null);
      await fetchTeam();
    } catch {
      setError('Failed to remove member');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRoleChange = async (memberId: string, newRole: OrgMemberRole) => {
    setRoleChanging(memberId);
    setError('');
    try {
      const res = await fetch(`/api/team/${memberId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to update role');
        return;
      }

      // Update local state immediately
      setMembers(prev =>
        prev.map(m => m.id === memberId ? { ...m, role: newRole } : m)
      );
    } catch {
      setError('Failed to update role');
    } finally {
      setRoleChanging(null);
    }
  };

  const isAdmin = userRole === 'owner' || userRole === 'admin';

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-ZA', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-stone">Loading team...</div>
      </div>
    );
  }

  if (error && members.length === 0) {
    return (
      <div className="p-6">
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
          {error}
          <button
            onClick={() => { setError(''); fetchTeam(); }}
            className="ml-3 underline hover:no-underline"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl border border-teal/[0.08] p-6 w-full max-w-md mx-4">
            <h3 className="font-serif text-lg font-bold text-charcoal mb-1">
              Invite Team Member
            </h3>
            <p className="text-sm text-stone mb-4">
              Send an invitation to join your team.
            </p>

            <form onSubmit={handleInvite} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-charcoal mb-1.5">
                  Email address
                </label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="colleague@company.com"
                  required
                  autoFocus
                  className="w-full px-4 py-2.5 border border-cream rounded-lg text-charcoal placeholder:text-stone/50 focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-charcoal mb-1.5">
                  Role
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as OrgMemberRole)}
                  className="w-full px-4 py-2.5 border border-cream rounded-lg text-charcoal bg-white focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal cursor-pointer"
                >
                  <option value="member">Member</option>
                  <option value="viewer">Viewer</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              {inviteError && (
                <p className="text-sm text-red-600">{inviteError}</p>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowInviteModal(false); setInviteEmail(''); setInviteError(''); }}
                  className="text-sm font-medium text-stone hover:text-charcoal px-4 py-2 rounded-lg hover:bg-cream transition-colors"
                >
                  Cancel
                </button>
                <Button
                  type="submit"
                  disabled={!inviteEmail.trim()}
                  isLoading={inviteLoading}
                  className="bg-teal hover:bg-teal-light text-white text-sm px-5 py-2 disabled:opacity-50"
                >
                  Send Invite
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
          {error}
          <button
            onClick={() => setError('')}
            className="ml-3 underline hover:no-underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <PageHeader
          icon={UserGroupIcon}
          title={organizationName || 'My Team'}
          subtitle={organizationName
            ? `Team members and invitations for ${organizationName}.`
            : 'Manage your team members and invitations.'}
          action={isAdmin ? (
            <Button
              onClick={() => setShowInviteModal(true)}
              className="bg-teal hover:bg-teal-light text-white text-sm px-5 py-2.5"
            >
              Invite Member
            </Button>
          ) : undefined}
        />
      </div>

      {/* Pending Invites */}
      {pendingInvites.length > 0 && (
        <div className="mb-8">
          <h2 className="font-serif text-xl font-bold text-charcoal mb-4 flex items-center gap-2">
            Pending Invitations
            <span className="bg-amber-100 text-amber-700 text-xs font-semibold px-2.5 py-1 rounded-full">
              {pendingInvites.length}
            </span>
          </h2>

          <div className="bg-white rounded-xl border border-teal/[0.08] shadow-[0_2px_12px_rgba(15,31,29,0.03)] overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-cream">
                  <th className="text-left px-6 py-4 text-xs font-semibold text-stone uppercase tracking-wider">Email</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-stone uppercase tracking-wider">Company</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-stone uppercase tracking-wider">Invited</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-stone uppercase tracking-wider">Expires</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-stone uppercase tracking-wider">Status</th>
                  {isAdmin && (
                    <th className="text-right px-6 py-4 text-xs font-semibold text-stone uppercase tracking-wider">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {pendingInvites.map(invite => (
                  <tr key={invite.id} className="border-b border-cream/50 last:border-0 bg-amber-50/30">
                    <td className="px-6 py-4 text-charcoal font-medium">{invite.email}</td>
                    <td className="px-6 py-4 text-stone">{organizationName || '—'}</td>
                    <td className="px-6 py-4 text-stone">{formatDate(invite.created_at)}</td>
                    <td className="px-6 py-4 text-stone">{formatDate(invite.expires_at)}</td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-700">
                        Pending
                      </span>
                    </td>
                    {isAdmin && (
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleCancelInvite(invite.id)}
                          disabled={actionLoading === invite.id}
                          className="text-xs font-medium text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-40"
                        >
                          {actionLoading === invite.id ? 'Cancelling...' : 'Cancel'}
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Team Members */}
      <div>
        <h2 className="font-serif text-xl font-bold text-charcoal mb-4">
          Team Members
          <span className="text-stone font-normal text-base ml-2">({members.length})</span>
        </h2>

        {members.length === 0 ? (
          <div className="bg-white rounded-xl border border-teal/[0.08] p-8 text-center text-stone">
            No team members yet. {isAdmin && 'Invite your first team member to get started.'}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-teal/[0.08] shadow-[0_2px_12px_rgba(15,31,29,0.03)] overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-cream">
                  <th className="text-left px-6 py-4 text-xs font-semibold text-stone uppercase tracking-wider">Name</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-stone uppercase tracking-wider">Email</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-stone uppercase tracking-wider">Company</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-stone uppercase tracking-wider">Role</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-stone uppercase tracking-wider">Joined</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-stone uppercase tracking-wider">Last Login</th>
                  {isAdmin && (
                    <th className="text-right px-6 py-4 text-xs font-semibold text-stone uppercase tracking-wider">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {members.map(member => {
                  const memberRole = member.role as OrgMemberRole;
                  const isOwner = memberRole === 'owner';

                  return (
                    <tr key={member.id} className="border-b border-cream/50 last:border-0">
                      <td className="px-6 py-4">
                        <span className="font-medium text-charcoal">
                          {member.users?.full_name || 'Unknown'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-stone">{member.users?.email || '—'}</td>
                      <td className="px-6 py-4 text-stone">{organizationName || '—'}</td>
                      <td className="px-6 py-4">
                        {isAdmin && !isOwner ? (
                          <div className="relative inline-block">
                            <select
                              value={memberRole}
                              onChange={(e) => handleRoleChange(member.id, e.target.value as OrgMemberRole)}
                              disabled={roleChanging === member.id}
                              className={`text-xs font-semibold px-2.5 py-1 rounded-full border-0 cursor-pointer appearance-none pr-6 focus:outline-none focus:ring-2 focus:ring-teal/20 ${roleBadgeColors[memberRole] || 'bg-stone/10 text-stone'} ${roleChanging === member.id ? 'opacity-50' : ''}`}
                            >
                              {userRole === 'owner' && (
                                <option value="admin">Admin</option>
                              )}
                              <option value="member">Member</option>
                              <option value="viewer">Viewer</option>
                            </select>
                            <svg className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-current opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        ) : (
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${roleBadgeColors[memberRole] || 'bg-stone/10 text-stone'}`}>
                            {roleLabels[memberRole] || memberRole}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-stone">{formatDate(member.joined_at)}</td>
                      <td className="px-6 py-4 text-stone">
                        {member.users?.last_login_at ? formatDate(member.users.last_login_at) : 'Never'}
                      </td>
                      {isAdmin && (
                        <td className="px-6 py-4 text-right">
                          {isOwner ? (
                            <span className="text-xs text-stone/50">—</span>
                          ) : confirmRemove === member.id ? (
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                onClick={() => handleRemoveMember(member.id)}
                                className="bg-red-600 hover:bg-red-700 text-white text-sm px-3 py-1.5"
                                isLoading={actionLoading === member.id}
                              >
                                Confirm
                              </Button>
                              <Button
                                onClick={() => setConfirmRemove(null)}
                                className="bg-white hover:bg-cream text-stone border border-stone/20 text-sm px-3 py-1.5"
                              >
                                Cancel
                              </Button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setConfirmRemove(member.id)}
                              className="text-xs font-medium text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors"
                            >
                              Remove
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
