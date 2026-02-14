'use client';

import { ShieldExclamationIcon } from '@heroicons/react/24/solid';

interface EmbargoBadgeProps {
  embargoDate: string;
  size?: 'sm' | 'md';
}

export function EmbargoBadge({ embargoDate, size = 'sm' }: EmbargoBadgeProps) {
  const date = new Date(embargoDate);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / 86400000);

  const isActive = diffMs > 0;
  if (!isActive) return null;

  const label = diffDays === 0
    ? 'Embargo lifts today'
    : diffDays === 1
    ? 'Embargo: 1 day'
    : `Embargo: ${diffDays}d`;

  return (
    <span className={`inline-flex items-center gap-1 font-semibold rounded-full ${
      size === 'sm'
        ? 'text-[10px] px-1.5 py-0.5'
        : 'text-xs px-2 py-1'
    } bg-red-50 text-red-600 border border-red-200`}>
      <ShieldExclamationIcon className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
      {label}
    </span>
  );
}
