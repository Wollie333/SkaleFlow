'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button, UserAvatar } from '@/components/ui';
import {
  ChevronDownIcon,
  TrashIcon,
  Cog6ToothIcon,
  CalendarDaysIcon,
} from '@heroicons/react/24/outline';

type MemberRole = 'owner' | 'admin' | 'member' | 'viewer';

interface MemberUser {
  id: string;
  email: string;
  full_name: string | null;
  last_login_at: string | null;
  avatar_url?: string | null;
}

interface Member {
  id: string;
  user_id: string;
  role: MemberRole;
  joined_at: string;
  users: MemberUser | null;
}

interface MemberCardProps {
  member: Member;
  isAdmin: boolean;
  onManage: (memberId: string) => void;
  onRoleChange: (memberId: string, role: MemberRole) => void;
  onRemove: (memberId: string) => void;
  roleChanging: string | null;
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

function getInitial(member: Member): string {
  if (member.users?.full_name) {
    return member.users.full_name.charAt(0).toUpperCase();
  }
  if (member.users?.email) {
    return member.users.email.charAt(0).toUpperCase();
  }
  return '?';
}

function formatJoinedDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-ZA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function MemberCard({
  member,
  isAdmin,
  onManage,
  onRoleChange,
  onRemove,
  roleChanging,
}: MemberCardProps) {
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);

  const displayName = member.users?.full_name || member.users?.email || 'Unknown User';
  const email = member.users?.email || '';
  const isOwner = member.role === 'owner';
  const isChangingRole = roleChanging === member.id;

  const handleRoleSelect = (role: MemberRole) => {
    setRoleDropdownOpen(false);
    onRoleChange(member.id, role);
  };

  const handleRemoveClick = () => {
    if (confirmRemove) {
      setConfirmRemove(false);
      onRemove(member.id);
    } else {
      setConfirmRemove(true);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-teal/[0.08] shadow-[0_2px_12px_rgba(15,31,29,0.03)] p-5 transition-all duration-200 hover:shadow-[0_4px_16px_rgba(15,31,29,0.06)]">
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="flex-shrink-0">
          <UserAvatar
            avatarUrl={member.users?.avatar_url}
            userName={displayName}
            size="lg"
          />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5 mb-0.5">
            <h3 className="text-sm font-semibold text-charcoal truncate">{displayName}</h3>

            {/* Role Badge / Dropdown */}
            <div className="relative">
              {isAdmin && !isOwner ? (
                <button
                  onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
                  disabled={isChangingRole}
                  className={cn(
                    'text-xs font-semibold px-2.5 py-1 rounded-full inline-flex items-center gap-1 transition-opacity',
                    ROLE_STYLES[member.role],
                    isChangingRole && 'opacity-50'
                  )}
                >
                  {isChangingRole ? 'Updating...' : ROLE_LABELS[member.role]}
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
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setRoleDropdownOpen(false)}
                  />
                  <div className="absolute top-full left-0 mt-1 z-50 bg-white rounded-lg border border-stone/10 shadow-lg py-1 min-w-[120px]">
                    {ASSIGNABLE_ROLES.map((role) => (
                      <button
                        key={role}
                        onClick={() => handleRoleSelect(role)}
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
          </div>

          <p className="text-xs text-stone truncate">{email}</p>

          <div className="flex items-center gap-1 mt-1.5">
            <CalendarDaysIcon className="w-3.5 h-3.5 text-stone/60" />
            <span className="text-xs text-stone/60">Joined {formatJoinedDate(member.joined_at)}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            onClick={() => onManage(member.id)}
            className="p-2 rounded-lg text-stone hover:text-teal hover:bg-teal/5 transition-colors"
            title="Manage member"
          >
            <Cog6ToothIcon className="w-4.5 h-4.5" />
          </button>

          {isAdmin && !isOwner && (
            <button
              onClick={handleRemoveClick}
              onBlur={() => setConfirmRemove(false)}
              className={cn(
                'p-2 rounded-lg transition-colors',
                confirmRemove
                  ? 'text-red-600 bg-red-50 hover:bg-red-100'
                  : 'text-stone hover:text-red-500 hover:bg-red-50'
              )}
              title={confirmRemove ? 'Click again to confirm removal' : 'Remove member'}
            >
              <TrashIcon className="w-4.5 h-4.5" />
            </button>
          )}
        </div>
      </div>

      {confirmRemove && (
        <div className="mt-3 pt-3 border-t border-stone/10 flex items-center justify-between">
          <p className="text-xs text-red-600 font-medium">Remove this member?</p>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setConfirmRemove(false)}
              className="text-xs px-3 py-1"
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => {
                setConfirmRemove(false);
                onRemove(member.id);
              }}
              className="text-xs px-3 py-1"
            >
              Remove
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
