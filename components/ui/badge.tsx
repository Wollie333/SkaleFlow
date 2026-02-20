import { cn } from '@/lib/utils';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'awareness' | 'consideration' | 'conversion';
  size?: 'sm' | 'md';
  className?: string;
}

const variantStyles = {
  default: 'bg-stone/10 text-stone',
  primary: 'bg-teal/10 text-teal',
  success: 'bg-green-500/10 text-green-400',
  warning: 'bg-yellow-100 text-gold',
  danger: 'bg-red-500/10 text-red-400',
  awareness: 'bg-green-500/10 text-green-400',
  consideration: 'bg-blue-500/10 text-blue-400',
  conversion: 'bg-orange-100 text-orange-800',
};

const sizeStyles = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm',
};

export function Badge({ children, variant = 'default', size = 'sm', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full capitalize',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
    >
      {children}
    </span>
  );
}
