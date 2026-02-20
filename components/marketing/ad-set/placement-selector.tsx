'use client';

import { cn } from '@/lib/utils';

interface PlacementSelectorProps {
  platform: 'meta' | 'tiktok';
  value: string[];
  onChange: (placements: string[]) => void;
}

const META_PLACEMENTS = [
  { value: 'feed', label: 'Feed', description: 'Facebook & Instagram feed' },
  { value: 'stories', label: 'Stories', description: 'Facebook & Instagram Stories' },
  { value: 'reels', label: 'Reels', description: 'Instagram & Facebook Reels' },
  { value: 'search', label: 'Search', description: 'Facebook search results' },
  { value: 'marketplace', label: 'Marketplace', description: 'Facebook Marketplace' },
  { value: 'right_column', label: 'Right Column', description: 'Facebook right column (desktop)' },
];

const TIKTOK_PLACEMENTS = [
  { value: 'for_you', label: 'For You Feed', description: 'Main TikTok feed' },
  { value: 'search', label: 'TikTok Search', description: 'TikTok search results' },
  { value: 'pangle', label: 'Pangle', description: 'TikTok audience network' },
];

export function PlacementSelector({ platform, value, onChange }: PlacementSelectorProps) {
  const placements = platform === 'meta' ? META_PLACEMENTS : TIKTOK_PLACEMENTS;

  const toggle = (placement: string) => {
    if (value.includes(placement)) {
      onChange(value.filter((p) => p !== placement));
    } else {
      onChange([...value, placement]);
    }
  };

  const selectAll = () => {
    onChange(placements.map((p) => p.value));
  };

  const clearAll = () => {
    onChange([]);
  };

  const allSelected = placements.every((p) => value.includes(p.value));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-charcoal">
          Placements
        </label>
        <button
          type="button"
          onClick={allSelected ? clearAll : selectAll}
          className="text-xs text-teal hover:text-teal-light font-medium transition-colors"
        >
          {allSelected ? 'Clear all' : 'Select all'}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {placements.map((placement) => {
          const isSelected = value.includes(placement.value);
          return (
            <label
              key={placement.value}
              className={cn(
                'flex items-start gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-all duration-200',
                isSelected
                  ? 'border-teal/30 bg-teal/5'
                  : 'border-stone/15 bg-cream-warm hover:border-stone/30'
              )}
            >
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => toggle(placement.value)}
                className="w-4 h-4 mt-0.5 rounded border-stone/30 text-teal focus:ring-teal/20"
              />
              <div>
                <p
                  className={cn(
                    'text-sm font-medium',
                    isSelected ? 'text-teal' : 'text-charcoal'
                  )}
                >
                  {placement.label}
                </p>
                <p className="text-[11px] text-stone">{placement.description}</p>
              </div>
            </label>
          );
        })}
      </div>

      {value.length === 0 && (
        <p className="text-xs text-stone/60 italic">
          No placements selected. We recommend selecting at least 2-3 for optimal reach.
        </p>
      )}
    </div>
  );
}
