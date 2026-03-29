'use client';

import { cn } from '@/lib/utils';
import {
  DocumentTextIcon,
  PencilSquareIcon,
  ClockIcon,
  CheckCircleIcon,
  CalendarIcon,
  RocketLaunchIcon,
} from '@heroicons/react/24/outline';

interface PostStatusOverviewProps {
  statuses: {
    idea: number;
    scripted: number;
    pending_review: number;
    approved: number;
    scheduled: number;
    published: number;
  };
  onStatusClick?: (status: string) => void;
}

const STATUS_CONFIG = {
  idea: {
    label: 'Draft',
    icon: DocumentTextIcon,
    color: 'bg-stone/10 text-stone border-stone/20 hover:bg-stone/20',
  },
  scripted: {
    label: 'Scripted',
    icon: PencilSquareIcon,
    color: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100',
  },
  pending_review: {
    label: 'In Review',
    icon: ClockIcon,
    color: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100',
  },
  approved: {
    label: 'Approved',
    icon: CheckCircleIcon,
    color: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100',
  },
  scheduled: {
    label: 'Scheduled',
    icon: CalendarIcon,
    color: 'bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100',
  },
  published: {
    label: 'Published',
    icon: RocketLaunchIcon,
    color: 'bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200',
  },
};

export function PostStatusOverview({ statuses, onStatusClick }: PostStatusOverviewProps) {
  const total = Object.values(statuses).reduce((sum, count) => sum + count, 0);

  return (
    <div className="bg-cream-warm border border-stone/10 rounded-xl overflow-hidden">
      <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-stone/10">
        <div className="flex items-center justify-between">
          <h3 className="text-sm sm:text-base font-semibold text-charcoal">Post Status Overview</h3>
          <span className="text-xs sm:text-sm text-stone">
            {total} total {total === 1 ? 'post' : 'posts'}
          </span>
        </div>
      </div>

      <div className="p-3 sm:p-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
          {Object.entries(STATUS_CONFIG).map(([status, config]) => {
            const count = statuses[status as keyof typeof statuses];
            const Icon = config.icon;

            return (
              <button
                key={status}
                onClick={() => onStatusClick?.(status)}
                className={cn(
                  'flex flex-col items-center gap-2 p-3 sm:p-4 rounded-lg border transition-all',
                  config.color,
                  onStatusClick && 'cursor-pointer active:scale-95'
                )}
              >
                <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                <div className="text-center">
                  <div className="text-xl sm:text-2xl font-bold">{count}</div>
                  <div className="text-[10px] sm:text-xs font-medium mt-0.5">{config.label}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
