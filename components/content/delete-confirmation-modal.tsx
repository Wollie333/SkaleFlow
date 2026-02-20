'use client';

import { useState } from 'react';
import { Button } from '@/components/ui';
import { ExclamationTriangleIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface DeleteConfirmationModalProps {
  title: string;
  message: string;
  itemCount: number;
  requireTypedConfirmation?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting: boolean;
}

export function DeleteConfirmationModal({
  title,
  message,
  itemCount,
  requireTypedConfirmation,
  onConfirm,
  onCancel,
  isDeleting,
}: DeleteConfirmationModalProps) {
  const [typedValue, setTypedValue] = useState('');

  const canConfirm = requireTypedConfirmation
    ? typedValue === requireTypedConfirmation
    : true;

  return (
    <div className="fixed inset-0 bg-dark/50 flex items-center justify-center z-50">
      <div className="bg-cream-warm rounded-2xl p-6 w-full max-w-md shadow-xl">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center shrink-0">
              <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />
            </div>
            <h2 className="text-heading-lg text-charcoal">{title}</h2>
          </div>
          <button
            onClick={onCancel}
            disabled={isDeleting}
            className="p-1 rounded-lg hover:bg-stone/10 transition-colors"
          >
            <XMarkIcon className="w-5 h-5 text-stone" />
          </button>
        </div>

        {/* Message */}
        <p className="text-body-md text-stone mb-2">{message}</p>
        <p className="text-sm font-semibold text-red-600 mb-4">
          {itemCount} {itemCount === 1 ? 'item' : 'items'} will be permanently deleted. This cannot be undone.
        </p>

        {/* Typed confirmation */}
        {requireTypedConfirmation && (
          <div className="mb-4">
            <p className="text-sm text-stone mb-2">
              Type <span className="font-semibold text-charcoal">{requireTypedConfirmation}</span> to confirm:
            </p>
            <input
              type="text"
              value={typedValue}
              onChange={(e) => setTypedValue(e.target.value)}
              placeholder={requireTypedConfirmation}
              disabled={isDeleting}
              className="w-full px-4 py-2.5 rounded-xl border border-stone/20 focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400 text-sm"
              autoFocus
            />
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            type="button"
            onClick={onCancel}
            variant="ghost"
            className="flex-1"
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            disabled={!canConfirm || isDeleting}
            isLoading={isDeleting}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white disabled:bg-red-300"
          >
            {isDeleting ? 'Deleting...' : `Delete ${itemCount === 1 ? 'Item' : 'All'}`}
          </Button>
        </div>
      </div>
    </div>
  );
}
