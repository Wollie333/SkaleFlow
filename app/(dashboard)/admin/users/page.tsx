'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button, PageHeader } from '@/components/ui';
import { UsersIcon, PlusIcon } from '@heroicons/react/24/outline';
import { AddUserModal } from '@/components/admin/add-user-modal';

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

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [tiers, setTiers] = useState<SubscriptionTier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [tierLoading, setTierLoading] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [orgPopup, setOrgPopup] = useState<string | null>(null);
  const [orgName, setOrgName] = useState('');
  const [orgLoading, setOrgLoading] = useState(false);
  const [showAddUser, setShowAddUser] = useState(false);
  const [betaLoading, setBetaLoading] = useState<string | null>(null);

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
        setError(data.error || 'Failed to update user');
        return;
      }

      await fetchUsers();
    } catch {
      setError('Failed to update user');
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
        setError(data.error || 'Failed to update tier');
        return;
      }

      await fetchUsers();
    } catch {
      setError('Failed to update tier');
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
        setError(data.error || 'Failed to pause user');
        return;
      }

      await fetchUsers();
    } catch {
      setError('Failed to pause user');
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
        setError(data.error || 'Failed to delete user');
        return;
      }

      setConfirmDelete(null);
      await fetchUsers();
    } catch {
      setError('Failed to delete user');
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
        setError(data.error || 'Failed to assign organization');
        return;
      }

      setOrgPopup(null);
      setOrgName('');
      await fetchUsers();
    } catch {
      setError('Failed to assign organization');
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
        setError(data.error || 'Failed to update AI beta status');
        return;
      }

      await fetchUsers();
    } catch {
      setError('Failed to update AI beta status');
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

  const pendingUsers = users.filter(u => !u.approved);
  const approvedUsers = users.filter(u => u.approved);

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
        <div className="text-stone">Loading users...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
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
      {/* Org Assignment Popup */}
      {orgPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl border border-teal/[0.08] p-6 w-full max-w-md mx-4">
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
              className="w-full px-4 py-2.5 border border-cream rounded-lg text-charcoal placeholder:text-stone/50 focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal mb-4"
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
        className="mb-8"
      />

      {/* Pending Users */}
      {pendingUsers.length > 0 && (
        <div className="mb-8">
          <h2 className="font-serif text-xl font-bold text-charcoal mb-4 flex items-center gap-2">
            Pending Approval
            <span className="bg-amber-100 text-amber-700 text-xs font-semibold px-2.5 py-1 rounded-full">
              {pendingUsers.length}
            </span>
          </h2>

          <div className="bg-white rounded-xl border border-teal/[0.08] shadow-[0_2px_12px_rgba(15,31,29,0.03)] overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-cream">
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
                    className="border-b border-cream/50 last:border-0 bg-amber-50/30 cursor-pointer hover:bg-amber-50/60 transition-colors"
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
                        {confirmDelete === user.id ? (
                          <>
                            <Button
                              onClick={() => handleDelete(user.id)}
                              className="bg-red-600 hover:bg-red-700 text-white text-sm px-4 py-2"
                              isLoading={actionLoading === user.id}
                            >
                              Confirm
                            </Button>
                            <Button
                              onClick={() => setConfirmDelete(null)}
                              className="bg-white hover:bg-cream text-stone border border-stone/20 text-sm px-4 py-2"
                            >
                              Cancel
                            </Button>
                          </>
                        ) : (
                          <Button
                            onClick={() => setConfirmDelete(user.id)}
                            className="bg-white hover:bg-red-50 text-red-600 border border-red-200 text-sm px-4 py-2"
                          >
                            Delete
                          </Button>
                        )}
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
          <div className="bg-white rounded-xl border border-teal/[0.08] p-8 text-center text-stone">
            No approved users yet.
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-teal/[0.08] shadow-[0_2px_12px_rgba(15,31,29,0.03)] overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-cream">
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
                    className="border-b border-cream/50 last:border-0 cursor-pointer hover:bg-cream-warm/40 transition-colors"
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
                          className="text-sm border border-cream rounded-lg px-2.5 py-1.5 bg-white text-charcoal focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal disabled:opacity-50 cursor-pointer"
                        >
                          <option value="">No tier</option>
                          {tiers.map(tier => (
                            <option key={tier.id} value={tier.id}>{tier.name}</option>
                          ))}
                        </select>
                      ) : (
                        <span className="text-stone text-sm">—</span>
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
                          <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                            user.ai_beta_enabled ? 'translate-x-5' : ''
                          }`} />
                        </button>
                      ) : (
                        <span className="text-stone text-xs">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-stone">
                      {user.last_login_at ? formatDate(user.last_login_at) : 'Never'}
                    </td>
                    <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                      {confirmDelete === user.id ? (
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            onClick={() => handleDelete(user.id)}
                            className="bg-red-600 hover:bg-red-700 text-white text-sm px-3 py-1.5"
                            isLoading={actionLoading === user.id}
                          >
                            Confirm Delete
                          </Button>
                          <Button
                            onClick={() => setConfirmDelete(null)}
                            className="bg-white hover:bg-cream text-stone border border-stone/20 text-sm px-3 py-1.5"
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handlePause(user.id)}
                            disabled={actionLoading === user.id || user.role === 'super_admin'}
                            className="text-xs font-medium text-amber-600 hover:text-amber-700 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            Pause
                          </button>
                          <button
                            onClick={() => setConfirmDelete(user.id)}
                            disabled={user.role === 'super_admin'}
                            className="text-xs font-medium text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            Delete
                          </button>
                        </div>
                      )}
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
