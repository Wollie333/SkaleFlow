'use client';

import { cn } from '@/lib/utils';

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  draft: { label: 'Draft', className: 'bg-stone/10 text-stone' },
  in_progress: { label: 'In Progress', className: 'bg-blue-100 text-blue-700' },
  call_scheduled: { label: 'Call Scheduled', className: 'bg-purple-100 text-purple-700' },
  call_in_progress: { label: 'On Call', className: 'bg-purple-200 text-purple-800' },
  call_complete: { label: 'Call Complete', className: 'bg-purple-100 text-purple-700' },
  review: { label: 'In Review', className: 'bg-amber-100 text-amber-700' },
  scoring: { label: 'Scoring...', className: 'bg-teal/10 text-teal' },
  complete: { label: 'Complete', className: 'bg-green-100 text-green-700' },
  report_generated: { label: 'Report Ready', className: 'bg-teal/15 text-teal' },
  delivered: { label: 'Delivered', className: 'bg-gold/15 text-gold' },
  abandoned: { label: 'Abandoned', className: 'bg-red-100 text-red-700' },
};

export function AuditStatusBadge({ status, className }: { status: string; className?: string }) {
  const config = STATUS_CONFIG[status] || { label: status, className: 'bg-stone/10 text-stone' };
  return (
    <span className={cn(
      'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
      config.className,
      className
    )}>
      {config.label}
    </span>
  );
}
