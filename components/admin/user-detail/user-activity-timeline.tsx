'use client';

import {
  CreditCardIcon,
  DocumentTextIcon,
  BellIcon,
  CpuChipIcon,
} from '@heroicons/react/24/outline';

interface ActivityItem {
  id: string;
  type: string;
  title: string;
  description: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

interface UserActivityTimelineProps {
  activity: ActivityItem[];
}

function relativeTime(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return new Date(dateStr).toLocaleDateString('en-ZA', {
    day: 'numeric',
    month: 'short',
    year: diffDays > 365 ? 'numeric' : undefined,
  });
}

const typeConfig: Record<string, { icon: React.ComponentType<{ className?: string }>; color: string }> = {
  credit_transaction: { icon: CreditCardIcon, color: 'text-gold bg-gold/10' },
  content: { icon: DocumentTextIcon, color: 'text-teal bg-teal/10' },
  notification: { icon: BellIcon, color: 'text-purple-600 bg-purple-50' },
  generation_batch: { icon: CpuChipIcon, color: 'text-blue-600 bg-blue-50' },
};

export function UserActivityTimeline({ activity }: UserActivityTimelineProps) {
  if (activity.length === 0) {
    return (
      <div className="bg-cream-warm rounded-xl border border-teal/[0.08] shadow-[0_2px_12px_rgba(15,31,29,0.03)] p-8 text-center text-stone text-sm">
        No activity yet
      </div>
    );
  }

  return (
    <div className="bg-cream-warm rounded-xl border border-teal/[0.08] shadow-[0_2px_12px_rgba(15,31,29,0.03)] p-5">
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-4 top-0 bottom-0 w-px bg-cream" />

        <div className="space-y-0">
          {activity.map((item, i) => {
            const config = typeConfig[item.type] || typeConfig.notification;
            const Icon = config.icon;

            return (
              <div key={item.id} className="relative flex items-start gap-4 py-3">
                {/* Icon */}
                <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${config.color}`}>
                  <Icon className="w-4 h-4" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-charcoal truncate">{item.title}</p>
                      <p className="text-xs text-stone mt-0.5 truncate">{item.description}</p>
                    </div>
                    <span className="text-xs text-stone whitespace-nowrap flex-shrink-0">
                      {relativeTime(item.timestamp)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
