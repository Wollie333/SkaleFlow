'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui';
import { SparklesIcon, XMarkIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

export interface BatchStatus {
  batchId: string;
  status: string;
  totalItems: number;
  completedItems: number;
  failedItems: number;
  percentage: number;
  recentItems: Array<{ id: string; topic: string | null; status: string }>;
  failedDetails?: Array<{ contentItemId: string; error: string }>;
}

interface GenerationBatchTrackerProps {
  batchId: string;
  onComplete: () => void;
  onCancel: () => void;
  /** Called after each item is processed — use to reload items progressively */
  onProgress?: (status: BatchStatus) => void;
}

export function GenerationBatchTracker({ batchId, onComplete, onCancel, onProgress }: GenerationBatchTrackerProps) {
  const [status, setStatus] = useState<BatchStatus | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const completedRef = useRef(false);
  const cancelledRef = useRef(false);
  // Store callbacks in refs so the processing loop never re-triggers on callback changes
  const onCompleteRef = useRef(onComplete);
  const onCancelRef = useRef(onCancel);
  const onProgressRef = useRef(onProgress);
  onCompleteRef.current = onComplete;
  onCancelRef.current = onCancel;
  onProgressRef.current = onProgress;

  // Sequential processing loop: fetch status → process one item → repeat
  const runProcessingLoop = useCallback(async () => {
    // Guard already finished (user cancelled via button)
    if (completedRef.current) return;

    console.log('[GEN-TRACKER] Starting processing loop for batch:', batchId);

    // 1. Get initial status (fast, no processing)
    try {
      console.log('[GEN-TRACKER] Fetching initial status...');
      const res = await fetch(`/api/content/generate/queue/status?batchId=${batchId}`);
      console.log('[GEN-TRACKER] Initial status response:', res.status, res.statusText);
      if (!res.ok) {
        const errText = await res.text();
        console.error('[GEN-TRACKER] Initial status failed:', res.status, errText);
        setError('Failed to check generation status');
        return;
      }
      const data: BatchStatus = await res.json();
      console.log('[GEN-TRACKER] Initial status data:', JSON.stringify(data));
      setStatus(data);

      // Already done? (batch was completed by cron or previous session)
      if (data.status === 'completed' || data.status === 'failed' || data.status === 'cancelled') {
        console.log('[GEN-TRACKER] Batch already done:', data.status);
        completedRef.current = true;
        setTimeout(() => onCompleteRef.current(), 1500);
        return;
      }
    } catch (err) {
      console.error('[GEN-TRACKER] Network error on initial status:', err);
      setError('Network error checking generation status');
      return;
    }

    // 2. Processing loop: process one item at a time
    let loopCount = 0;
    while (!completedRef.current && !cancelledRef.current) {
      loopCount++;
      console.log(`[GEN-TRACKER] Processing loop iteration #${loopCount} — calling action=process...`);
      const startTime = Date.now();

      try {
        // Call with action=process — this awaits ONE AI generation on the server
        const res = await fetch(`/api/content/generate/queue/status?batchId=${batchId}&action=process`);
        const elapsed = Date.now() - startTime;
        console.log(`[GEN-TRACKER] Process response: ${res.status} ${res.statusText} (took ${elapsed}ms)`);

        if (!res.ok) {
          const errText = await res.text();
          console.error('[GEN-TRACKER] Process request failed:', res.status, errText);
          setError('Generation request failed');
          // Wait 3s then retry
          await new Promise(r => setTimeout(r, 3000));
          continue;
        }

        const data: BatchStatus = await res.json();
        console.log(`[GEN-TRACKER] Updated status: ${data.completedItems}/${data.totalItems} completed, ${data.failedItems} failed, status=${data.status}`);
        if (data.recentItems.length > 0) {
          console.log('[GEN-TRACKER] Recent items:', data.recentItems.map(i => i.topic).join(', '));
        }
        setStatus(data);
        setError(null);

        // Notify parent so it can reload items progressively
        if (onProgressRef.current) {
          onProgressRef.current(data);
        }

        // Check if batch is done
        if (data.status === 'completed' || data.status === 'failed' || data.status === 'cancelled') {
          console.log(`[GEN-TRACKER] Batch finished: ${data.status} — ${data.completedItems} completed, ${data.failedItems} failed`);
          completedRef.current = true;
          setTimeout(() => onCompleteRef.current(), 2000);
          return;
        }

        // Small pause between items so the UI has time to update
        await new Promise(r => setTimeout(r, 500));
      } catch (err) {
        console.error('[GEN-TRACKER] Network error during processing:', err);
        setError('Network error during generation');
        // Wait 5s then retry
        await new Promise(r => setTimeout(r, 5000));
      }
    }
    console.log('[GEN-TRACKER] Processing loop ended. completedRef:', completedRef.current, 'cancelledRef:', cancelledRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [batchId]);

  useEffect(() => {
    // Reset refs on (re)mount — critical for React 18 Strict Mode
    // which runs: mount → cleanup → mount. Without this reset,
    // the second mount sees cancelledRef=true and the loop never starts.
    cancelledRef.current = false;
    completedRef.current = false;

    runProcessingLoop();

    return () => {
      // Stop loop on unmount
      cancelledRef.current = true;
    };
  }, [runProcessingLoop]);

  const handleCancel = async () => {
    setIsCancelling(true);
    cancelledRef.current = true;
    try {
      await fetch('/api/content/generate/queue/cancel', {
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
          <span className="text-sm text-stone">Starting generation...</span>
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
              ? 'Generation Complete'
              : isDone && status.status === 'cancelled'
              ? 'Generation Cancelled'
              : isDone && status.status === 'failed'
              ? 'Generation Failed'
              : `Generating post ${Math.min(currentItem, status.totalItems)} of ${status.totalItems}...`
            }
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
            status.status === 'failed' ? 'bg-red-500' :
            status.status === 'cancelled' ? 'bg-stone/40' :
            'bg-teal'
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
          {status.recentItems.slice(0, 3).map(item => (
            <div key={item.id} className="flex items-center gap-2 text-xs text-stone">
              <CheckCircleIcon className="w-3.5 h-3.5 text-teal shrink-0" />
              <span className="truncate">{item.topic || 'Generated post'}</span>
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
            {status.failedItems} {status.failedItems === 1 ? 'post' : 'posts'} could not be generated. These remain as ideas for manual editing or retry.
          </p>
        </div>
      )}

      {/* Status messages */}
      {isProcessing && status.completedItems > 0 && (
        <p className="text-xs text-teal text-center font-medium animate-pulse">
          AI is writing unique content for each post...
        </p>
      )}

      {isProcessing && status.completedItems === 0 && (
        <p className="text-xs text-teal text-center font-medium animate-pulse">
          Generating first post — this may take a moment...
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
      </div>
    </div>
  );
}
