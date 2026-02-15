'use client';

import { cn } from '@/lib/utils';
import {
  PhoneIcon,
  EnvelopeIcon,
  ChatBubbleLeftIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  TagIcon,
  UserPlusIcon,
  PencilIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';
import {
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/solid';

interface Activity {
  id: string;
  activity_type: string;
  title: string;
  description: string | null;
  performed_by: string | null;
  created_at: string;
  users?: { full_name: string } | null;
  performer?: { full_name: string } | null;
}

const typeConfig: Record<string, { icon: React.ElementType; color: string }> = {
  email: { icon: EnvelopeIcon, color: 'text-blue-500 bg-blue-50' },
  call: { icon: PhoneIcon, color: 'text-green-500 bg-green-50' },
  meeting: { icon: CalendarIcon, color: 'text-purple-500 bg-purple-50' },
  note: { icon: ChatBubbleLeftIcon, color: 'text-gray-500 bg-gray-50' },
  deal_created: { icon: CurrencyDollarIcon, color: 'text-teal bg-teal/10' },
  deal_won: { icon: CheckCircleIcon, color: 'text-green-600 bg-green-50' },
  deal_lost: { icon: XCircleIcon, color: 'text-red-500 bg-red-50' },
  invoice_sent: { icon: DocumentTextIcon, color: 'text-blue-500 bg-blue-50' },
  invoice_paid: { icon: CheckCircleIcon, color: 'text-green-600 bg-green-50' },
  stage_changed: { icon: ArrowRightIcon, color: 'text-orange-500 bg-orange-50' },
  contact_created: { icon: UserPlusIcon, color: 'text-teal bg-teal/10' },
  contact_updated: { icon: PencilIcon, color: 'text-gray-500 bg-gray-50' },
  tag_added: { icon: TagIcon, color: 'text-indigo-500 bg-indigo-50' },
  tag_removed: { icon: TagIcon, color: 'text-red-400 bg-red-50' },
};

interface ActivityTimelineProps {
  activities: Activity[];
  className?: string;
}

export function ActivityTimeline({ activities, className }: ActivityTimelineProps) {
  if (activities.length === 0) {
    return (
      <div className={cn('text-center py-8 text-stone', className)}>
        No activity recorded yet.
      </div>
    );
  }

  return (
    <div className={cn('flow-root', className)}>
      <ul className="-mb-8">
        {activities.map((activity, idx) => {
          const config = typeConfig[activity.activity_type] || typeConfig.note;
          const Icon = config.icon;
          const isLast = idx === activities.length - 1;
          const performerName = activity.users?.full_name || activity.performer?.full_name || 'System';

          return (
            <li key={activity.id}>
              <div className="relative pb-8">
                {!isLast && (
                  <span
                    className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-gray-200"
                    aria-hidden="true"
                  />
                )}
                <div className="relative flex space-x-3">
                  <div>
                    <span className={cn('h-8 w-8 rounded-full flex items-center justify-center ring-4 ring-white', config.color)}>
                      <Icon className="h-4 w-4" />
                    </span>
                  </div>
                  <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1">
                    <div>
                      <p className="text-sm text-charcoal font-medium">{activity.title}</p>
                      {activity.description && (
                        <p className="mt-0.5 text-sm text-stone">{activity.description}</p>
                      )}
                      <p className="mt-0.5 text-xs text-stone/60">{performerName}</p>
                    </div>
                    <div className="whitespace-nowrap text-right text-xs text-stone">
                      {formatRelativeTime(activity.created_at)}
                    </div>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' });
}
