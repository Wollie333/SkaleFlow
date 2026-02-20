'use client';

import { cn } from '@/lib/utils';

export type DateRange = '7d' | '30d' | '90d';

interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
}

const ranges: { value: DateRange; label: string }[] = [
  { value: '7d', label: '7 days' },
  { value: '30d', label: '30 days' },
  { value: '90d', label: '90 days' },
];

export function DateRangePicker({ value, onChange }: DateRangePickerProps) {
  return (
    <div className="flex items-center gap-1 bg-cream-warm rounded-lg p-1">
      {ranges.map(range => (
        <button
          key={range.value}
          onClick={() => onChange(range.value)}
          className={cn(
            'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
            value === range.value
              ? 'bg-cream-warm text-charcoal shadow-sm'
              : 'text-stone hover:text-charcoal'
          )}
        >
          {range.label}
        </button>
      ))}
    </div>
  );
}

export function getDateFromRange(range: DateRange): string {
  const now = new Date();
  const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
  const date = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  return date.toISOString().split('T')[0];
}
