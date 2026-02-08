'use client';

import { cn } from '@/lib/utils';

interface PlatformIconProps {
  platform: 'meta' | 'tiktok';
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeMap = {
  sm: 'w-6 h-6',
  md: 'w-8 h-8',
  lg: 'w-10 h-10',
};

const textSizeMap = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
};

export function PlatformIcon({ platform, className, size = 'md' }: PlatformIconProps) {
  if (platform === 'meta') {
    return (
      <div
        className={cn(
          'inline-flex items-center justify-center rounded-full bg-blue-600 text-white font-bold',
          sizeMap[size],
          textSizeMap[size],
          className
        )}
      >
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-[60%] h-[60%]">
          <path d="M12 2.04c-5.5 0-10 4.49-10 10.02 0 5 3.66 9.15 8.44 9.9v-7H7.9v-2.9h2.54V9.85c0-2.52 1.49-3.93 3.78-3.93 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.78-1.63 1.57v1.88h2.78l-.45 2.9h-2.33v7A10 10 0 0022 12.06C22 6.53 17.5 2.04 12 2.04z" />
        </svg>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'inline-flex items-center justify-center rounded-full bg-black text-white font-bold',
        sizeMap[size],
        textSizeMap[size],
        className
      )}
    >
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-[60%] h-[60%]">
        <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.34-6.34V8.75a8.18 8.18 0 004.76 1.52V6.84a4.84 4.84 0 01-1-.15z" />
      </svg>
    </div>
  );
}
