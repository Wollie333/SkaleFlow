'use client';

import { cn } from '@/lib/utils';
import type { CrmLifecycleStage } from '@/types/database';

const stageStyles: Record<CrmLifecycleStage, string> = {
  lead: 'bg-stone/10 text-stone',
  prospect: 'bg-blue-500/10 text-blue-400',
  opportunity: 'bg-gold/10 text-gold',
  customer: 'bg-teal/10 text-teal',
  churned: 'bg-red-500/10 text-red-400',
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
