'use client';

import { cn } from '@/lib/utils';

interface TrafficLightProps {
  ratings: Array<{ category: string; rating: string }>;
  size?: 'sm' | 'md';
}

const RATING_COLORS: Record<string, string> = {
  red: 'bg-red-500',
  amber: 'bg-amber-500',
  green: 'bg-emerald-500',
};

export function TrafficLight({ ratings, size = 'md' }: TrafficLightProps) {
  const dotSize = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4';

  return (
    <div className="flex items-center gap-1.5">
      {ratings.map((r) => (
        <div
          key={r.category}
          className={cn(
            'rounded-full',
            dotSize,
            RATING_COLORS[r.rating] || 'bg-stone/20'
          )}
          title={`${r.category}: ${r.rating}`}
        />
      ))}
    </div>
  );
}
