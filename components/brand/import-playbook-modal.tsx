'use client';

import { useCallback } from 'react';
import { XMarkIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui';
import { ImportDropZone } from './import-drop-zone';
import { useBrandImport } from '@/hooks/use-brand-import';

interface ImportPlaybookModalProps {
  organizationId: string;
  phaseId?: string;
  phaseName?: string;
  onComplete: () => void;
  onClose: () => void;
}

export function ImportPlaybookModal({
  organizationId,
  phaseId,
  phaseName,
  onComplete,
  onClose,
}: ImportPlaybookModalProps) {
  const {
    file,
    setFile,
    isImporting,
    progress,
    result,
    error,
    startImport,
    reset,
  } = useBrandImport();

  const mode = phaseId ? 'phase' : 'full';

  const handleStart = useCallback(() => {
    startImport(organizationId, mode, phaseId);
  }, [startImport, organizationId, mode, phaseId]);

  const handleDone = useCallback(() => {
    reset();
    onComplete();
  }, [reset, onComplete]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-dark/50 backdrop-blur-sm"
        onClick={!isImporting ? onClose : undefined}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone/10">
          <div>
            <h2 className="text-heading-sm text-charcoal">
              {mode === 'full' ? 'Import Brand Playbook' : `Import to Phase: ${phaseName}`}
            </h2>
            <p className="text-xs text-stone mt-0.5">
              {mode === 'full'
                ? 'Upload an existing brand document to pre-fill all phases'
                : 'Upload a document to extract variables for this phase'}
            </p>
          </div>
          {!isImporting && (
            <button
              onClick={onClose}
              className="p-1.5 text-stone hover:text-charcoal hover:bg-stone/10 rounded-lg transition-colors"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {/* Result view */}
          {result ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <CheckCircleIcon className="w-8 h-8 text-teal flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-charcoal">Import Complete</p>
                  <p className="text-xs text-stone">
                    Extracted {result.extractedCount} of {result.totalVariables} variables
                  </p>
                </div>
              </div>

              {/* Per-phase breakdown */}
              {result.phaseResults.length > 0 && (
                <div className="bg-stone/5 rounded-lg p-3 space-y-1.5 max-h-48 overflow-y-auto">
                  {result.phaseResults.map((pr) => (
                    <div key={pr.phaseNumber} className="flex items-center justify-between text-xs">
                      <span className="text-charcoal">
                        Phase {pr.phaseNumber}: {pr.phaseName}
                      </span>
                      <span className={pr.extractedCount > 0 ? 'text-teal font-medium' : 'text-stone'}>
                        {pr.extractedCount} extracted
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {result.errors.length > 0 && (
                <div className="bg-red-50 rounded-lg p-3 space-y-1">
                  <p className="text-xs font-medium text-red-700">Some batches had issues:</p>
                  {result.errors.map((e, i) => (
                    <p key={i} className="text-xs text-red-600">{e}</p>
                  ))}
                </div>
              )}

              <div className="bg-teal/5 border border-teal/20 rounded-lg p-3">
                <p className="text-xs text-charcoal">
                  Imported values are saved as <strong>drafts</strong>. Go through each phase to review,
                  refine with AI, and lock your answers when ready.
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* File drop zone — hidden during import */}
              {!isImporting && (
                <ImportDropZone file={file} onFileSelect={setFile} disabled={isImporting} />
              )}

              {/* Warning — hidden during import */}
              {!isImporting && (
                <div className="flex gap-2 bg-gold/10 border border-gold/30 rounded-lg p-3">
                  <ExclamationTriangleIcon className="w-4 h-4 text-gold flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-charcoal">
                    Existing unlocked outputs will be updated. Already-locked outputs are always preserved.
                  </p>
                </div>
              )}

              {/* Progress */}
              {isImporting && progress && (
                <div className="space-y-4 py-2">
                  {/* Animated spinner */}
                  <div className="flex flex-col items-center gap-3">
                    <div className="relative w-12 h-12">
                      <div className="absolute inset-0 rounded-full border-2 border-stone/10" />
                      <div className="absolute inset-0 rounded-full border-2 border-teal border-t-transparent animate-spin" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-charcoal">
                        {progress.batchLabel}
                      </p>
                      <p className="text-xs text-stone mt-1">
                        Step {progress.currentBatch} of {progress.totalBatches}
                      </p>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-1.5">
                    <div className="w-full bg-stone/10 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-teal h-2 rounded-full transition-all duration-700 ease-out"
                        style={{
                          width: `${Math.max(5, (progress.currentBatch / progress.totalBatches) * 100)}%`,
                        }}
                      />
                    </div>
                    <p className="text-[11px] text-stone text-center">
                      AI is extracting brand data from your document. This typically takes 1-2 minutes.
                    </p>
                  </div>
                </div>
              )}

              {/* Error */}
              {error && (
                <p className="text-xs text-red-500">{error}</p>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-stone/10">
          {result ? (
            <Button onClick={handleDone}>
              Done
            </Button>
          ) : (
            <>
              <Button
                onClick={onClose}
                variant="ghost"
                disabled={isImporting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleStart}
                disabled={!file || isImporting}
              >
                {isImporting ? 'Importing...' : 'Start Import'}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
