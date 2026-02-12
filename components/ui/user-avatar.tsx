'use client';

import { UserCircleIcon } from '@heroicons/react/24/outline';

interface UserAvatarProps {
  avatarUrl?: string | null;
  userName?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeClasses = {
  sm: 'w-6 h-6',
  md: 'w-8 h-8',
  lg: 'w-12 h-12',
  xl: 'w-24 h-24',
};

export function UserAvatar({ avatarUrl, userName, size = 'md', className = '' }: UserAvatarProps) {
  const sizeClass = sizeClasses[size];

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={userName ? `${userName}'s avatar` : 'User avatar'}
        className={`${sizeClass} rounded-full object-cover border-2 border-stone/20 ${className}`}
      />
    );
  }

  return (
    <UserCircleIcon className={`${sizeClass} text-stone ${className}`} />
  );
}
