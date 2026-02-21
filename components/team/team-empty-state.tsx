'use client';

import { Button } from '@/components/ui';
import {
  UserGroupIcon,
  ShieldCheckIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

interface TeamEmptyStateProps {
  type: 'members' | 'permissions' | 'activity';
  isAdmin?: boolean;
  onAction?: () => void;
}

const CONFIG = {
  members: {
    icon: UserGroupIcon,
    title: 'No team members yet',
    description: 'Invite your first team member to start collaborating.',
    adminDescription: 'Invite your first team member to get started.',
    actionLabel: 'Invite Member',
  },
  permissions: {
    icon: ShieldCheckIcon,
    title: 'No permissions to display',
    description: 'Add team members first, then configure their permissions here.',
    adminDescription: 'Add team members first, then configure their permissions here.',
    actionLabel: undefined,
  },
  activity: {
    icon: ClockIcon,
    title: 'No activity recorded',
    description: 'Team activity will appear here as members are invited, roles change, and permissions are updated.',
    adminDescription: 'Team activity will appear here as you manage your team.',
    actionLabel: undefined,
  },
};

export function TeamEmptyState({ type, isAdmin, onAction }: TeamEmptyStateProps) {
  const config = CONFIG[type];
  const Icon = config.icon;

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-14 h-14 rounded-full bg-stone/5 flex items-center justify-center mb-4">
        <Icon className="w-7 h-7 text-stone/40" />
      </div>
      <h3 className="text-base font-semibold text-charcoal mb-1">{config.title}</h3>
      <p className="text-sm text-stone max-w-sm">
        {isAdmin ? config.adminDescription : config.description}
      </p>
      {config.actionLabel && isAdmin && onAction && (
        <Button
          onClick={onAction}
          className="bg-teal hover:bg-teal-light text-white text-sm mt-4"
          size="sm"
        >
          {config.actionLabel}
        </Button>
      )}
    </div>
  );
}
