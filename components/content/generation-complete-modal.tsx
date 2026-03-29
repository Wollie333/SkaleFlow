'use client';

import { CheckCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';

interface GenerationCompleteModalProps {
  totalGenerated: number;
  totalFailed: number;
  onClose: () => void;
}

export function GenerationCompleteModal({
  totalGenerated,
  totalFailed,
  onClose,
}: GenerationCompleteModalProps) {
  return (
    <div className="fixed inset-0 bg-dark/80 flex items-center justify-center z-50 p-4">
      <div className="bg-cream-warm rounded-xl shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-stone/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-teal/10 flex items-center justify-center">
              <CheckCircleIcon className="w-6 h-6 text-teal" />
            </div>
            <h2 className="text-heading-md text-charcoal">Generation Complete!</h2>
          </div>
          <button
            onClick={onClose}
            className="text-stone hover:text-charcoal transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <div className="bg-teal/5 border border-teal/20 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-charcoal">Successfully Generated</span>
              <span className="text-2xl font-bold text-teal">{totalGenerated}</span>
            </div>
            <p className="text-xs text-stone">
              {totalGenerated === 1 ? '1 post is' : `${totalGenerated} posts are`} ready for review
            </p>
          </div>

          {totalFailed > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-red-900">Failed</span>
                <span className="text-2xl font-bold text-red-600">{totalFailed}</span>
              </div>
              <p className="text-xs text-red-700">
                {totalFailed === 1 ? '1 post failed' : `${totalFailed} posts failed`} to generate. You can retry from the posts table.
              </p>
            </div>
          )}

          <p className="text-sm text-stone">
            All posts are now available in the Posts tab. Review each post's content, add media, and approve when ready!
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-stone/10">
          <Button onClick={onClose}>
            Got it!
          </Button>
        </div>
      </div>
    </div>
  );
}
