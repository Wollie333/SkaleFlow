'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button, PageHeader } from '@/components/ui';
import { UserGroupIcon } from '@heroicons/react/24/outline';
import { MemberCard } from '@/components/team/member-card';
import { PermissionsGrid } from '@/components/team/permissions-grid';
import { CreditAllocator } from '@/components/team/credit-allocator';
import { MemberDetailPanel } from '@/components/team/member-detail-panel';
import { TeamCreditSummary } from '@/components/team/team-credit-summary';
import { cn } from '@/lib/utils';

type OrgMemberRole = 'owner' | 'admin' | 'member' | 'viewer';

interface TeamMember {
  id: string;
  role: OrgMemberRole;
  joined_at: string;
  user_id: string;
  users: {
    id: string;
    email: string;
    full_name: string;
    last_login_at: string | null;
    avatar_url?: string | null;
  } | null;
}

interface PendingInvite {
  id: string;
  email: string;
  created_at: string;
  expires_at: string;
  status: string;
}

interface FeaturePermissions {
  access?: boolean;
  chat?: boolean;
  edit_variables?: boolean;
  create?: boolean;
  edit?: boolean;
  schedule?: boolean;
  publish?: boolean;
}

interface MemberPermissions {
  userId: string;
  role: string;
  user: { full_name: string | null; email: string };
  permissions: Record<string, FeaturePermissions>;
}

interface CreditAllocation {
  id: string;
  user_id: string;
  feature: string;
  credits_allocated: number;
  credits_remaining: number;
  users?: { full_name: string; email: string } | null;
}

type TabId = 'members' | 'permissions' | 'credits';

const roleBadgeColors: Record<OrgMemberRole, string> = {
  owner: 'bg-gold/15 text-gold',
  admin: 'bg-purple-100 text-purple-700',
  member: 'bg-teal/10 text-teal',
  viewer: 'bg-stone/10 text-stone',
};

export default function MyTeamPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab') as TabId | null;

  const [members, setMembers] = useState<TeamMember[]>([]);
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([]);
  const [userRole, setUserRole] = useState<OrgMemberRole | null>(null);
  const [organizationName, setOrganizationName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<TabId>(tabParam || 'members');

  // Invite form state
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<OrgMemberRole>('member');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState('');

  // Action state
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [roleChanging, setRoleChanging] = useState<string | null>(null);

  // Permissions state
  const [memberPermissions, setMemberPermissions] = useState<MemberPermissions[]>([]);
  const [permsSaving, setPermsSaving] = useState(false);

  // Credits state
  const [creditAllocations, setCreditAllocations] = useState<CreditAllocation[]>([]);
  const [orgBalance, setOrgBalance] = useState({ monthlyRemaining: 0, monthlyTotal: 0, topupRemaining: 0, totalRemaining: 0 });

  // Detail panel
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [selectedMemberPerms, setSelectedMemberPerms] = useState<Record<string, FeaturePermissions>>({});
  const [selectedMemberCredits, setSelectedMemberCredits] = useState<CreditAllocation[]>([]);

  const isAdmin = userRole === 'owner' || userRole === 'admin';

  const fetchTeam = useCallback(async () => {
    try {
      const res = await fetch('/api/team');
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed to load team'); return; }
      setMembers(data.members || []);
      setPendingInvites(data.pendingInvites || []);
      setUserRole(data.userRole || null);
      setOrganizationName(data.organizationName || null);
    } catch { setError('Failed to load team'); }
    finally { setIsLoading(false); }
  }, []);

  const fetchPermissions = useCallback(async () => {
    try {
      const res = await fetch('/api/team/permissions');
      const data = await res.json();
      if (res.ok) setMemberPermissions(data.members || []);
    } catch { /* silent */ }
  }, []);

  const fetchCredits = useCallback(async () => {
    try {
      const [allocRes, balRes] = await Promise.all([
        fetch('/api/team/credits'),
        fetch('/api/billing/credits'),
      ]);
      const allocData = await allocRes.json();
      const balData = await balRes.json();
      if (allocRes.ok) setCreditAllocations(allocData.allocations || []);
      if (balRes.ok) setOrgBalance({
        monthlyRemaining: balData.monthlyRemaining || 0,
        monthlyTotal: balData.monthlyTotal || 0,
        topupRemaining: balData.topupRemaining || 0,
        totalRemaining: balData.totalRemaining || 0,
      });
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    fetchTeam();
  }, [fetchTeam]);

  // Sync activeTab with URL parameter
  useEffect(() => {
    if (tabParam && ['members', 'permissions', 'credits'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  useEffect(() => {
    if (isAdmin && activeTab === 'permissions') fetchPermissions();
    if (isAdmin && activeTab === 'credits') fetchCredits();
  }, [isAdmin, activeTab, fetchPermissions, fetchCredits]);

  const handleTabChange = (tabId: TabId) => {
    setActiveTab(tabId);
    const params = new URLSearchParams(searchParams.toString());
    if (tabId === 'members') {
      params.delete('tab');
    } else {
      params.set('tab', tabId);
    }
    const queryString = params.toString();
    router.push(queryString ? `/team?${queryString}` : '/team', { scroll: false });
  };

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
      if (!res.ok) { setInviteError(data.error || 'Failed to send invitation'); return; }
      setInviteEmail('');
      setInviteRole('member');
      await fetchTeam();
    } catch { setInviteError('Failed to send invitation'); }
    finally { setInviteLoading(false); }
  };

  const handleCancelInvite = async (invitationId: string) => {
    setActionLoading(invitationId);
    try {
      const res = await fetch('/api/team', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invitationId, action: 'cancel' }),
      });
      if (!res.ok) { const data = await res.json(); setError(data.error || 'Failed to cancel invitation'); return; }
      await fetchTeam();
    } catch { setError('Failed to cancel invitation'); }
    finally { setActionLoading(null); }
  };

  const handleRemoveMember = async (memberId: string) => {
    setActionLoading(memberId);
    try {
      const res = await fetch(`/api/team/${memberId}`, { method: 'DELETE' });
      if (!res.ok) { const data = await res.json(); setError(data.error || 'Failed to remove member'); return; }
      setSelectedMemberId(null);
      await fetchTeam();
    } catch { setError('Failed to remove member'); }
    finally { setActionLoading(null); }
  };

  const handleRoleChange = async (memberId: string, newRole: OrgMemberRole) => {
    setRoleChanging(memberId);
    try {
      const res = await fetch(`/api/team/${memberId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });
      if (!res.ok) { const data = await res.json(); setError(data.error || 'Failed to update role'); return; }
      setMembers(prev => prev.map(m => m.id === memberId ? { ...m, role: newRole } : m));
    } catch { setError('Failed to update role'); }
    finally { setRoleChanging(null); }
  };

  const handlePermissionChange = async (userId: string, feature: string, permissions: FeaturePermissions) => {
    setPermsSaving(true);
    try {
      const res = await fetch('/api/team/permissions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, feature, permissions }),
      });
      if (res.ok) await fetchPermissions();
    } catch { setError('Failed to update permissions'); }
    finally { setPermsSaving(false); }
  };

  const handleAllocateCredits = async (userId: string, feature: string, amount: number) => {
    const res = await fetch('/api/team/credits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, feature, amount }),
    });
    if (!res.ok) { const data = await res.json(); throw new Error(data.error || 'Failed to allocate'); }
    await fetchCredits();
  };

  const handleReclaimCredits = async (userId: string, feature: string, amount: number) => {
    const res = await fetch('/api/team/credits', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, feature, amount }),
    });
    if (!res.ok) { const data = await res.json(); throw new Error(data.error || 'Failed to reclaim'); }
    await fetchCredits();
  };

  const openMemberDetail = (memberId: string) => {
    const member = members.find(m => m.id === memberId);
    if (!member) return;

    setSelectedMemberId(memberId);
    const mp = memberPermissions.find(p => p.userId === member.user_id);
    setSelectedMemberPerms(mp?.permissions || {});
    setSelectedMemberCredits(creditAllocations.filter(a => a.user_id === member.user_id));

    // Fetch if not loaded
    if (memberPermissions.length === 0) fetchPermissions();
    if (creditAllocations.length === 0) fetchCredits();
  };

  const selectedMember = members.find(m => m.id === selectedMemberId);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' });
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
          <button onClick={() => { setError(''); fetchTeam(); }} className="ml-3 underline hover:no-underline">Retry</button>
        </div>
      </div>
    );
  }

  const tabs: { id: TabId; label: string; adminOnly: boolean }[] = [
    { id: 'members', label: 'Members', adminOnly: false },
    { id: 'permissions', label: 'Permissions', adminOnly: true },
    { id: 'credits', label: 'Credits', adminOnly: true },
  ];

  const totalAllocated = creditAllocations.reduce((sum, a) => sum + a.credits_allocated, 0);

  return (
    <div>
      {/* Error banner */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
          {error}
          <button onClick={() => setError('')} className="ml-3 underline hover:no-underline">Dismiss</button>
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <PageHeader
          icon={UserGroupIcon}
          title={organizationName || 'My Team'}
          subtitle={organizationName
            ? `Manage team members, permissions and credits for ${organizationName}.`
            : 'Manage your team members, permissions and credits.'}
        />
      </div>

      {/* Tabs */}
      <div className="mb-4 flex gap-4 border-b border-stone/10 overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
        {tabs
          .filter(tab => !tab.adminOnly || isAdmin)
          .map(tab => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={cn(
                'pb-3 px-1 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex-shrink-0',
                activeTab === tab.id
                  ? 'border-teal text-teal'
                  : 'border-transparent text-stone hover:text-charcoal'
              )}
            >
              {tab.label}
            </button>
          ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'members' && (
        <div>
          {/* Inline invite form (admin only) */}
          {isAdmin && (
            <form onSubmit={handleInvite} className="mb-6 bg-cream-warm rounded-xl border border-teal/[0.08] shadow-[0_2px_12px_rgba(15,31,29,0.03)] p-5">
              <h3 className="font-serif text-lg font-bold text-charcoal mb-3">Invite Member</h3>
              <div className="flex items-end gap-3 flex-wrap">
                <div className="flex-1 min-w-[220px]">
                  <label className="block text-xs font-medium text-stone mb-1">Email</label>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="colleague@company.com"
                    required
                    className="w-full px-3 py-2 border border-cream rounded-lg text-charcoal placeholder:text-stone/50 focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal text-sm"
                  />
                </div>
                <div className="w-36">
                  <label className="block text-xs font-medium text-stone mb-1">Role</label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as OrgMemberRole)}
                    className="w-full px-3 py-2 border border-cream rounded-lg text-charcoal bg-cream-warm focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal text-sm"
                  >
                    <option value="member">Member</option>
                    <option value="viewer">Viewer</option>
                    {userRole === 'owner' && <option value="admin">Admin</option>}
                  </select>
                </div>
                <Button
                  type="submit"
                  disabled={!inviteEmail.trim()}
                  isLoading={inviteLoading}
                  className="bg-teal hover:bg-teal-light text-white text-sm px-5 py-2"
                >
                  Send Invite
                </Button>
              </div>
              {inviteError && <p className="text-sm text-red-600 mt-2">{inviteError}</p>}
            </form>
          )}

          {/* Pending Invites */}
          {pendingInvites.length > 0 && (
            <div className="mb-6">
              <h3 className="font-serif text-lg font-bold text-charcoal mb-3 flex items-center gap-2">
                Pending Invitations
                <span className="bg-amber-100 text-amber-700 text-xs font-semibold px-2.5 py-1 rounded-full">{pendingInvites.length}</span>
              </h3>
              <div className="space-y-2">
                {pendingInvites.map(invite => (
                  <div key={invite.id} className="bg-amber-50/50 rounded-xl border border-amber-200/50 p-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-charcoal">{invite.email}</p>
                      <p className="text-xs text-stone">Invited {formatDate(invite.created_at)} — Expires {formatDate(invite.expires_at)}</p>
                    </div>
                    {isAdmin && (
                      <button
                        onClick={() => handleCancelInvite(invite.id)}
                        disabled={actionLoading === invite.id}
                        className="text-xs font-medium text-red-600 hover:text-red-400 bg-red-50 hover:bg-red-500/10 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-40"
                      >
                        {actionLoading === invite.id ? 'Cancelling...' : 'Cancel'}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Members Grid */}
          <h3 className="font-serif text-lg font-bold text-charcoal mb-3">
            Team Members <span className="text-stone font-normal text-sm">({members.length})</span>
          </h3>
          {members.length === 0 ? (
            <div className="bg-cream-warm rounded-xl border border-teal/[0.08] p-8 text-center text-stone">
              No team members yet. {isAdmin && 'Invite your first team member to get started.'}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {members.map(member => (
                <MemberCard
                  key={member.id}
                  member={member}
                  isAdmin={isAdmin}
                  onManage={() => openMemberDetail(member.id)}
                  onRoleChange={(id, role) => handleRoleChange(id, role as OrgMemberRole)}
                  onRemove={handleRemoveMember}
                  roleChanging={roleChanging}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'permissions' && isAdmin && (
        <PermissionsGrid
          members={memberPermissions}
          onPermissionChange={handlePermissionChange}
          saving={permsSaving}
        />
      )}

      {activeTab === 'credits' && isAdmin && (
        <div className="space-y-6">
          <TeamCreditSummary
            orgBalance={orgBalance}
            totalAllocated={totalAllocated}
          />
          <CreditAllocator
            orgBalance={orgBalance}
            allocations={creditAllocations}
            onAllocate={handleAllocateCredits}
            onReclaim={handleReclaimCredits}
            members={members
              .filter(m => m.role !== 'owner')
              .map(m => ({ userId: m.user_id, name: m.users?.full_name || 'Unknown', email: m.users?.email || '' }))
            }
          />
        </div>
      )}

      {/* Member Detail Panel */}
      {selectedMember && (
        <MemberDetailPanel
          member={selectedMember}
          permissions={selectedMemberPerms}
          creditAllocations={selectedMemberCredits}
          isOpen={!!selectedMemberId}
          onClose={() => setSelectedMemberId(null)}
          onPermissionChange={(feature, permissions) =>
            handlePermissionChange(selectedMember.user_id, feature, permissions)
          }
          onAllocateCredits={async (feature, amount) => {
            await handleAllocateCredits(selectedMember.user_id, feature, amount);
            setSelectedMemberCredits(creditAllocations.filter(a => a.user_id === selectedMember.user_id));
          }}
          onReclaimCredits={async (feature, amount) => {
            await handleReclaimCredits(selectedMember.user_id, feature, amount);
            setSelectedMemberCredits(creditAllocations.filter(a => a.user_id === selectedMember.user_id));
          }}
          onRemove={() => handleRemoveMember(selectedMember.id)}
          onRoleChange={(role) => handleRoleChange(selectedMember.id, role as OrgMemberRole)}
        />
      )}
    </div>
  );
}
