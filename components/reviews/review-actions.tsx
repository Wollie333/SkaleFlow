'use client';

import { Button } from '@/components/ui';
import { Textarea } from '@/components/ui';
import {
  CheckCircleIcon,
  ArrowPathIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';

export interface ReviewActionsProps {
  onApprove: () => void;
  onRequestRevision: () => void;
  onReject: () => void;
  comment: string;
  onCommentChange: (value: string) => void;
  isLoading: boolean;
}

export function ReviewActions({
  onApprove,
  onRequestRevision,
  onReject,
  comment,
  onCommentChange,
  isLoading,
}: ReviewActionsProps) {
  return (
    <div className="space-y-4 pt-4 border-t border-stone/10">
      <Textarea
        placeholder="Add a comment (optional for approve, recommended for revision/reject)..."
        value={comment}
        onChange={(e) => onCommentChange(e.target.value)}
        rows={3}
        disabled={isLoading}
        className="text-sm"
      />

      <div className="flex items-center gap-3">
        <Button
          onClick={onApprove}
          disabled={isLoading}
          isLoading={isLoading}
          className="bg-teal hover:bg-teal-light text-white"
          size="sm"
        >
          <CheckCircleIcon className="w-4 h-4" />
          Approve
        </Button>

        <Button
          onClick={onRequestRevision}
          disabled={isLoading}
          isLoading={isLoading}
          className="bg-amber-500 hover:bg-amber-600 text-white"
          size="sm"
        >
          <ArrowPathIcon className="w-4 h-4" />
          Request Revision
        </Button>

        <Button
          onClick={onReject}
          disabled={isLoading}
          isLoading={isLoading}
          variant="danger"
          size="sm"
        >
          <XCircleIcon className="w-4 h-4" />
          Reject
        </Button>
      </div>
    </div>
  );
}
