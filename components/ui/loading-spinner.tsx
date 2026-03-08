'use client';

import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  /** 'light' = teal spinner (for light backgrounds), 'dark' = gold spinner (for dark backgrounds) */
  variant?: 'light' | 'dark';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
  xl: 'h-16 w-16',
};

/**
 * Loading spinner with brand colors.
 * Light backgrounds (default) → teal (brand green)
 * Dark backgrounds → gold (brand yellow)
 */
export function LoadingSpinner({ variant = 'light', size = 'lg', className }: LoadingSpinnerProps) {
  return (
    <div
      className={cn(
        'animate-spin rounded-full border-t-2 border-b-2',
        variant === 'dark' ? 'border-gold' : 'border-teal',
        sizeClasses[size],
        className,
      )}
    />
  );
}

/**
 * Full-page centered loading spinner.
 */
export function PageLoader({ variant = 'light', size = 'lg' }: { variant?: 'light' | 'dark'; size?: LoadingSpinnerProps['size'] }) {
  return (
    <div className="flex items-center justify-center h-[60vh]">
      <LoadingSpinner variant={variant} size={size} />
    </div>
  );
}
