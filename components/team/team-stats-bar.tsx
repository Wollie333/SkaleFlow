'use client';

import {
  UserGroupIcon,
  SignalIcon,
  EnvelopeIcon,
  CurrencyDollarIcon,
} from '@heroicons/react/24/outline';

interface TeamStatsBarProps {
  totalMembers: number;
  activeToday: number;
  pendingInvites: number;
  availableCredits: number;
}

const stats = [
  { key: 'totalMembers', label: 'Total Members', icon: UserGroupIcon },
  { key: 'activeToday', label: 'Active Today', icon: SignalIcon },
  { key: 'pendingInvites', label: 'Pending Invites', icon: EnvelopeIcon },
  { key: 'availableCredits', label: 'Available Credits', icon: CurrencyDollarIcon },
] as const;

function formatNumber(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

export function TeamStatsBar({
  totalMembers,
  activeToday,
  pendingInvites,
  availableCredits,
}: TeamStatsBarProps) {
  const values: Record<string, number> = {
    totalMembers,
    activeToday,
    pendingInvites,
    availableCredits,
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {stats.map(({ key, label, icon: Icon }) => (
        <div
          key={key}
          className="bg-cream-warm rounded-xl border border-teal/[0.08] shadow-[0_2px_12px_rgba(15,31,29,0.03)] p-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-teal/8 flex items-center justify-center">
              <Icon className="w-5 h-5 text-teal" />
            </div>
            <div>
              <p className="text-2xl font-bold text-charcoal leading-tight">
                {formatNumber(values[key])}
              </p>
              <p className="text-xs text-stone">{label}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
