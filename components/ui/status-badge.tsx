import { cn } from '@/lib/utils';
import type { ContentStatus } from '@/types/database';

const statusStyles: Record<ContentStatus, string> = {
  idea: 'bg-stone/10 text-stone',
  scripted: 'bg-yellow-100 text-yellow-800',
  pending_review: 'bg-amber-100 text-amber-800',
  revision_requested: 'bg-amber-100 text-amber-800',
  approved: 'bg-blue-100 text-blue-800',
  rejected: 'bg-red-100 text-red-800',
  filming: 'bg-purple-100 text-purple-800',
  filmed: 'bg-purple-100 text-purple-800',
  designing: 'bg-pink-100 text-pink-800',
  designed: 'bg-pink-100 text-pink-800',
  editing: 'bg-orange-100 text-orange-800',
  edited: 'bg-orange-100 text-orange-800',
  scheduled: 'bg-teal/10 text-teal',
  published: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
};

export interface StatusBadgeProps {
  status: ContentStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize',
        statusStyles[status],
        className
      )}
    >
      {status.replace(/_/g, ' ')}
    </span>
  );
}
