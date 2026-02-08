'use client';

import { cn } from '@/lib/utils';
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

interface ComplianceBadgeProps {
  status: string;
  issueCount?: number;
  className?: string;
}

const statusConfig: Record<string, { icon: React.ElementType; bg: string; text: string; label: string }> = {
  passed: {
    icon: CheckCircleIcon,
    bg: 'bg-green-100',
    text: 'text-green-700',
    label: 'Passed',
  },
  flagged: {
    icon: ExclamationTriangleIcon,
    bg: 'bg-yellow-100',
    text: 'text-yellow-700',
    label: 'Flagged',
  },
  rejected: {
    icon: XCircleIcon,
    bg: 'bg-red-100',
    text: 'text-red-700',
    label: 'Rejected',
  },
  pending: {
    icon: ClockIcon,
    bg: 'bg-stone/10',
    text: 'text-stone',
    label: 'Pending',
  },
};

export function ComplianceBadge({ status, issueCount, className }: ComplianceBadgeProps) {
  const config = statusConfig[status] || statusConfig.pending;
  const Icon = config.icon;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
        config.bg,
        config.text,
        className
      )}
    >
      <Icon className="w-3.5 h-3.5" />
      {config.label}
      {typeof issueCount === 'number' && issueCount > 0 && (
        <span className="ml-0.5">({issueCount})</span>
      )}
    </span>
  );
}
