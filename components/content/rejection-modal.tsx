'use client';

import { useState } from 'react';
import { Button } from '@/components/ui';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

const REJECTION_TAGS = [
  { value: 'too_generic', label: 'Too Generic' },
  { value: 'wrong_tone', label: 'Wrong Tone' },
  { value: 'off_brand', label: 'Off-Brand' },
  { value: 'too_long', label: 'Too Long' },
  { value: 'too_short', label: 'Too Short' },
  { value: 'wrong_format', label: 'Wrong Format' },
  { value: 'irrelevant', label: 'Irrelevant' },
  { value: 'low_quality', label: 'Low Quality' },
] as const;

interface RejectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string, tags: string[]) => void;
  isLoading?: boolean;
}

export function RejectionModal({ isOpen, onClose, onConfirm, isLoading }: RejectionModalProps) {
  const [reason, setReason] = useState('');
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());

  if (!isOpen) return null;

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag);
      else next.add(tag);
      return next;
    });
  };

  const handleConfirm = () => {
    onConfirm(reason.trim(), Array.from(selectedTags));
    setReason('');
    setSelectedTags(new Set());
  };

  const isValid = reason.trim().length >= 10;

  return (
    <div className="fixed inset-0 bg-dark/50 flex items-center justify-center z-50">
      <div className="bg-cream-warm rounded-2xl p-6 w-full max-w-md shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-heading-sm text-charcoal">Reject Content</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-stone/10"
          >
            <XMarkIcon className="w-5 h-5 text-stone" />
          </button>
        </div>

        <p className="text-sm text-stone mb-4">
          Your feedback helps the AI avoid making the same mistakes in the future.
        </p>

        {/* Tag chips */}
        <div className="flex flex-wrap gap-2 mb-4">
          {REJECTION_TAGS.map(tag => (
            <button
              key={tag.value}
              onClick={() => toggleTag(tag.value)}
              className={cn(
                'px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
                selectedTags.has(tag.value)
                  ? 'bg-red-50 border-red-300 text-red-400'
                  : 'bg-stone/5 border-stone/15 text-stone hover:border-stone/30'
              )}
            >
              {tag.label}
            </button>
          ))}
        </div>

        {/* Reason textarea */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-charcoal mb-1">
            Reason <span className="text-stone font-normal">(min 10 characters)</span>
          </label>
          <textarea
            value={reason}
            onChange={e => setReason(e.target.value)}
            rows={3}
            placeholder="What was wrong with this content? Be specific so the AI can learn..."
            className="w-full px-3 py-2 rounded-lg border border-stone/20 text-sm focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-300 resize-none"
          />
          {reason.length > 0 && reason.length < 10 && (
            <p className="text-xs text-red-500 mt-1">{10 - reason.length} more characters needed</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium text-stone hover:bg-stone/5 transition-colors"
          >
            Cancel
          </button>
          <Button
            onClick={handleConfirm}
            disabled={!isValid || isLoading}
            isLoading={isLoading}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            Confirm Reject
          </Button>
        </div>
      </div>
    </div>
  );
}
