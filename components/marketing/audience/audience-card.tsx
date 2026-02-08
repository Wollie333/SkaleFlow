'use client';

import { cn, formatDate } from '@/lib/utils';
import { PlatformIcon } from '@/components/marketing/shared/platform-icon';
import {
  UsersIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';

interface AudienceCardProps {
  audience: any;
  onClick?: () => void;
}

const typeStyles: Record<string, { bg: string; text: string }> = {
  saved: { bg: 'bg-teal/10', text: 'text-teal' },
  custom: { bg: 'bg-gold/10', text: 'text-gold' },
  lookalike: { bg: 'bg-blue-100', text: 'text-blue-700' },
};

const typeLabels: Record<string, string> = {
  saved: 'Saved',
  custom: 'Custom',
  lookalike: 'Lookalike',
};

function formatAudienceSize(size: number): string {
  if (size >= 1000000) return `${(size / 1000000).toFixed(1)}M`;
  if (size >= 1000) return `${(size / 1000).toFixed(0)}K`;
  return size.toString();
}

export function AudienceCard({ audience, onClick }: AudienceCardProps) {
  const audienceType = audience.audience_type || 'saved';
  const style = typeStyles[audienceType] || typeStyles.saved;

  return (
    <div
      className={cn(
        'bg-white rounded-xl border border-teal/8 p-5 transition-all duration-300',
        'hover:-translate-y-0.5 hover:shadow-lg hover:shadow-dark/5',
        onClick && 'cursor-pointer'
      )}
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-charcoal line-clamp-1">
            {audience.name}
          </h3>
          {audience.description && (
            <p className="text-xs text-stone mt-0.5 line-clamp-2">
              {audience.description}
            </p>
          )}
        </div>
        <PlatformIcon platform={audience.platform || 'meta'} size="sm" className="ml-3 shrink-0" />
      </div>

      {/* Tags */}
      <div className="flex items-center gap-2 mb-3">
        <span
          className={cn(
            'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
            style.bg,
            style.text
          )}
        >
          {typeLabels[audienceType] || audienceType}
        </span>
      </div>

      {/* Size + Sync */}
      <div className="flex items-center justify-between pt-3 border-t border-stone/10">
        <div className="flex items-center gap-1.5 text-stone">
          <UsersIcon className="w-4 h-4" />
          <span className="text-xs font-medium">
            {audience.approximate_size
              ? `~${formatAudienceSize(audience.approximate_size)} people`
              : 'Size unknown'}
          </span>
        </div>

        {audience.last_synced_at && (
          <div className="flex items-center gap-1 text-stone">
            <ArrowPathIcon className="w-3.5 h-3.5" />
            <span className="text-[10px]">
              Synced {formatDate(audience.last_synced_at)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
