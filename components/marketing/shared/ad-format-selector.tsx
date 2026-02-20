'use client';

import { cn } from '@/lib/utils';

interface AdFormatSelectorProps {
  platform: 'meta' | 'tiktok';
  value: string;
  onChange: (format: string) => void;
}

const META_FORMATS = [
  { value: 'single_image', label: 'Single Image' },
  { value: 'single_video', label: 'Single Video' },
  { value: 'carousel', label: 'Carousel' },
  { value: 'collection', label: 'Collection' },
];

const TIKTOK_FORMATS = [
  { value: 'in_feed', label: 'In-Feed' },
  { value: 'topview', label: 'TopView' },
  { value: 'spark_ad', label: 'Spark Ad' },
  { value: 'single_video', label: 'Single Video' },
];

export function AdFormatSelector({ platform, value, onChange }: AdFormatSelectorProps) {
  const formats = platform === 'meta' ? META_FORMATS : TIKTOK_FORMATS;

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-charcoal mb-2">
        Ad Format
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          'w-full px-4 py-3 rounded-xl border bg-cream-warm transition-all duration-200',
          'focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal',
          'border-stone/20 hover:border-stone/40',
          'text-charcoal'
        )}
      >
        <option value="">Select format...</option>
        {formats.map((fmt) => (
          <option key={fmt.value} value={fmt.value}>
            {fmt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
