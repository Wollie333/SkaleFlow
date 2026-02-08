'use client';

import { cn } from '@/lib/utils';

interface CampaignStatusBadgeProps {
  status: string;
  className?: string;
}

const statusStyles: Record<string, string> = {
  draft: 'bg-stone/10 text-stone',
  active: 'bg-green-100 text-green-800',
  paused: 'bg-yellow-100 text-yellow-800',
  pending_review: 'bg-blue-100 text-blue-800',
  completed: 'bg-charcoal/10 text-charcoal',
  rejected: 'bg-red-100 text-red-800',
  archived: 'bg-stone/10 text-stone/60',
};

const statusLabels: Record<string, string> = {
  draft: 'Draft',
  active: 'Active',
  paused: 'Paused',
  pending_review: 'Pending Review',
  completed: 'Completed',
  rejected: 'Rejected',
  archived: 'Archived',
};

export function CampaignStatusBadge({ status, className }: CampaignStatusBadgeProps) {
  const style = statusStyles[status] || statusStyles.draft;
  const label = statusLabels[status] || status;

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize',
        style,
        className
      )}
    >
      <span
        className={cn(
          'w-1.5 h-1.5 rounded-full mr-1.5',
          status === 'active' && 'bg-green-500',
          status === 'paused' && 'bg-yellow-500',
          status === 'pending_review' && 'bg-blue-500',
          status === 'draft' && 'bg-stone/40',
          status === 'completed' && 'bg-charcoal/40',
          status === 'rejected' && 'bg-red-500',
          status === 'archived' && 'bg-stone/30'
        )}
      />
      {label}
    </span>
  );
}
