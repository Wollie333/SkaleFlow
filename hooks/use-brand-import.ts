'use client';

import { useState, useCallback } from 'react';

interface ImportProgress {
  currentBatch: number;
  totalBatches: number;
  batchLabel: string;
}

interface ImportResult {
  success: boolean;
  extractedCount: number;
  totalVariables: number;
  errors: string[];
  phaseResults: Array<{
    phaseNumber: string;
    phaseName: string;
    extractedCount: number;
  }>;
}

export function useBrandImport() {
  const [file, setFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState<ImportProgress | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startImport = useCallback(
    async (organizationId: string, mode: 'full' | 'phase', phaseId?: string) => {
      if (!file) {
        setError('No file selected');
        return;
      }

      setIsImporting(true);
      setError(null);
      setResult(null);
      setProgress({
        currentBatch: 0,
        totalBatches: mode === 'full' ? 4 : 1,
        batchLabel: 'Reading document...',
      });

      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('organizationId', organizationId);
        formData.append('mode', mode);
        if (phaseId) {
          formData.append('phaseId', phaseId);
        }

        const response = await fetch('/api/brand/import', {
          method: 'POST',
          body: formData,
        });

        // Non-SSE error responses (auth, validation, etc.)
        const contentType = response.headers.get('Content-Type') || '';
        if (!contentType.includes('text/event-stream')) {
          const data = await response.json();
          throw new Error(data.error || 'Import failed');
        }

        // Parse SSE stream
        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('Failed to read response stream');
        }

        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          // Parse complete SSE events from the buffer
          const events = buffer.split('\n\n');
          // Keep the last (potentially incomplete) chunk in the buffer
          buffer = events.pop() || '';

          for (const eventBlock of events) {
            if (!eventBlock.trim()) continue;

            let eventType = '';
            let eventData = '';

            for (const line of eventBlock.split('\n')) {
              if (line.startsWith('event: ')) {
                eventType = line.slice(7);
              } else if (line.startsWith('data: ')) {
                eventData = line.slice(6);
              }
            }

            if (!eventType || !eventData) continue;

            try {
              const parsed = JSON.parse(eventData);

              if (eventType === 'progress') {
                setProgress({
                  currentBatch: parsed.currentBatch,
                  totalBatches: parsed.totalBatches,
                  batchLabel: parsed.batchLabel,
                });
              } else if (eventType === 'complete') {
                setResult(parsed);
                setProgress({
                  currentBatch: parsed.totalBatches,
                  totalBatches: parsed.totalBatches,
                  batchLabel: 'Complete',
                });
              } else if (eventType === 'error') {
                throw new Error(parsed.error || 'Import failed');
              }
            } catch (parseErr) {
              // Re-throw if this is our own error
              if (parseErr instanceof Error && parseErr.message !== 'Unexpected end of JSON input') {
                throw parseErr;
              }
            }
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Import failed');
      } finally {
        setIsImporting(false);
      }
    },
    [file]
  );

  const reset = useCallback(() => {
    setFile(null);
    setIsImporting(false);
    setProgress(null);
    setResult(null);
    setError(null);
  }, []);

  return {
    file,
    setFile,
    isImporting,
    progress,
    result,
    error,
    startImport,
    reset,
  };
}
