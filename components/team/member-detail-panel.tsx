'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui';
import {
  XMarkIcon,
  ChevronDownIcon,
  ShieldCheckIcon,
  CurrencyDollarIcon,
  KeyIcon,
  TrashIcon,
  PlusIcon,
  MinusIcon,
} from '@heroicons/react/24/outline';

type MemberRole = 'owner' | 'admin' | 'member' | 'viewer';

export interface FeaturePermissions {
  access?: boolean;
  chat?: boolean;
  edit_variables?: boolean;
  create?: boolean;
  edit?: boolean;
  schedule?: boolean;
  publish?: boolean;
}

interface MemberUser {
  id: string;
  email: string;
  full_name: string | null;
  last_login_at: string | null;
}

interface Member {
  id: string;
  user_id: string;
  role: MemberRole;
  joined_at: string;
  users: MemberUser | null;
}

interface CreditAllocation {
  feature: string;
  credits_allocated: number;
  credits_remaining: number;
}

interface MemberDetailPanelProps {
  member: Member | null;
  permissions: Record<string, FeaturePermissions>;
  creditAllocations: CreditAllocation[];
  isOpen: boolean;
  onClose: () => void;
  onPermissionChange: (feature: string, permissions: FeaturePermissions) => void;
  onAllocateCredits: (feature: string, amount: number) => Promise<void>;
  onReclaimCredits: (feature: string, amount: number) => Promise<void>;
  onRemove: () => void;
  onRoleChange: (role: MemberRole) => void;
}

const ROLE_STYLES: Record<MemberRole, string> = {
  owner: 'bg-gold/15 text-gold',
  admin: 'bg-purple-100 text-purple-700',
  member: 'bg-teal/10 text-teal',
  viewer: 'bg-stone/10 text-stone',
};

const ROLE_LABELS: Record<MemberRole, string> = {
  owner: 'Owner',
  admin: 'Admin',
  member: 'Member',
  viewer: 'Viewer',
};

const ASSIGNABLE_ROLES: MemberRole[] = ['admin', 'member', 'viewer'];

const FEATURES = ['brand_engine', 'content_engine', 'pipeline', 'ad_campaigns'] as const;

const FEATURE_LABELS: Record<string, string> = {
  brand_engine: 'Brand Engine',
  content_engine: 'Content Engine',
  pipeline: 'Pipeline',
  ad_campaigns: 'Ad Campaigns',
};

const FEATURE_PERMISSIONS: Record<string, { key: keyof FeaturePermissions; label: string }[]> = {
  brand_engine: [
    { key: 'access', label: 'Access' },
    { key: 'chat', label: 'Chat' },
    { key: 'edit_variables', label: 'Edit Variables' },
  ],
  content_engine: [
    { key: 'access', label: 'Access' },
    { key: 'create', label: 'Create' },
    { key: 'edit', label: 'Edit' },
    { key: 'schedule', label: 'Schedule' },
    { key: 'publish', label: 'Publish' },
  ],
  pipeline: [
    { key: 'access', label: 'Access' },
    { key: 'create', label: 'Create' },
    { key: 'edit', label: 'Edit' },
  ],
  ad_campaigns: [
    { key: 'access', label: 'Access' },
    { key: 'create', label: 'Create' },
    { key: 'edit', label: 'Edit' },
    { key: 'publish', label: 'Publish' },
  ],
};

function getInitial(member: Member): string {
  if (member.users?.full_name) return member.users.full_name.charAt(0).toUpperCase();
  if (member.users?.email) return member.users.email.charAt(0).toUpperCase();
  return '?';
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-ZA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function MemberDetailPanel({
  member,
  permissions,
  creditAllocations,
  isOpen,
  onClose,
  onPermissionChange,
  onAllocateCredits,
  onReclaimCredits,
  onRemove,
  onRoleChange,
}: MemberDetailPanelProps) {
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [creditInputs, setCreditInputs] = useState<Record<string, { mode: 'allocate' | 'reclaim'; amount: number } | null>>({});
  const [creditProcessing, setCreditProcessing] = useState<string | null>(null);

  if (!member) return null;

  const displayName = member.users?.full_name || member.users?.email || 'Unknown User';
  const email = member.users?.email || '';
  const isOwner = member.role === 'owner';

  const handleTogglePermission = (feature: string, permKey: keyof FeaturePermissions) => {
    const current = permissions[feature] || {};
    const updated = { ...current, [permKey]: !current[permKey] };

    // If turning off access, turn off all permissions for this feature
    if (permKey === 'access' && current.access) {
      const featurePermKeys = FEATURE_PERMISSIONS[feature] || [];
      for (const p of featurePermKeys) {
        updated[p.key] = false;
      }
    }

    onPermissionChange(feature, updated);
  };

  const handleCreditAction = async (feature: string) => {
    const input = creditInputs[feature];
    if (!input || input.amount <= 0) return;

    setCreditProcessing(feature);
    try {
      if (input.mode === 'allocate') {
        await onAllocateCredits(feature, input.amount);
      } else {
        await onReclaimCredits(feature, input.amount);
      }
      setCreditInputs((prev) => ({ ...prev, [feature]: null }));
    } finally {
      setCreditProcessing(null);
    }
  };

  const openCreditInput = (feature: string, mode: 'allocate' | 'reclaim') => {
    setCreditInputs((prev) => ({ ...prev, [feature]: { mode, amount: 100 } }));
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-dark/20 backdrop-blur-sm z-40 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Panel */}
      <div
        className={cn(
          'fixed inset-y-0 right-0 w-[420px] max-w-full bg-cream-warm shadow-xl border-l border-stone/10 z-50 flex flex-col transition-transform duration-300',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-stone/10">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-teal/10 flex items-center justify-center flex-shrink-0">
                <span className="text-lg font-semibold text-teal">{getInitial(member)}</span>
              </div>
              <div>
                <h2 className="text-base font-semibold text-charcoal">{displayName}</h2>
                <p className="text-xs text-stone">{email}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-stone hover:text-charcoal hover:bg-cream transition-colors"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Role */}
          <div className="flex items-center gap-3 mt-3">
            <div className="relative">
              {!isOwner ? (
                <button
                  onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
                  className={cn(
                    'text-xs font-semibold px-2.5 py-1 rounded-full inline-flex items-center gap-1',
                    ROLE_STYLES[member.role]
                  )}
                >
                  {ROLE_LABELS[member.role]}
                  <ChevronDownIcon className="w-3 h-3" />
                </button>
              ) : (
                <span
                  className={cn(
                    'text-xs font-semibold px-2.5 py-1 rounded-full',
                    ROLE_STYLES[member.role]
                  )}
                >
                  {ROLE_LABELS[member.role]}
                </span>
              )}

              {roleDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setRoleDropdownOpen(false)} />
                  <div className="absolute top-full left-0 mt-1 z-50 bg-cream-warm rounded-lg border border-stone/10 shadow-lg py-1 min-w-[120px]">
                    {ASSIGNABLE_ROLES.map((role) => (
                      <button
                        key={role}
                        onClick={() => {
                          setRoleDropdownOpen(false);
                          onRoleChange(role);
                        }}
                        className={cn(
                          'w-full text-left px-3 py-1.5 text-xs font-medium transition-colors',
                          role === member.role
                            ? 'bg-teal/5 text-teal'
                            : 'text-charcoal hover:bg-cream'
                        )}
                      >
                        {ROLE_LABELS[role]}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            <span className="text-xs text-stone/60">
              Joined {formatDate(member.joined_at)}
            </span>

            {member.users?.last_login_at && (
              <span className="text-xs text-stone/60">
                Last active {formatDate(member.users.last_login_at)}
              </span>
            )}
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Permissions Section */}
          <div className="px-6 py-5 border-b border-stone/10">
            <div className="flex items-center gap-2 mb-4">
              <KeyIcon className="w-4 h-4 text-teal" />
              <h3 className="text-sm font-semibold text-charcoal">Permissions</h3>
            </div>

            <div className="space-y-4">
              {FEATURES.map((feature) => {
                const featurePerms = permissions[feature] || {};
                const permDefs = FEATURE_PERMISSIONS[feature] || [];
                const hasAccess = featurePerms.access === true;

                return (
                  <div key={feature} className="rounded-lg border border-stone/10 p-3">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-xs font-semibold text-charcoal">
                        {FEATURE_LABELS[feature]}
                      </h4>
                      <button
                        onClick={() => handleTogglePermission(feature, 'access')}
                        className={cn(
                          'relative w-9 h-5 rounded-full transition-colors duration-200',
                          hasAccess ? 'bg-teal' : 'bg-stone/20'
                        )}
                      >
                        <span
                          className={cn(
                            'absolute top-0.5 w-4 h-4 rounded-full bg-cream-warm shadow-sm transition-transform duration-200',
                            hasAccess ? 'translate-x-[18px]' : 'translate-x-0.5'
                          )}
                        />
                      </button>
                    </div>

                    {hasAccess && (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {permDefs
                          .filter((p) => p.key !== 'access')
                          .map((perm) => (
                            <label
                              key={perm.key}
                              className="flex items-center gap-1.5 cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={featurePerms[perm.key] === true}
                                onChange={() => handleTogglePermission(feature, perm.key)}
                                className="w-3.5 h-3.5 rounded border-stone/30 text-teal focus:ring-teal/30"
                              />
                              <span className="text-xs text-stone">{perm.label}</span>
                            </label>
                          ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Credits Section */}
          <div className="px-6 py-5 border-b border-stone/10">
            <div className="flex items-center gap-2 mb-4">
              <CurrencyDollarIcon className="w-4 h-4 text-gold" />
              <h3 className="text-sm font-semibold text-charcoal">Credit Allocations</h3>
            </div>

            <div className="space-y-3">
              {creditAllocations.length === 0 ? (
                <p className="text-xs text-stone text-center py-4">No credits allocated yet</p>
              ) : (
                creditAllocations.map((alloc) => {
                  const used = alloc.credits_allocated - alloc.credits_remaining;
                  const usagePercent =
                    alloc.credits_allocated > 0
                      ? Math.round((used / alloc.credits_allocated) * 100)
                      : 0;
                  const input = creditInputs[alloc.feature];
                  const isProcessing = creditProcessing === alloc.feature;

                  return (
                    <div
                      key={alloc.feature}
                      className="rounded-lg border border-stone/10 p-3"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-charcoal">
                          {FEATURE_LABELS[alloc.feature] || alloc.feature}
                        </span>
                        <span className="text-xs text-stone">
                          {alloc.credits_remaining.toLocaleString()} / {alloc.credits_allocated.toLocaleString()}
                        </span>
                      </div>

                      {/* Usage bar */}
                      <div className="w-full bg-stone/10 rounded-full h-1.5 mb-2">
                        <div
                          className={cn(
                            'h-1.5 rounded-full transition-all',
                            usagePercent > 80 ? 'bg-red-400' : usagePercent > 50 ? 'bg-gold' : 'bg-teal'
                          )}
                          style={{ width: `${Math.min(usagePercent, 100)}%` }}
                        />
                      </div>

                      {input ? (
                        <div className="flex items-center gap-1.5 mt-2">
                          <input
                            type="number"
                            value={input.amount}
                            onChange={(e) =>
                              setCreditInputs((prev) => ({
                                ...prev,
                                [alloc.feature]: { ...input, amount: Number(e.target.value) },
                              }))
                            }
                            min={1}
                            max={input.mode === 'reclaim' ? alloc.credits_remaining : undefined}
                            className="w-20 px-2 py-1 border border-stone/20 rounded text-xs text-charcoal focus:outline-none focus:ring-2 focus:ring-teal/30"
                            autoFocus
                          />
                          <button
                            onClick={() => handleCreditAction(alloc.feature)}
                            disabled={isProcessing}
                            className={cn(
                              'px-2 py-1 text-xs font-medium text-white rounded disabled:opacity-50 transition-colors',
                              input.mode === 'allocate'
                                ? 'bg-teal hover:bg-teal/90'
                                : 'bg-gold hover:bg-gold/90'
                            )}
                          >
                            {isProcessing ? '...' : input.mode === 'allocate' ? 'Add' : 'Reclaim'}
                          </button>
                          <button
                            onClick={() =>
                              setCreditInputs((prev) => ({ ...prev, [alloc.feature]: null }))
                            }
                            className="px-2 py-1 text-xs text-stone hover:text-charcoal transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 mt-1">
                          <button
                            onClick={() => openCreditInput(alloc.feature, 'allocate')}
                            className="p-1 rounded text-teal hover:bg-teal/5 transition-colors"
                            title="Allocate credits"
                          >
                            <PlusIcon className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => openCreditInput(alloc.feature, 'reclaim')}
                            disabled={alloc.credits_remaining <= 0}
                            className="p-1 rounded text-gold hover:bg-gold/5 transition-colors disabled:opacity-30"
                            title="Reclaim credits"
                          >
                            <MinusIcon className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Remove Member */}
          {!isOwner && (
            <div className="px-6 py-5">
              <div className="flex items-center gap-2 mb-3">
                <ShieldCheckIcon className="w-4 h-4 text-red-400" />
                <h3 className="text-sm font-semibold text-charcoal">Danger Zone</h3>
              </div>

              {confirmRemove ? (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                  <p className="text-sm text-red-400 font-medium mb-1">
                    Remove {displayName}?
                  </p>
                  <p className="text-xs text-red-600 mb-3">
                    This will revoke all access and reclaim any unused credits. This action cannot be undone.
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => {
                        setConfirmRemove(false);
                        onRemove();
                      }}
                    >
                      <TrashIcon className="w-3.5 h-3.5" />
                      Confirm Removal
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setConfirmRemove(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmRemove(true)}
                  className="w-full px-4 py-2.5 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                >
                  Remove Member
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
