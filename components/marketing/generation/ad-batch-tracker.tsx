'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui';
import {
  SparklesIcon,
  XMarkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';

export interface AdBatchStatus {
  batchId: string;
  status: string;
  totalItems: number;
  completedItems: number;
  failedItems: number;
  percentage: number;
  recentItems: Array<{ id: string; name: string | null; status: string }>;
  failedDetails?: Array<{ creativeId: string; error: string }>;
}

interface AdBatchTrackerProps {
  batchId: string;
  onComplete: () => void;
  onCancel: () => void;
}

export function AdBatchTracker({ batchId, onComplete, onCancel }: AdBatchTrackerProps) {
  const [status, setStatus] = useState<AdBatchStatus | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const completedRef = useRef(false);
  const cancelledRef = useRef(false);
  const onCompleteRef = useRef(onComplete);
  const onCancelRef = useRef(onCancel);
  onCompleteRef.current = onComplete;
  onCancelRef.current = onCancel;

  // Sequential processing loop: fetch status -> process one item -> repeat
  const runProcessingLoop = useCallback(async () => {
    if (completedRef.current) return;

    // 1. Get initial status
    try {
      const res = await fetch(`/api/marketing/generate/batch/status?batchId=${batchId}`);
      if (!res.ok) {
        setError('Failed to check generation status');
        return;
      }
      const data: AdBatchStatus = await res.json();
      setStatus(data);

      if (data.status === 'completed' || data.status === 'failed' || data.status === 'cancelled') {
        completedRef.current = true;
        setTimeout(() => onCompleteRef.current(), 1500);
        return;
      }
    } catch {
      setError('Network error checking generation status');
      return;
    }

    // 2. Processing loop: process one item at a time
    while (!completedRef.current && !cancelledRef.current) {
      try {
        const res = await fetch(
          `/api/marketing/generate/batch/status?batchId=${batchId}&action=process`
        );

        if (!res.ok) {
          setError('Generation request failed');
          await new Promise((r) => setTimeout(r, 3000));
          continue;
        }

        const data: AdBatchStatus = await res.json();
        setStatus(data);
        setError(null);

        if (data.status === 'completed' || data.status === 'failed' || data.status === 'cancelled') {
          completedRef.current = true;
          setTimeout(() => onCompleteRef.current(), 2000);
          return;
        }

        // Small pause between items
        await new Promise((r) => setTimeout(r, 500));
      } catch {
        setError('Network error during generation');
        await new Promise((r) => setTimeout(r, 5000));
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [batchId]);

  useEffect(() => {
    cancelledRef.current = false;
    completedRef.current = false;
    runProcessingLoop();

    return () => {
      cancelledRef.current = true;
    };
  }, [runProcessingLoop]);

  const handleCancel = async () => {
    setIsCancelling(true);
    cancelledRef.current = true;
    try {
      await fetch('/api/marketing/generate/batch/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ batchId }),
      });
      onCancelRef.current();
    } catch {
      setError('Failed to cancel generation');
    }
    setIsCancelling(false);
  };

  if (!status) {
    return (
      <div className="bg-white rounded-xl border border-stone/10 p-4">
        <div className="flex items-center gap-2">
          <SparklesIcon className="w-5 h-5 text-teal animate-pulse" />
          <span className="text-sm text-stone">Starting ad generation...</span>
        </div>
      </div>
    );
  }

  const isDone = status.status === 'completed' || status.status === 'failed' || status.status === 'cancelled';
  const isProcessing = status.status === 'pending' || status.status === 'processing';
  const currentItem = status.completedItems + status.failedItems + 1;

  return (
    <div className="bg-white rounded-xl border border-stone/10 p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isDone && status.status === 'completed' ? (
            <CheckCircleIcon className="w-5 h-5 text-teal" />
          ) : isDone && status.status === 'failed' ? (
            <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />
          ) : (
            <SparklesIcon className="w-5 h-5 text-teal animate-pulse" />
          )}
          <h4 className="text-sm font-medium text-charcoal">
            {isDone && status.status === 'completed'
              ? 'Ad Generation Complete'
              : isDone && status.status === 'cancelled'
              ? 'Ad Generation Cancelled'
              : isDone && status.status === 'failed'
              ? 'Ad Generation Failed'
              : `Generating creative ${Math.min(currentItem, status.totalItems)} of ${status.totalItems}...`}
          </h4>
        </div>
        <span className="text-xs text-stone">
          {status.completedItems}/{status.totalItems} done
          {status.failedItems > 0 && ` (${status.failedItems} failed)`}
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-stone/10 rounded-full h-2.5">
        <div
          className={`rounded-full h-2.5 transition-all duration-700 ${
            status.status === 'failed'
              ? 'bg-red-500'
              : status.status === 'cancelled'
              ? 'bg-stone/40'
              : 'bg-teal'
          }`}
          style={{ width: `${status.percentage}%` }}
        />
      </div>

      {/* Per-item progress dots */}
      <div className="flex gap-1">
        {Array.from({ length: status.totalItems }, (_, i) => {
          const isCompleted = i < status.completedItems;
          const isFailed = i >= status.completedItems && i < status.completedItems + status.failedItems;
          const isCurrent = i === status.completedItems + status.failedItems && isProcessing;
          return (
            <div
              key={i}
              className={`flex-1 h-1.5 rounded-full ${
                isCompleted
                  ? 'bg-teal'
                  : isFailed
                  ? 'bg-red-400'
                  : isCurrent
                  ? 'bg-teal/50 animate-pulse'
                  : 'bg-stone/10'
              }`}
            />
          );
        })}
      </div>

      {/* Recently completed items */}
      {status.recentItems.length > 0 && (
        <div className="space-y-1">
          {status.recentItems.slice(0, 3).map((item) => (
            <div key={item.id} className="flex items-center gap-2 text-xs text-stone">
              <CheckCircleIcon className="w-3.5 h-3.5 text-teal shrink-0" />
              <span className="truncate">{item.name || 'Generated creative'}</span>
            </div>
          ))}
        </div>
      )}

      {/* Failed item details */}
      {status.failedDetails && status.failedDetails.length > 0 && (
        <div className="space-y-1">
          {status.failedDetails.map((item, idx) => (
            <div key={idx} className="flex items-start gap-2 text-xs text-red-600">
              <ExclamationTriangleIcon className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span className="truncate">{item.error}</span>
            </div>
          ))}
        </div>
      )}

      {/* Failure summary */}
      {isDone && status.failedItems > 0 && status.completedItems > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-2">
          <p className="text-xs text-amber-800">
            {status.failedItems} {status.failedItems === 1 ? 'creative' : 'creatives'} could not be generated.
            You can retry these later.
          </p>
        </div>
      )}

      {/* Status messages */}
      {isProcessing && status.completedItems > 0 && (
        <p className="text-xs text-teal text-center font-medium animate-pulse">
          AI is crafting unique ad copy for each variation...
        </p>
      )}

      {isProcessing && status.completedItems === 0 && (
        <p className="text-xs text-teal text-center font-medium animate-pulse">
          Generating first creative -- this may take a moment...
        </p>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-2">
          <p className="text-xs text-red-700">{error}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        {isProcessing && (
          <Button
            onClick={handleCancel}
            variant="ghost"
            size="sm"
            isLoading={isCancelling}
            className="w-full text-stone hover:text-red-600"
          >
            <XMarkIcon className="w-4 h-4 mr-1" />
            Cancel
          </Button>
        )}
        {isDone && status.status === 'completed' && status.completedItems > 0 && (
          <Button
            onClick={() => onCompleteRef.current()}
            variant="primary"
            size="sm"
            className="w-full"
          >
            <EyeIcon className="w-4 h-4 mr-1" />
            View Creatives
          </Button>
        )}
      </div>
    </div>
  );
}
