'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button, PageHeader } from '@/components/ui';
import { UsersIcon, PlusIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { AddUserModal } from '@/components/admin/add-user-modal';
import { ConfirmDialog } from '@/components/ui/dialog';
import { useToast } from '@/hooks/useToast';

interface SubscriptionTier {
  id: string;
  name: string;
  slug: string;
  sort_order: number;
}

interface UserOrg {
  organization_id: string;
  role: string;
  team_role: string | null;
  organizations: {
    name: string;
    subscriptions: {
      tier_id: string | null;
      subscription_tiers: {
        id: string;
        name: string;
      } | null;
    }[];
  } | null;
}

interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
  approved: boolean;
  ai_beta_enabled?: boolean;
  created_at: string;
  last_login_at: string | null;
  org_members: UserOrg[];
}

type RoleFilter = 'all' | 'client' | 'team_member' | 'super_admin';

export default function AdminUsersPage() {
  const router = useRouter();
  const toast = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [tiers, setTiers] = useState<SubscriptionTier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [tierLoading, setTierLoading] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [orgPopup, setOrgPopup] = useState<string | null>(null);
  const [orgName, setOrgName] = useState('');
  const [orgLoading, setOrgLoading] = useState(false);
  const [showAddUser, setShowAddUser] = useState(false);
  const [betaLoading, setBetaLoading] = useState<string | null>(null);

  // Search & filter
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/users');
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to load users');
        return;
      }

      setUsers(data.users);
      setTiers(data.tiers || []);
    } catch {
      setError('Failed to load users');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Filtered users
  const filteredUsers = useMemo(() => {
    let result = users;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        u => u.full_name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
      );
    }

    if (roleFilter !== 'all') {
      result = result.filter(u => u.role === roleFilter);
    }

    return result;
  }, [users, searchQuery, roleFilter]);

  const pendingUsers = filteredUsers.filter(u => !u.approved);
  const approvedUsers = filteredUsers.filter(u => u.approved);

  const handleApproval = async (userId: string, approved: boolean) => {
    setActionLoading(userId);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, approved }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || 'Failed to update user');
        return;
      }

      toast.success(approved ? 'User approved' : 'User approval revoked');
      await fetchUsers();
    } catch {
      toast.error('Failed to update user');
    } finally {
      setActionLoading(null);
    }
  };

  const handleTierChange = async (userId: string, tierId: string) => {
    setTierLoading(userId);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, tierId: tierId || null }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || 'Failed to update tier');
        return;
      }

      toast.success('Subscription tier updated');
      await fetchUsers();
    } catch {
      toast.error('Failed to update tier');
    } finally {
      setTierLoading(null);
    }
  };

  const handlePause = async (userId: string) => {
    setActionLoading(userId);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action: 'pause' }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || 'Failed to pause user');
        return;
      }

      toast.success('User account paused');
      await fetchUsers();
    } catch {
      toast.error('Failed to pause user');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (userId: string) => {
    setActionLoading(userId);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action: 'delete' }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || 'Failed to delete user');
        return;
      }

      setDeleteTarget(null);
      toast.success('User deleted');
      await fetchUsers();
    } catch {
      toast.error('Failed to delete user');
    } finally {
      setActionLoading(null);
    }
  };

  const handleAssignOrg = async () => {
    if (!orgPopup || !orgName.trim()) return;
    setOrgLoading(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: orgPopup, action: 'assign_org', orgName: orgName.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || 'Failed to assign organization');
        return;
      }

      setOrgPopup(null);
      setOrgName('');
      toast.success('Organization assigned');
      await fetchUsers();
    } catch {
      toast.error('Failed to assign organization');
    } finally {
      setOrgLoading(false);
    }
  };

  const handleAiBetaToggle = async (userId: string, enabled: boolean) => {
    setBetaLoading(userId);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, aiBetaEnabled: enabled }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || 'Failed to update AI beta status');
        return;
      }

      toast.success(enabled ? 'AI beta enabled' : 'AI beta disabled');
      await fetchUsers();
    } catch {
      toast.error('Failed to update AI beta status');
    } finally {
      setBetaLoading(null);
    }
  };

  const getUserTier = (user: User): { id: string; name: string } | null => {
    const org = user.org_members?.[0]?.organizations;
    if (!org) return null;
    const sub = org.subscriptions?.[0];
    if (!sub?.subscription_tiers) return null;
    return sub.subscription_tiers;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-ZA', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  // Skeleton loading
  if (isLoading) {
    return (
      <div>
        <div className="mb-8 flex items-center justify-between">
          <div>
            <div className="h-7 w-48 bg-stone/10 rounded-lg animate-pulse mb-2" />
            <div className="h-4 w-72 bg-stone/10 rounded animate-pulse" />
          </div>
          <div className="h-9 w-24 bg-stone/10 rounded-lg animate-pulse" />
        </div>
        <div className="bg-cream-warm rounded-xl border border-teal/[0.08] overflow-hidden">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-6 py-4 border-b border-stone/10 last:border-0">
              <div className="h-4 w-32 bg-stone/10 rounded animate-pulse" />
              <div className="h-4 w-48 bg-stone/10 rounded animate-pulse" />
              <div className="h-4 w-28 bg-stone/10 rounded animate-pulse" />
              <div className="h-4 w-20 bg-stone/10 rounded animate-pulse" />
              <div className="flex-1" />
              <div className="h-7 w-16 bg-stone/10 rounded-lg animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error && users.length === 0) {
    return (
      <div className="p-6">
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
          {error}
          <button
            onClick={() => { setError(''); fetchUsers(); }}
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
      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && handleDelete(deleteTarget.id)}
        title="Delete User"
        message={`Are you sure you want to permanently delete ${deleteTarget?.name || 'this user'}? This action cannot be undone. All associated data will be removed.`}
        confirmText={actionLoading ? 'Deleting...' : 'Delete User'}
        variant="danger"
      />

      {/* Org Assignment Popup */}
      {orgPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-cream-warm rounded-xl shadow-xl border border-teal/[0.08] p-6 w-full max-w-md mx-4">
            <h3 className="font-serif text-lg font-bold text-charcoal mb-1">
              Assign Organization
            </h3>
            <p className="text-sm text-stone mb-4">
              Create a new organization for this user.
            </p>
            <input
              type="text"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              placeholder="Organization name"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleAssignOrg()}
              className="w-full px-4 py-2.5 border border-stone/10 rounded-lg text-charcoal placeholder:text-stone/50 focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal mb-4"
            />
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => { setOrgPopup(null); setOrgName(''); }}
                className="text-sm font-medium text-stone hover:text-charcoal px-4 py-2 rounded-lg hover:bg-cream transition-colors"
              >
                Cancel
              </button>
              <Button
                onClick={handleAssignOrg}
                disabled={!orgName.trim()}
                isLoading={orgLoading}
                className="bg-teal hover:bg-teal-light text-white text-sm px-5 py-2 disabled:opacity-50"
              >
                Create & Assign
              </Button>
            </div>
          </div>
        </div>
      )}

      <AddUserModal
        isOpen={showAddUser}
        onClose={() => setShowAddUser(false)}
        onCreated={() => fetchUsers()}
        tiers={tiers}
      />

      <PageHeader
        icon={UsersIcon}
        title="User Management"
        subtitle="Manage user accounts and permissions"
        breadcrumbs={[{ label: 'Admin' }, { label: 'Users' }]}
        action={
          <Button
            onClick={() => setShowAddUser(true)}
            className="bg-teal hover:bg-teal-light text-white text-sm px-4 py-2 flex items-center gap-1.5"
          >
            <PlusIcon className="w-4 h-4" />
            Add User
          </Button>
        }
        className="mb-6"
      />

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-6">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full pl-9 pr-4 py-2 text-sm border border-stone/10 rounded-lg bg-cream-warm text-charcoal placeholder:text-stone/50 focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value as RoleFilter)}
          className="text-sm border border-stone/10 rounded-lg px-3 py-2 bg-cream-warm text-charcoal focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal cursor-pointer"
        >
          <option value="all">All Roles</option>
          <option value="client">Client</option>
          <option value="team_member">Team Member</option>
          <option value="super_admin">Super Admin</option>
        </select>
      </div>

      {/* Pending Users */}
      {pendingUsers.length > 0 && (
        <div className="mb-8">
          <h2 className="font-serif text-xl font-bold text-charcoal mb-4 flex items-center gap-2">
            Pending Approval
            <span className="bg-gold/20 text-gold text-xs font-semibold px-2.5 py-1 rounded-full">
              {pendingUsers.length}
            </span>
          </h2>

          <div className="bg-cream-warm rounded-xl border border-teal/[0.08] shadow-[0_2px_12px_rgba(15,31,29,0.03)] overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-stone/10">
                  <th className="text-left px-6 py-4 text-xs font-semibold text-stone uppercase tracking-wider">Name</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-stone uppercase tracking-wider">Email</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-stone uppercase tracking-wider">Organization</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-stone uppercase tracking-wider">Registered</th>
                  <th className="text-right px-6 py-4 text-xs font-semibold text-stone uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingUsers.map(user => (
                  <tr
                    key={user.id}
                    onClick={() => router.push(`/admin/users/${user.id}`)}
                    className="border-b border-stone/10 last:border-0 bg-gold/[0.03] cursor-pointer hover:bg-gold/[0.06] transition-colors"
                  >
                    <td className="px-6 py-4">
                      <span className="font-medium text-charcoal">{user.full_name}</span>
                    </td>
                    <td className="px-6 py-4 text-stone">{user.email}</td>
                    <td className="px-6 py-4">
                      {user.org_members?.[0]?.organizations?.name ? (
                        <div>
                          <p className="text-charcoal font-medium text-sm">{user.org_members[0].organizations.name}</p>
                          <p className="text-xs text-stone capitalize">
                            {user.org_members[0].role === 'owner' ? 'Owner' : user.org_members[0].role}
                            {user.org_members[0].team_role ? ` / ${user.org_members[0].team_role}` : ''}
                          </p>
                        </div>
                      ) : (
                        <button
                          onClick={(e) => { e.stopPropagation(); setOrgPopup(user.id); }}
                          className="text-teal hover:text-teal-light text-sm font-medium underline"
                        >
                          + Add org
                        </button>
                      )}
                    </td>
                    <td className="px-6 py-4 text-stone">{formatDate(user.created_at)}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                        <Button
                          onClick={() => handleApproval(user.id, true)}
                          className="bg-teal hover:bg-teal-light text-white text-sm px-4 py-2"
                          isLoading={actionLoading === user.id}
                        >
                          Approve
                        </Button>
                        <Button
                          onClick={() => setDeleteTarget({ id: user.id, name: user.full_name })}
                          className="bg-cream-warm hover:bg-red-500/10 text-red-600 border border-red-500/20 text-sm px-4 py-2"
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Approved Users */}
      <div>
        <h2 className="font-serif text-xl font-bold text-charcoal mb-4">
          Approved Users
          <span className="text-stone font-normal text-base ml-2">({approvedUsers.length})</span>
        </h2>

        {approvedUsers.length === 0 ? (
          <div className="bg-cream-warm rounded-xl border border-teal/[0.08] p-8 text-center text-stone">
            {searchQuery || roleFilter !== 'all' ? 'No users match your search.' : 'No approved users yet.'}
          </div>
        ) : (
          <div className="bg-cream-warm rounded-xl border border-teal/[0.08] shadow-[0_2px_12px_rgba(15,31,29,0.03)] overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-stone/10">
                  <th className="text-left px-6 py-4 text-xs font-semibold text-stone uppercase tracking-wider">Name</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-stone uppercase tracking-wider">Email</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-stone uppercase tracking-wider">Organization</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-stone uppercase tracking-wider">Tier</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-stone uppercase tracking-wider">Role</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-stone uppercase tracking-wider">AI Beta</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-stone uppercase tracking-wider">Last Login</th>
                  <th className="text-right px-6 py-4 text-xs font-semibold text-stone uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {approvedUsers.map(user => (
                  <tr
                    key={user.id}
                    onClick={() => router.push(`/admin/users/${user.id}`)}
                    className="border-b border-stone/10 last:border-0 cursor-pointer hover:bg-cream/40 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <span className="font-medium text-charcoal">{user.full_name}</span>
                    </td>
                    <td className="px-6 py-4 text-stone">{user.email}</td>
                    <td className="px-6 py-4">
                      {user.org_members?.[0]?.organizations?.name ? (
                        <div>
                          <p className="text-charcoal font-medium text-sm">{user.org_members[0].organizations.name}</p>
                          <p className="text-xs text-stone capitalize">
                            {user.org_members[0].role === 'owner' ? 'Owner' : user.org_members[0].role}
                            {user.org_members[0].team_role ? ` / ${user.org_members[0].team_role}` : ''}
                          </p>
                        </div>
                      ) : (
                        <button
                          onClick={(e) => { e.stopPropagation(); setOrgPopup(user.id); }}
                          className="text-teal hover:text-teal-light text-sm font-medium underline"
                        >
                          + Add org
                        </button>
                      )}
                    </td>
                    <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                      {user.org_members?.[0]?.organization_id ? (
                        <select
                          value={getUserTier(user)?.id || ''}
                          onChange={(e) => handleTierChange(user.id, e.target.value)}
                          disabled={tierLoading === user.id}
                          className="text-sm border border-stone/10 rounded-lg px-2.5 py-1.5 bg-cream-warm text-charcoal focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal disabled:opacity-50 cursor-pointer"
                        >
                          <option value="">No tier</option>
                          {tiers.map(tier => (
                            <option key={tier.id} value={tier.id}>{tier.name}</option>
                          ))}
                        </select>
                      ) : (
                        <span className="text-stone text-sm">&mdash;</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                        user.role === 'super_admin'
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-teal/10 text-teal'
                      }`}>
                        {user.role === 'super_admin' ? 'Super Admin' : user.role === 'team_member' ? 'Team Member' : 'Client'}
                      </span>
                    </td>
                    <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                      {user.role !== 'super_admin' ? (
                        <button
                          onClick={() => handleAiBetaToggle(user.id, !user.ai_beta_enabled)}
                          disabled={betaLoading === user.id}
                          className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 disabled:opacity-50 ${
                            user.ai_beta_enabled ? 'bg-teal' : 'bg-stone/20'
                          }`}
                        >
                          <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-cream-warm shadow transition-transform ${
                            user.ai_beta_enabled ? 'translate-x-5' : ''
                          }`} />
                        </button>
                      ) : (
                        <span className="text-stone text-xs">&mdash;</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-stone">
                      {user.last_login_at ? formatDate(user.last_login_at) : 'Never'}
                    </td>
                    <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handlePause(user.id)}
                          disabled={actionLoading === user.id || user.role === 'super_admin'}
                          className="text-xs font-medium text-amber-600 hover:text-amber-700 bg-amber-500/10 hover:bg-amber-500/20 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          Pause
                        </button>
                        <button
                          onClick={() => setDeleteTarget({ id: user.id, name: user.full_name })}
                          disabled={user.role === 'super_admin'}
                          className="text-xs font-medium text-red-600 hover:text-red-400 bg-red-500/10 hover:bg-red-500/20 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
