'use client';

import { cn } from '@/lib/utils';
import type { CrmLifecycleStage } from '@/types/database';

const stageStyles: Record<CrmLifecycleStage, string> = {
  lead: 'bg-gray-100 text-gray-700',
  prospect: 'bg-blue-100 text-blue-700',
  opportunity: 'bg-yellow-100 text-yellow-800',
  customer: 'bg-teal/10 text-teal',
  churned: 'bg-red-100 text-red-700',
};

const stageLabels: Record<CrmLifecycleStage, string> = {
  lead: 'Lead',
  prospect: 'Prospect',
  opportunity: 'Opportunity',
  customer: 'Customer',
  churned: 'Churned',
};

interface LifecycleBadgeProps {
  stage: CrmLifecycleStage;
  size?: 'sm' | 'md';
  className?: string;
}

export function LifecycleBadge({ stage, size = 'sm', className }: LifecycleBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full capitalize',
        stageStyles[stage] || stageStyles.lead,
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm',
        className
      )}
    >
      {stageLabels[stage] || stage}
    </span>
  );
}
