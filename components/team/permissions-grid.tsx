'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import {
  CheckCircleIcon,
  XCircleIcon,
  ChevronDownIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';

export interface FeaturePermissions {
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

interface PermissionsGridProps {
  members: MemberPermissions[];
  onPermissionChange: (userId: string, feature: string, permissions: FeaturePermissions) => void;
  saving: boolean;
}

const FEATURES = ['brand_engine', 'content_engine', 'pipeline', 'ad_campaigns'] as const;

const FEATURE_LABELS: Record<string, string> = {
  brand_engine: 'Brand Engine',
  content_engine: 'Content Engine',
  pipeline: 'Pipeline',
  ad_campaigns: 'Ad Campaigns',
};

const PERMISSION_KEYS: (keyof FeaturePermissions)[] = [
  'access',
  'chat',
  'edit_variables',
  'create',
  'edit',
  'schedule',
  'publish',
];

const PERMISSION_LABELS: Record<keyof FeaturePermissions, string> = {
  access: 'Access',
  chat: 'Chat',
  edit_variables: 'Edit Variables',
  create: 'Create',
  edit: 'Edit',
  schedule: 'Schedule',
  publish: 'Publish',
};

const FEATURE_PERMISSIONS: Record<string, (keyof FeaturePermissions)[]> = {
  brand_engine: ['access', 'chat', 'edit_variables'],
  content_engine: ['access', 'create', 'edit', 'schedule', 'publish'],
  pipeline: ['access', 'create', 'edit'],
  ad_campaigns: ['access', 'create', 'edit', 'publish'],
};

const ROLE_STYLES: Record<string, string> = {
  owner: 'bg-gold/15 text-gold',
  admin: 'bg-purple-100 text-purple-700',
  member: 'bg-teal/10 text-teal',
  viewer: 'bg-stone/10 text-stone',
};

function getInitial(user: { full_name: string | null; email: string }): string {
  if (user.full_name) return user.full_name.charAt(0).toUpperCase();
  return user.email.charAt(0).toUpperCase();
}

export function PermissionsGrid({
  members,
  onPermissionChange,
  saving,
}: PermissionsGridProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleRow = (userId: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  };

  const hasAccess = (member: MemberPermissions, feature: string): boolean => {
    return member.permissions[feature]?.access === true;
  };

  const handleToggleAccess = (member: MemberPermissions, feature: string) => {
    const current = member.permissions[feature] || {};
    const newAccess = !current.access;

    if (newAccess) {
      // Grant access with all feature-specific permissions enabled
      const newPerms: FeaturePermissions = { access: true };
      const featureKeys = FEATURE_PERMISSIONS[feature] || [];
      for (const key of featureKeys) {
        newPerms[key] = true;
      }
      onPermissionChange(member.userId, feature, newPerms);
    } else {
      // Revoke access, clear all permissions
      const newPerms: FeaturePermissions = {};
      const featureKeys = FEATURE_PERMISSIONS[feature] || [];
      for (const key of featureKeys) {
        newPerms[key] = false;
      }
      newPerms.access = false;
      onPermissionChange(member.userId, feature, newPerms);
    }
  };

  const handleTogglePermission = (
    member: MemberPermissions,
    feature: string,
    permKey: keyof FeaturePermissions
  ) => {
    const current = member.permissions[feature] || {};
    const newPerms = { ...current, [permKey]: !current[permKey] };
    onPermissionChange(member.userId, feature, newPerms);
  };

  return (
    <div className={cn('bg-cream-warm rounded-xl border border-teal/[0.08] shadow-[0_2px_12px_rgba(15,31,29,0.03)] overflow-hidden', saving && 'opacity-60 pointer-events-none')}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-stone/10">
        <h3 className="text-sm font-semibold text-charcoal">Feature Permissions</h3>
        <p className="text-xs text-stone mt-0.5">Control what each team member can access and do</p>
      </div>

      {/* Grid */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-stone/10">
              <th className="text-left text-xs font-semibold text-stone uppercase tracking-wider px-6 py-3 w-56">
                Member
              </th>
              {FEATURES.map((feature) => (
                <th
                  key={feature}
                  className="text-center text-xs font-semibold text-stone uppercase tracking-wider px-4 py-3 min-w-[120px]"
                >
                  {FEATURE_LABELS[feature]}
                </th>
              ))}
              <th className="w-10" />
            </tr>
          </thead>
          {members.map((member) => {
              const isExpanded = expandedRows.has(member.userId);

              return (
                <tbody key={member.userId}>
                  {/* Main row */}
                  <tr className="border-b border-stone/5 hover:bg-cream/30 transition-colors">
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-teal/10 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-semibold text-teal">
                            {getInitial(member.user)}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-charcoal truncate">
                            {member.user.full_name || member.user.email}
                          </p>
                          <span
                            className={cn(
                              'text-[10px] font-semibold px-1.5 py-0.5 rounded-full',
                              ROLE_STYLES[member.role] || 'bg-stone/10 text-stone'
                            )}
                          >
                            {member.role}
                          </span>
                        </div>
                      </div>
                    </td>

                    {FEATURES.map((feature) => {
                      const access = hasAccess(member, feature);
                      return (
                        <td key={feature} className="px-4 py-3 text-center">
                          <button
                            onClick={() => handleToggleAccess(member, feature)}
                            className="inline-flex items-center justify-center"
                            title={access ? 'Revoke access' : 'Grant access'}
                          >
                            {access ? (
                              <CheckCircleIcon className="w-6 h-6 text-emerald-500" />
                            ) : (
                              <XCircleIcon className="w-6 h-6 text-red-400" />
                            )}
                          </button>
                        </td>
                      );
                    })}

                    <td className="px-2 py-3">
                      <button
                        onClick={() => toggleRow(member.userId)}
                        className="p-1 rounded hover:bg-cream text-stone transition-colors"
                        title="Expand permissions"
                      >
                        {isExpanded ? (
                          <ChevronDownIcon className="w-4 h-4" />
                        ) : (
                          <ChevronRightIcon className="w-4 h-4" />
                        )}
                      </button>
                    </td>
                  </tr>

                  {/* Expanded granular permissions */}
                  {isExpanded && (
                    <tr className="bg-cream/20">
                      <td colSpan={FEATURES.length + 2} className="px-6 py-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          {FEATURES.map((feature) => {
                            const featurePerms = member.permissions[feature] || {};
                            const permKeys = FEATURE_PERMISSIONS[feature] || [];

                            return (
                              <div
                                key={feature}
                                className="bg-cream-warm rounded-lg border border-stone/10 p-3"
                              >
                                <h4 className="text-xs font-semibold text-charcoal mb-2">
                                  {FEATURE_LABELS[feature]}
                                </h4>
                                <div className="space-y-1.5">
                                  {permKeys.map((permKey) => (
                                    <label
                                      key={permKey}
                                      className="flex items-center gap-2 cursor-pointer"
                                    >
                                      <button
                                        onClick={() =>
                                          handleTogglePermission(member, feature, permKey)
                                        }
                                        className={cn(
                                          'relative w-8 h-4.5 rounded-full transition-colors duration-200',
                                          featurePerms[permKey]
                                            ? 'bg-teal'
                                            : 'bg-stone/20'
                                        )}
                                      >
                                        <span
                                          className={cn(
                                            'absolute top-0.5 w-3.5 h-3.5 rounded-full bg-cream-warm shadow-sm transition-transform duration-200',
                                            featurePerms[permKey]
                                              ? 'translate-x-[18px]'
                                              : 'translate-x-0.5'
                                          )}
                                        />
                                      </button>
                                      <span className="text-xs text-stone">
                                        {PERMISSION_LABELS[permKey]}
                                      </span>
                                    </label>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              );
            })}
        </table>
      </div>

      {members.length === 0 && (
        <div className="px-6 py-12 text-center">
          <p className="text-sm text-stone">No team members to configure</p>
        </div>
      )}
    </div>
  );
}
