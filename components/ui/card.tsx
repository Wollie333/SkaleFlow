import { cn } from '@/lib/utils';

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'dark' | 'gradient';
  hover?: boolean;
  onClick?: () => void;
}

export function Card({ children, className, variant = 'default', hover = false, onClick }: CardProps) {
  const variants = {
    default: 'bg-white border border-teal/8',
    dark: 'bg-dark-light border border-teal/12 text-cream',
    gradient: 'bg-white border border-teal/8 card-gradient-border',
  };

  return (
    <div
      className={cn(
        'rounded-xl p-4 md:p-6 transition-all duration-300',
        variants[variant],
        hover && 'hover:-translate-y-1 hover:shadow-lg hover:shadow-dark/5',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('mb-4', className)}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <h3 className={cn('text-heading-md text-charcoal', className)}>
      {children}
    </h3>
  );
}

export function CardDescription({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={cn('text-body-md text-stone mt-1', className)}>
      {children}
    </p>
  );
}

export function CardContent({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('', className)}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('mt-4 pt-4 border-t border-stone/10', className)}>
      {children}
    </div>
  );
}
