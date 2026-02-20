'use client';

import { useState, useEffect } from 'react';
import { SparklesIcon } from '@heroicons/react/24/outline';
import { GenerationBatchTracker, type BatchStatus } from './generation-batch-tracker';

const MODAL_TIMEOUT_MS = 3 * 60 * 1000; // 3 minutes

interface GenerationModalProps {
  /** Show the modal — appears immediately on Generate click */
  open: boolean;
  /** Set once the batch is enqueued — starts the actual tracking */
  batchId: string | null;
  totalPosts: number;
  onComplete: () => void;
  onCancel: () => void;
  onProgress?: (status: BatchStatus) => void;
  /** Error from the preparation phase (item creation / enqueueing) */
  prepError?: string | null;
}

export function GenerationModal({
  open,
  batchId,
  totalPosts,
  onComplete,
  onCancel,
  onProgress,
  prepError,
}: GenerationModalProps) {
  const [hasTimedOut, setHasTimedOut] = useState(false);

  // Reset timeout state when modal opens/closes or batch changes
  useEffect(() => {
    if (!open || !batchId) {
      setHasTimedOut(false);
      return;
    }
    const timeout = setTimeout(() => setHasTimedOut(true), MODAL_TIMEOUT_MS);
    return () => clearTimeout(timeout);
  }, [open, batchId]);

  if (!open) return null;

  const isPreparing = !batchId && !prepError;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-dark/60 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative bg-cream-warm rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-teal/10 flex items-center justify-center">
            <SparklesIcon className="w-8 h-8 text-teal animate-pulse" />
          </div>
          <h2 className="text-xl font-bold text-charcoal">
            {prepError ? 'Generation Failed' : 'AI is crafting your content'}
          </h2>
          <p className="text-sm text-stone mt-1">
            {prepError
              ? prepError
              : isPreparing
              ? `Preparing ${totalPosts} post${totalPosts !== 1 ? 's' : ''}...`
              : `Generating ${totalPosts} post${totalPosts !== 1 ? 's' : ''} with your brand DNA`}
          </p>
        </div>

        {/* Tracker or preparing state */}
        <div className="px-6 pb-6">
          {hasTimedOut && (
            <div className="mb-3 bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-sm font-medium text-amber-800">Generation is taking longer than expected</p>
              <p className="text-xs text-amber-700 mt-1">Your content may still be generating in the background. Check your calendar for results.</p>
              <button
                onClick={onCancel}
                className="mt-2 px-3 py-1.5 bg-amber-100 text-amber-800 text-xs font-medium rounded-lg hover:bg-amber-200 transition-colors"
              >
                Close and check later
              </button>
            </div>
          )}
          {batchId ? (
            <GenerationBatchTracker
              batchId={batchId}
              onComplete={onComplete}
              onCancel={onCancel}
              onProgress={onProgress}
            />
          ) : prepError ? (
            <div className="space-y-3">
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-400">{prepError}</p>
              </div>
              <button
                onClick={onCancel}
                className="w-full px-4 py-2 bg-stone/10 text-charcoal text-sm font-medium rounded-lg hover:bg-stone/20 transition-colors"
              >
                Close
              </button>
            </div>
          ) : (
            /* Preparing state — show pulsing dots */
            <div className="space-y-3">
              <div className="w-full bg-stone/10 rounded-full h-2.5">
                <div className="rounded-full h-2.5 bg-teal/40 animate-pulse w-1/4" />
              </div>
              <p className="text-xs text-teal text-center font-medium animate-pulse">
                Setting up your content items...
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
