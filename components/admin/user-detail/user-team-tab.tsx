'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui';
import {
  EnvelopeIcon,
  ArrowPathIcon,
  XMarkIcon,
  PencilIcon,
  CheckIcon,
  UserPlusIcon,
} from '@heroicons/react/24/outline';

interface TeamMember {
  id: string;
  role: string;
  team_role: string | null;
  joined_at: string;
  user_id: string;
  users: {
    id: string;
    email: string;
    full_name: string;
    last_login_at: string | null;
  } | null;
}

interface PendingInvitation {
  id: string;
  email: string;
  status: string;
  created_at: string;
  expires_at: string;
  email_status: string;
  email_sent_at: string | null;
  email_error: string | null;
}

interface UserTeamTabProps {
  teamMembers: TeamMember[];
  pendingInvitations: PendingInvitation[];
  userId: string;
  onRefresh: () => void;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-ZA', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

const emailStatusBadge: Record<string, { label: string; classes: string }> = {
  pending: { label: 'Pending', classes: 'bg-amber-50 text-amber-600' },
  sent: { label: 'Sent', classes: 'bg-emerald-50 text-emerald-600' },
  failed: { label: 'Failed', classes: 'bg-red-50 text-red-600' },
  delivered: { label: 'Delivered', classes: 'bg-teal/10 text-teal' },
  bounced: { label: 'Bounced', classes: 'bg-red-100 text-red-700' },
};

const roleBadge: Record<string, { label: string; classes: string }> = {
  owner: { label: 'Owner', classes: 'bg-purple-100 text-purple-700' },
  admin: { label: 'Admin', classes: 'bg-blue-100 text-blue-700' },
  member: { label: 'Member', classes: 'bg-teal/10 text-teal' },
  viewer: { label: 'Viewer', classes: 'bg-stone/10 text-stone' },
};

export function UserTeamTab({ teamMembers, pendingInvitations, userId, onRefresh }: UserTeamTabProps) {
  const router = useRouter();
  const [editingRole, setEditingRole] = useState<string | null>(null);
  const [editRoleValue, setEditRoleValue] = useState('');
  const [roleLoading, setRoleLoading] = useState(false);

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteTeamRole, setInviteTeamRole] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState('');

  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const handleUpdateTeamRole = async (memberId: string) => {
    setRoleLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_team_role', memberId, teamRole: editRoleValue.trim() }),
      });
      if (res.ok) {
        setEditingRole(null);
        setEditRoleValue('');
        onRefresh();
      }
    } finally {
      setRoleLoading(false);
    }
  };

  const handleResendInvite = async (invitationId: string) => {
    setActionLoading(invitationId);
    try {
      await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'resend_invite', invitationId }),
      });
      onRefresh();
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelInvite = async (invitationId: string) => {
    setActionLoading(invitationId);
    try {
      await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel_invite', invitationId }),
      });
      onRefresh();
    } finally {
      setActionLoading(null);
    }
  };

  const handleSendInvite = async () => {
    if (!inviteEmail.trim()) return;
    setInviteLoading(true);
    setInviteError('');
    try {
      const res = await fetch(`/api/admin/users/${userId}/team`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail.trim(), teamRole: inviteTeamRole.trim() || null }),
      });
      const data = await res.json();
      if (!res.ok) {
        setInviteError(data.error || 'Failed to send invite');
        return;
      }
      setInviteEmail('');
      setInviteTeamRole('');
      onRefresh();
    } catch {
      setInviteError('Failed to send invite');
    } finally {
      setInviteLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Team Members */}
      <div className="bg-cream-warm rounded-xl border border-teal/[0.08] shadow-[0_2px_12px_rgba(15,31,29,0.03)] overflow-hidden">
        <div className="px-5 py-4 border-b border-cream">
          <h3 className="font-serif text-lg font-bold text-charcoal">
            Team Members
            <span className="text-stone font-normal text-sm ml-2">({teamMembers.length})</span>
          </h3>
        </div>

        {teamMembers.length === 0 ? (
          <div className="p-8 text-center text-stone text-sm">No team members</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5">
            {teamMembers.map((member) => {
              const badge = roleBadge[member.role] || roleBadge.member;
              const isEditing = editingRole === member.id;

              return (
                <div
                  key={member.id}
                  className="border border-cream rounded-lg p-4 hover:border-teal/20 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="min-w-0">
                      <button
                        onClick={() => router.push(`/admin/users/${member.user_id}`)}
                        className="font-medium text-charcoal hover:text-teal transition-colors text-left truncate block"
                      >
                        {member.users?.full_name || 'Unknown'}
                      </button>
                      <p className="text-sm text-stone truncate">{member.users?.email}</p>
                    </div>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${badge.classes}`}>
                      {badge.label}
                    </span>
                  </div>

                  {/* Team Role */}
                  <div className="mt-3 flex items-center gap-2">
                    <span className="text-xs text-stone">Team role:</span>
                    {isEditing ? (
                      <div className="flex items-center gap-1 flex-1">
                        <input
                          type="text"
                          value={editRoleValue}
                          onChange={(e) => setEditRoleValue(e.target.value)}
                          placeholder="e.g. Accounting"
                          autoFocus
                          onKeyDown={(e) => e.key === 'Enter' && handleUpdateTeamRole(member.id)}
                          className="text-xs border border-cream rounded px-2 py-1 flex-1 focus:outline-none focus:ring-1 focus:ring-teal/20"
                        />
                        <button
                          onClick={() => handleUpdateTeamRole(member.id)}
                          disabled={roleLoading}
                          className="text-teal hover:text-teal-light p-0.5"
                        >
                          <CheckIcon className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => { setEditingRole(null); setEditRoleValue(''); }}
                          className="text-stone hover:text-charcoal p-0.5"
                        >
                          <XMarkIcon className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-charcoal font-medium">
                          {member.team_role || '—'}
                        </span>
                        <button
                          onClick={() => {
                            setEditingRole(member.id);
                            setEditRoleValue(member.team_role || '');
                          }}
                          className="text-stone hover:text-teal p-0.5"
                        >
                          <PencilIcon className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="mt-2 flex items-center justify-between text-xs text-stone">
                    <span>Joined {formatDate(member.joined_at)}</span>
                    <span>
                      {member.users?.last_login_at
                        ? `Last login ${formatDate(member.users.last_login_at)}`
                        : 'Never logged in'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pending Invitations */}
      <div className="bg-cream-warm rounded-xl border border-teal/[0.08] shadow-[0_2px_12px_rgba(15,31,29,0.03)] overflow-hidden">
        <div className="px-5 py-4 border-b border-cream">
          <h3 className="font-serif text-lg font-bold text-charcoal">
            Pending Invitations
            <span className="text-stone font-normal text-sm ml-2">({pendingInvitations.length})</span>
          </h3>
        </div>

        {pendingInvitations.length === 0 ? (
          <div className="p-8 text-center text-stone text-sm">No pending invitations</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-cream">
                <th className="text-left px-5 py-3 text-xs font-semibold text-stone uppercase tracking-wider">Email</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-stone uppercase tracking-wider">Email Status</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-stone uppercase tracking-wider">Invited</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-stone uppercase tracking-wider">Expires</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-stone uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pendingInvitations.map((invite) => {
                const esBadge = emailStatusBadge[invite.email_status] || emailStatusBadge.pending;
                const isExpired = new Date(invite.expires_at) < new Date();

                return (
                  <tr key={invite.id} className="border-b border-cream/50 last:border-0">
                    <td className="px-5 py-3 text-sm text-charcoal">{invite.email}</td>
                    <td className="px-5 py-3">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${esBadge.classes}`}>
                        {esBadge.label}
                      </span>
                      {invite.email_error && (
                        <p className="text-xs text-red-500 mt-0.5 truncate max-w-[200px]" title={invite.email_error}>
                          {invite.email_error}
                        </p>
                      )}
                    </td>
                    <td className="px-5 py-3 text-sm text-stone">{formatDate(invite.created_at)}</td>
                    <td className="px-5 py-3">
                      <span className={`text-sm ${isExpired ? 'text-red-500 font-medium' : 'text-stone'}`}>
                        {isExpired ? 'Expired' : formatDate(invite.expires_at)}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleResendInvite(invite.id)}
                          disabled={actionLoading === invite.id}
                          className="text-xs font-medium text-teal hover:text-teal-light bg-teal/5 hover:bg-teal/10 px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-40 flex items-center gap-1"
                        >
                          <ArrowPathIcon className="w-3.5 h-3.5" />
                          Resend
                        </button>
                        <button
                          onClick={() => handleCancelInvite(invite.id)}
                          disabled={actionLoading === invite.id}
                          className="text-xs font-medium text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-40 flex items-center gap-1"
                        >
                          <XMarkIcon className="w-3.5 h-3.5" />
                          Cancel
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Invite Form */}
      <div className="bg-cream-warm rounded-xl border border-teal/[0.08] shadow-[0_2px_12px_rgba(15,31,29,0.03)] p-5">
        <h3 className="font-serif text-lg font-bold text-charcoal mb-4">Invite Team Member</h3>

        {inviteError && (
          <div className="mb-3 p-2.5 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm flex items-center justify-between">
            <span>{inviteError}</span>
            <button onClick={() => setInviteError('')} className="text-red-400 hover:text-red-600 ml-2">&times;</button>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="Email address"
              onKeyDown={(e) => e.key === 'Enter' && handleSendInvite()}
              className="w-full px-4 py-2.5 border border-cream rounded-lg text-charcoal placeholder:text-stone/50 focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal text-sm"
            />
          </div>
          <div className="w-full sm:w-40">
            <input
              type="text"
              value={inviteTeamRole}
              onChange={(e) => setInviteTeamRole(e.target.value)}
              placeholder="Team role (optional)"
              className="w-full px-4 py-2.5 border border-cream rounded-lg text-charcoal placeholder:text-stone/50 focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal text-sm"
            />
          </div>
          <Button
            onClick={handleSendInvite}
            disabled={!inviteEmail.trim() || inviteLoading}
            isLoading={inviteLoading}
            className="bg-teal hover:bg-teal-light text-white text-sm px-5 py-2.5 flex items-center gap-1.5 disabled:opacity-50"
          >
            <UserPlusIcon className="w-4 h-4" />
            Send Invite
          </Button>
        </div>
      </div>
    </div>
  );
}
