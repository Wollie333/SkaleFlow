'use client';

import { ShieldCheckIcon } from '@heroicons/react/24/solid';
import { AUTHORITY_TIERS } from '@/lib/authority/constants';

interface TierBadgeProps {
  tier: number;
  tierName: string;
  totalPoints: number;
  size?: 'sm' | 'md' | 'lg';
}

export function TierBadge({ tier, tierName, totalPoints, size = 'md' }: TierBadgeProps) {
  const tierConfig = AUTHORITY_TIERS.find(t => t.tier === tier) || AUTHORITY_TIERS[0];
  const nextTier = AUTHORITY_TIERS.find(t => t.tier === tier + 1);
  const progress = nextTier
    ? Math.min(100, ((totalPoints - tierConfig.minPoints) / (nextTier.minPoints - tierConfig.minPoints)) * 100)
    : 100;

  const sizeClasses = {
    sm: 'p-2',
    md: 'p-4',
    lg: 'p-6',
  };

  const iconSizes = {
    sm: 'w-5 h-5',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className={`rounded-xl border border-stone/10 bg-white ${sizeClasses[size]}`}>
      <div className="flex items-center gap-3">
        <div
          className="rounded-lg p-2"
          style={{ backgroundColor: `${tierConfig.color}15` }}
        >
          <ShieldCheckIcon
            className={iconSizes[size]}
            style={{ color: tierConfig.color }}
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <span
              className={`font-serif font-bold ${size === 'lg' ? 'text-xl' : size === 'md' ? 'text-base' : 'text-sm'}`}
              style={{ color: tierConfig.color }}
            >
              {tierName}
            </span>
            <span className="text-xs text-stone">Tier {tier}</span>
          </div>
          <p className={`font-semibold text-charcoal ${size === 'sm' ? 'text-sm' : 'text-lg'}`}>
            {totalPoints.toLocaleString()} pts
          </p>
          {nextTier && (
            <div className="mt-1.5">
              <div className="flex justify-between text-[10px] text-stone mb-0.5">
                <span>{tierConfig.minPoints}</span>
                <span>{nextTier.minPoints}</span>
              </div>
              <div className="h-1.5 bg-cream-warm rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${progress}%`, backgroundColor: tierConfig.color }}
                />
              </div>
              <p className="text-[10px] text-stone mt-0.5">
                {nextTier.minPoints - totalPoints} pts to {nextTier.name}
              </p>
            </div>
          )}
          {!nextTier && (
            <p className="text-[10px] text-gold mt-1">Maximum tier reached</p>
          )}
        </div>
      </div>
    </div>
  );
}
