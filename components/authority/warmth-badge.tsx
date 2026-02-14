'use client';

import { WARMTH_CONFIG } from '@/lib/authority/constants';
import type { AuthorityContactWarmth } from '@/lib/authority/types';

interface WarmthBadgeProps {
  warmth: AuthorityContactWarmth;
  size?: 'sm' | 'md';
}

export function WarmthBadge({ warmth, size = 'sm' }: WarmthBadgeProps) {
  const config = WARMTH_CONFIG[warmth] || WARMTH_CONFIG.cold;

  return (
    <span
      className={
        size === 'sm'
          ? 'text-[10px] font-semibold px-1.5 py-0.5 rounded-full'
          : 'text-xs font-semibold px-2 py-1 rounded-full'
      }
      style={{ color: config.color, backgroundColor: config.bgColor }}
    >
      {config.label}
    </span>
  );
}
