'use client';

import { isValidElement } from 'react';
import Link from 'next/link';
import { ChevronRightIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface PageHeaderProps {
  title: string;
  icon?: React.ComponentType<{ className?: string }> | React.ReactElement;
  breadcrumbs?: BreadcrumbItem[];
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, icon, breadcrumbs, subtitle, action, className }: PageHeaderProps) {
  const renderIcon = () => {
    if (!icon) return null;
    // Already a rendered React element (e.g. <HomeIcon className="..." />)
    if (isValidElement(icon)) return icon;
    // Component reference (function or forwardRef) — render it
    const Icon = icon as React.ComponentType<{ className?: string }>;
    return <Icon className="w-5 h-5 md:w-6 md:h-6 text-teal" />;
  };

  return (
    <div className={cn('', className)}>
      {/* Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="flex items-center gap-1.5 text-sm text-stone mb-3">
          {breadcrumbs.map((crumb, i) => (
            <span key={i} className="flex items-center gap-1.5">
              {i > 0 && <ChevronRightIcon className="w-3.5 h-3.5 flex-shrink-0" />}
              {crumb.href ? (
                <Link href={crumb.href} className="hover:text-teal transition-colors">
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-charcoal font-medium">{crumb.label}</span>
              )}
            </span>
          ))}
        </nav>
      )}

      {/* Title Row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2 md:gap-3">
          {icon && (
            <div className="p-1.5 md:p-2 bg-teal/10 rounded-lg flex-shrink-0">
              {renderIcon()}
            </div>
          )}
          <div>
            <h1 className="text-xl md:text-2xl lg:text-display-md text-charcoal">{title}</h1>
            {subtitle && (
              <p className="text-xs md:text-sm text-stone mt-0.5">{subtitle}</p>
            )}
          </div>
        </div>
        {action && <div className="flex items-center gap-2 flex-wrap">{action}</div>}
      </div>
    </div>
  );
}
