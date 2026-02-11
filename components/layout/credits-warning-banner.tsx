'use client';

import Link from 'next/link';
import { ExclamationTriangleIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';

interface CreditsWarningBannerProps {
  totalRemaining: number;
  isSuperAdmin: boolean;
}

export function CreditsWarningBanner({ totalRemaining, isSuperAdmin }: CreditsWarningBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  // Only show for super admins
  if (!isSuperAdmin) return null;

  // Don't show if dismissed
  if (dismissed) return null;

  // Determine warning level
  const isCritical = totalRemaining <= 0;
  const isLow = totalRemaining > 0 && totalRemaining < 1000;

  // Don't show if balance is healthy
  if (!isCritical && !isLow) return null;

  const bgColor = isCritical ? 'bg-red-50' : 'bg-amber-50';
  const borderColor = isCritical ? 'border-red-200' : 'border-amber-200';
  const textColor = isCritical ? 'text-red-900' : 'text-amber-900';
  const iconColor = isCritical ? 'text-red-600' : 'text-amber-600';

  return (
    <div className={`${bgColor} border-b ${borderColor}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            <ExclamationTriangleIcon className={`w-5 h-5 flex-shrink-0 ${iconColor}`} />
            <div className="flex-1">
              <p className={`text-sm font-medium ${textColor}`}>
                {isCritical ? (
                  <>
                    <strong>Critical:</strong> Your credit balance is {totalRemaining.toLocaleString()} credits (negative).
                    You can still use the app, but consider purchasing credits.
                  </>
                ) : (
                  <>
                    <strong>Low Credits:</strong> You have {totalRemaining.toLocaleString()} credits remaining.
                    Consider purchasing more to avoid going negative.
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/billing?tab=admin"
              className={`text-sm font-medium ${textColor} hover:underline whitespace-nowrap`}
            >
              View Billing →
            </Link>
            <button
              onClick={() => setDismissed(true)}
              className={`p-1 rounded-lg hover:bg-black/5 transition-colors ${textColor}`}
              aria-label="Dismiss"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
