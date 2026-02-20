'use client';

import { Fragment } from 'react';
import { cn } from '@/lib/utils';
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

export interface ActionModalAction {
  label: string;
  href?: string;
  onClick?: () => void;
  variant?: 'primary' | 'ghost' | 'danger';
}

export interface ActionModalProps {
  open: boolean;
  onClose: () => void;
  variant: 'success' | 'error' | 'info';
  title: string;
  subtitle?: string;
  actions: ActionModalAction[];
}

const variantConfig = {
  success: {
    icon: CheckCircleIcon,
    iconBg: 'bg-teal/10',
    iconColor: 'text-teal',
    ring: 'ring-teal/20',
  },
  error: {
    icon: ExclamationTriangleIcon,
    iconBg: 'bg-red-50',
    iconColor: 'text-red-500',
    ring: 'ring-red-500/20',
  },
  info: {
    icon: InformationCircleIcon,
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-500',
    ring: 'ring-blue-500/20',
  },
};

export function ActionModal({ open, onClose, variant, title, subtitle, actions }: ActionModalProps) {
  if (!open) return null;

  const config = variantConfig[variant];
  const Icon = config.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-dark/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-cream-warm rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-lg text-stone hover:text-charcoal hover:bg-cream-warm transition-colors"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>

        <div className="p-8 text-center">
          {/* Icon */}
          <div className={cn('inline-flex items-center justify-center w-16 h-16 rounded-full ring-8 mb-5', config.iconBg, config.ring)}>
            <Icon className={cn('w-8 h-8', config.iconColor)} />
          </div>

          {/* Title */}
          <h3 className="text-xl font-bold text-charcoal mb-2">{title}</h3>

          {/* Subtitle */}
          {subtitle && (
            <p className="text-sm text-stone mb-6">{subtitle}</p>
          )}

          {/* Actions */}
          {actions.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-6">
              {actions.map((action, i) => {
                const baseClass = cn(
                  'px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 w-full sm:w-auto',
                  action.variant === 'danger'
                    ? 'bg-red-500 text-white hover:bg-red-600'
                    : action.variant === 'ghost'
                    ? 'bg-transparent text-charcoal hover:bg-cream-warm border border-stone/20'
                    : 'bg-teal text-cream hover:bg-teal-light'
                );

                if (action.href) {
                  return (
                    <a key={i} href={action.href} className={baseClass} onClick={onClose}>
                      {action.label}
                    </a>
                  );
                }

                return (
                  <button
                    key={i}
                    onClick={() => {
                      action.onClick?.();
                      if (action.variant !== 'danger') onClose();
                    }}
                    className={baseClass}
                  >
                    {action.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
