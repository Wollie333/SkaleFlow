'use client';

import { useState, useEffect, useCallback } from 'react';
import { PageHeader } from '@/components/ui';
import { SparklesIcon, MagnifyingGlassIcon, ArrowPathIcon, BookOpenIcon } from '@heroicons/react/24/outline';
import { CLIENT_MODEL_CATALOG } from '@/lib/ai/client-models';
import { cn } from '@/lib/utils';

interface Rule {
  id: string;
  model_id: string;
  scope_type: string;
  scope_id: string;
  is_enabled: boolean;
}

interface Tier {
  id: string;
  name: string;
  slug: string;
  sort_order: number;
}

interface UserRecord {
  id: string;
  email: string;
  full_name: string;
  role: string;
  org_members?: { organization_id: string }[];
}

export default function AdminModelsPage() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState('');

  // User override section
  const [userSearch, setUserSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserRecord | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [resettingUser, setResettingUser] = useState(false);

  const models = CLIENT_MODEL_CATALOG;

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/model-access');
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to load data');
        return;
      }
      setRules(data.rules);
      setTiers(data.tiers);
      setUsers(data.users);
    } catch {
      setError('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getRuleState = (modelId: string, scopeType: string, scopeId: string): boolean | null => {
    const rule = rules.find(r => r.model_id === modelId && r.scope_type === scopeType && r.scope_id === scopeId);
    if (!rule) return null; // No rule = default (enabled)
    return rule.is_enabled;
  };

  const getInheritedState = (modelId: string): boolean => {
    if (!selectedUser) return true;
    // Find tier slug for this user
    // For simplicity, check if there's a tier rule that disables it
    // The admin page shows what the tier baseline would be
    for (const tier of tiers) {
      const tierRule = rules.find(r => r.model_id === modelId && r.scope_type === 'tier' && r.scope_id === tier.slug);
      if (tierRule && !tierRule.is_enabled) {
        // We don't know which tier the user is on from this context,
        // so we just show all tier rules in the UI for reference
      }
    }
    return true; // Default enabled
  };

  const handleToggle = async (modelId: string, scopeType: string, scopeId: string) => {
    const key = `${modelId}-${scopeType}-${scopeId}`;
    setSaving(key);

    const currentState = getRuleState(modelId, scopeType, scopeId);

    try {
      if (currentState === null) {
        // No rule exists → create rule with is_enabled=false (toggling from default ON to OFF)
        const res = await fetch('/api/admin/model-access', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ modelId, scopeType, scopeId, isEnabled: false }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setRules(prev => [...prev, data.rule]);
      } else if (currentState === false) {
        // Rule exists with enabled=false → delete the rule (back to default ON)
        const res = await fetch('/api/admin/model-access', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ modelId, scopeType, scopeId }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setRules(prev => prev.filter(r => !(r.model_id === modelId && r.scope_type === scopeType && r.scope_id === scopeId)));
      } else {
        // Rule exists with enabled=true → delete it (back to default)
        const res = await fetch('/api/admin/model-access', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ modelId, scopeType, scopeId }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setRules(prev => prev.filter(r => !(r.model_id === modelId && r.scope_type === scopeType && r.scope_id === scopeId)));
      }
    } catch (err) {
      console.error('Toggle error:', err);
    }

    setSaving(null);
  };

  const handleUserToggle = async (modelId: string) => {
    if (!selectedUser) return;
    const key = `${modelId}-user-${selectedUser.id}`;
    setSaving(key);

    const currentState = getRuleState(modelId, 'user', selectedUser.id);

    try {
      if (currentState === null) {
        // No user override → figure out the inherited state and set opposite
        const inherited = getInheritedState(modelId);
        const res = await fetch('/api/admin/model-access', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            modelId,
            scopeType: 'user',
            scopeId: selectedUser.id,
            isEnabled: !inherited,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setRules(prev => [...prev, data.rule]);
      } else {
        // User override exists → delete it (revert to tier default)
        const res = await fetch('/api/admin/model-access', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            modelId,
            scopeType: 'user',
            scopeId: selectedUser.id,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setRules(prev => prev.filter(r => !(r.model_id === modelId && r.scope_type === 'user' && r.scope_id === selectedUser.id)));
      }
    } catch (err) {
      console.error('User toggle error:', err);
    }

    setSaving(null);
  };

  const handleResetUser = async () => {
    if (!selectedUser) return;
    setResettingUser(true);

    try {
      const userRules = rules.filter(r => r.scope_type === 'user' && r.scope_id === selectedUser.id);
      for (const rule of userRules) {
        await fetch('/api/admin/model-access', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            modelId: rule.model_id,
            scopeType: 'user',
            scopeId: selectedUser.id,
          }),
        });
      }
      setRules(prev => prev.filter(r => !(r.scope_type === 'user' && r.scope_id === selectedUser.id)));
    } catch (err) {
      console.error('Reset user error:', err);
    }

    setResettingUser(false);
  };

  const filteredUsers = users.filter(u =>
    u.full_name.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email.toLowerCase().includes(userSearch.toLowerCase())
  ).slice(0, 10);

  if (isLoading) {
    return (
      <div className="p-8">
        <PageHeader title="AI Models" icon={SparklesIcon} subtitle="Manage model access per tier and user" />
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-teal" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <PageHeader title="AI Models" icon={SparklesIcon} subtitle="Manage model access per tier and user" />
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-400 text-sm">{error}</div>
      </div>
    );
  }

  const userHasOverrides = selectedUser
    ? rules.some(r => r.scope_type === 'user' && r.scope_id === selectedUser.id)
    : false;

  return (
    <div className="p-8 max-w-5xl">
      <PageHeader
        title="AI Models"
        icon={SparklesIcon}
        subtitle="Control which AI models are available to users by subscription tier or individual override"
      />

      {/* Section A: Tier Rules */}
      <div className="mt-8">
        <h2 className="text-heading-md text-charcoal mb-1">Tier Access Rules</h2>
        <p className="text-sm text-stone mb-4">
          Toggle models on/off per subscription tier. Enabled by default when no rule is set.
        </p>

        <div className="bg-cream-warm rounded-xl border border-stone/10 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-stone/10">
                <th className="text-left px-4 py-3 text-sm font-semibold text-charcoal">Model</th>
                {tiers.map(tier => (
                  <th key={tier.id} className="text-center px-4 py-3 text-sm font-semibold text-charcoal">
                    {tier.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {models.map(model => (
                <tr key={model.id} className="border-b border-stone/5 last:border-0">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {model.isFree ? (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-teal/10 text-teal font-medium">Free</span>
                      ) : (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gold/10 text-gold font-medium">Paid</span>
                      )}
                      <div>
                        <p className="text-sm font-medium text-charcoal">{model.name}</p>
                        <p className="text-xs text-stone capitalize">{model.provider}</p>
                      </div>
                    </div>
                  </td>
                  {tiers.map(tier => {
                    const state = getRuleState(model.id, 'tier', tier.slug);
                    const isEnabled = state === null || state === true;
                    const isSavingThis = saving === `${model.id}-tier-${tier.slug}`;

                    return (
                      <td key={tier.id} className="text-center px-4 py-3">
                        <button
                          onClick={() => handleToggle(model.id, 'tier', tier.slug)}
                          disabled={isSavingThis}
                          className={cn(
                            'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-teal/30',
                            isEnabled ? 'bg-teal' : 'bg-stone/20',
                            isSavingThis && 'opacity-50'
                          )}
                        >
                          <span
                            className={cn(
                              'inline-block h-4 w-4 transform rounded-full bg-cream-warm transition-transform shadow-sm',
                              isEnabled ? 'translate-x-6' : 'translate-x-1'
                            )}
                          />
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section B: User Overrides */}
      <div className="mt-10">
        <h2 className="text-heading-md text-charcoal mb-1">User Overrides</h2>
        <p className="text-sm text-stone mb-4">
          Override tier defaults for a specific user. User-level rules take priority over tier rules.
        </p>

        {/* User search */}
        <div className="relative mb-4 max-w-sm">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone" />
          <input
            type="text"
            placeholder="Search users by name or email..."
            value={userSearch}
            onChange={(e) => {
              setUserSearch(e.target.value);
              setShowDropdown(true);
              if (!e.target.value) setSelectedUser(null);
            }}
            onFocus={() => setShowDropdown(true)}
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-stone/20 text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal"
          />
          {showDropdown && userSearch && filteredUsers.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-cream-warm border border-stone/15 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
              {filteredUsers.map(u => (
                <button
                  key={u.id}
                  onClick={() => {
                    setSelectedUser(u);
                    setUserSearch(u.full_name || u.email);
                    setShowDropdown(false);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-cream text-sm transition-colors"
                >
                  <span className="font-medium text-charcoal">{u.full_name || 'No name'}</span>
                  <span className="text-stone ml-2">{u.email}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {selectedUser && (
          <div className="bg-cream-warm rounded-xl border border-stone/10 overflow-hidden">
            <div className="px-4 py-3 border-b border-stone/10 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-charcoal">{selectedUser.full_name || selectedUser.email}</p>
                <p className="text-xs text-stone">{selectedUser.email}</p>
              </div>
              <div className="flex items-center gap-3">
                {selectedUser.org_members?.[0]?.organization_id && (
                  <button
                    onClick={() => window.open(`/brand/playbook?organizationId=${selectedUser.org_members![0].organization_id}`, '_blank')}
                    className="flex items-center gap-1.5 text-xs font-medium text-teal hover:text-teal-light transition-colors"
                  >
                    <BookOpenIcon className="w-3.5 h-3.5" />
                    View Playbook
                  </button>
                )}
                {userHasOverrides && (
                  <button
                    onClick={handleResetUser}
                    disabled={resettingUser}
                    className="flex items-center gap-1.5 text-xs font-medium text-stone hover:text-red-500 transition-colors disabled:opacity-50"
                  >
                    <ArrowPathIcon className="w-3.5 h-3.5" />
                    {resettingUser ? 'Resetting...' : 'Reset to tier defaults'}
                  </button>
                )}
              </div>
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b border-stone/10">
                  <th className="text-left px-4 py-2 text-xs font-semibold text-stone uppercase">Model</th>
                  <th className="text-center px-4 py-2 text-xs font-semibold text-stone uppercase">Override</th>
                  <th className="text-center px-4 py-2 text-xs font-semibold text-stone uppercase">Status</th>
                </tr>
              </thead>
              <tbody>
                {models.map(model => {
                  const userRule = getRuleState(model.id, 'user', selectedUser.id);
                  const hasOverride = userRule !== null;
                  const effectiveEnabled = hasOverride ? userRule : true;
                  const isSavingThis = saving === `${model.id}-user-${selectedUser.id}`;

                  return (
                    <tr key={model.id} className="border-b border-stone/5 last:border-0">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {model.isFree ? (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-teal/10 text-teal font-medium">Free</span>
                          ) : (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-gold/10 text-gold font-medium">Paid</span>
                          )}
                          <p className="text-sm font-medium text-charcoal">{model.name}</p>
                        </div>
                      </td>
                      <td className="text-center px-4 py-3">
                        <button
                          onClick={() => handleUserToggle(model.id)}
                          disabled={isSavingThis}
                          className={cn(
                            'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-teal/30',
                            effectiveEnabled ? 'bg-teal' : 'bg-stone/20',
                            isSavingThis && 'opacity-50'
                          )}
                        >
                          <span
                            className={cn(
                              'inline-block h-4 w-4 transform rounded-full bg-cream-warm transition-transform shadow-sm',
                              effectiveEnabled ? 'translate-x-6' : 'translate-x-1'
                            )}
                          />
                        </button>
                      </td>
                      <td className="text-center px-4 py-3">
                        {hasOverride ? (
                          <span className="text-xs font-medium text-gold">Overridden</span>
                        ) : (
                          <span className="text-xs text-stone">Tier default</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {!selectedUser && (
          <div className="bg-cream-warm rounded-xl p-8 text-center">
            <MagnifyingGlassIcon className="w-8 h-8 text-stone/40 mx-auto mb-2" />
            <p className="text-sm text-stone">Search and select a user above to manage their model access overrides</p>
          </div>
        )}
      </div>
    </div>
  );
}
