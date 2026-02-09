'use client';

import { useState } from 'react';
import {
  PaperAirplaneIcon,
  CalendarDaysIcon,
  DocumentIcon,
  XMarkIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui';
import { cn } from '@/lib/utils';

export interface PublishResult {
  platform: string;
  success: boolean;
  postUrl?: string;
  error?: string;
}

export interface PostActionPopupProps {
  open: boolean;
  onClose: () => void;
  platforms: string[];
  connectedPlatforms?: string[];
  onSaveDraft: () => Promise<string | null>;
  onSchedule: (date: string, time: string) => Promise<string | null>;
  onPublishNow: (platforms: string[]) => Promise<PublishResult[]>;
  isLoading: boolean;
  defaultScheduleDate?: string;
  defaultScheduleTime?: string;
  bulkMode?: boolean;
  bulkCount?: number;
}

export function PostActionPopup({
  open,
  onClose,
  platforms,
  connectedPlatforms = [],
  onSaveDraft,
  onSchedule,
  onPublishNow,
  isLoading,
  defaultScheduleDate = '',
  defaultScheduleTime = '08:00',
  bulkMode = false,
  bulkCount = 1,
}: PostActionPopupProps) {
  const [selectedAction, setSelectedAction] = useState<'publish' | 'schedule' | 'draft' | null>(null);
  const [publishPlatforms, setPublishPlatforms] = useState<string[]>(platforms);
  const [scheduleDate, setScheduleDate] = useState(defaultScheduleDate);
  const [scheduleTime, setScheduleTime] = useState(defaultScheduleTime);
  const [publishResults, setPublishResults] = useState<PublishResult[] | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const togglePublishPlatform = (p: string) => {
    setPublishPlatforms(prev =>
      prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]
    );
  };

  const handlePublishNow = async () => {
    if (publishPlatforms.length === 0) return;
    setActionLoading(true);
    setPublishResults(null);
    try {
      const results = await onPublishNow(publishPlatforms);
      setPublishResults(results);
    } catch (err) {
      setPublishResults([{ platform: 'all', success: false, error: 'Publish failed. Please try again.' }]);
    }
    setActionLoading(false);
  };

  const handleSchedule = async () => {
    if (!scheduleDate) return;
    setActionLoading(true);
    try {
      await onSchedule(scheduleDate, scheduleTime);
      onClose();
    } catch {
      // error handled in parent
    }
    setActionLoading(false);
  };

  const handleSaveDraft = async () => {
    setActionLoading(true);
    try {
      await onSaveDraft();
      onClose();
    } catch {
      // error handled in parent
    }
    setActionLoading(false);
  };

  const resetAndClose = () => {
    setSelectedAction(null);
    setPublishResults(null);
    setActionLoading(false);
    onClose();
  };

  if (!open) return null;

  const hasResults = publishResults && publishResults.length > 0;
  const allSucceeded = hasResults && publishResults.every(r => r.success);
  const someSucceeded = hasResults && publishResults.some(r => r.success);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-dark/50 backdrop-blur-sm" onClick={resetAndClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-stone/10">
          <h2 className="text-lg font-bold text-charcoal">
            {hasResults ? 'Publish Results' : bulkMode && bulkCount > 1 ? `Choose Action for ${bulkCount} Posts` : 'Choose Action'}
          </h2>
          <button onClick={resetAndClose} className="p-1.5 rounded-lg hover:bg-stone/10 text-stone">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Publish results view */}
        {hasResults ? (
          <div className="p-5 space-y-4">
            {/* Summary icon */}
            <div className="text-center">
              {allSucceeded ? (
                <CheckCircleIcon className="w-12 h-12 text-teal mx-auto mb-2" />
              ) : (
                <XCircleIcon className="w-12 h-12 text-red-500 mx-auto mb-2" />
              )}
              <h3 className="text-base font-semibold text-charcoal">
                {allSucceeded ? 'Published Successfully!' : someSucceeded ? 'Partially Published' : 'Publish Failed'}
              </h3>
            </div>

            {/* Per-platform results */}
            <div className="space-y-2">
              {publishResults.map((r, i) => (
                <div
                  key={i}
                  className={cn(
                    'flex items-center justify-between px-3 py-2.5 rounded-lg border',
                    r.success ? 'border-teal/20 bg-teal/5' : 'border-red-200 bg-red-50'
                  )}
                >
                  <div className="flex items-center gap-2">
                    {r.success ? (
                      <CheckCircleIcon className="w-4 h-4 text-teal shrink-0" />
                    ) : (
                      <XCircleIcon className="w-4 h-4 text-red-500 shrink-0" />
                    )}
                    <span className="text-sm font-medium text-charcoal capitalize">{r.platform}</span>
                  </div>
                  {r.success && r.postUrl ? (
                    <a href={r.postUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-teal hover:underline">
                      View Post
                    </a>
                  ) : r.error ? (
                    <span className="text-xs text-red-600 max-w-[200px] truncate">{r.error}</span>
                  ) : null}
                </div>
              ))}
            </div>

            <Button onClick={resetAndClose} className="w-full">
              Done
            </Button>
          </div>
        ) : (
          <div className="p-5 space-y-3">
            {/* Publish Now Card */}
            <button
              onClick={() => setSelectedAction(selectedAction === 'publish' ? null : 'publish')}
              className={cn(
                'w-full text-left p-4 rounded-xl border-2 transition-all',
                selectedAction === 'publish'
                  ? 'border-teal bg-teal/5'
                  : 'border-stone/10 hover:border-stone/20'
              )}
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  'shrink-0 p-2 rounded-lg',
                  selectedAction === 'publish' ? 'bg-teal/10' : 'bg-stone/5'
                )}>
                  <PaperAirplaneIcon className={cn('w-5 h-5', selectedAction === 'publish' ? 'text-teal' : 'text-stone')} />
                </div>
                <div>
                  <p className={cn('text-sm font-semibold', selectedAction === 'publish' ? 'text-teal' : 'text-charcoal')}>
                    Publish Now
                  </p>
                  <p className="text-xs text-stone">Publish immediately to your connected platforms</p>
                </div>
              </div>
            </button>

            {selectedAction === 'publish' && (
              <div className="ml-4 pl-4 border-l-2 border-teal/20 space-y-3">
                <p className="text-xs font-medium text-stone">Select platforms to publish:</p>
                <div className="flex flex-wrap gap-2">
                  {platforms.map(p => {
                    const isConnected = connectedPlatforms.length === 0 || connectedPlatforms.includes(p);
                    return (
                      <button
                        key={p}
                        onClick={() => isConnected && togglePublishPlatform(p)}
                        disabled={!isConnected}
                        className={cn(
                          'px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors',
                          publishPlatforms.includes(p) && isConnected
                            ? 'bg-teal text-white'
                            : isConnected
                            ? 'bg-stone/5 text-stone hover:bg-stone/10'
                            : 'bg-stone/5 text-stone/40 cursor-not-allowed'
                        )}
                      >
                        {p}
                        {!isConnected && ' (not connected)'}
                      </button>
                    );
                  })}
                </div>
                <Button
                  onClick={handlePublishNow}
                  isLoading={actionLoading}
                  disabled={publishPlatforms.length === 0 || isLoading}
                  className="w-full"
                >
                  <PaperAirplaneIcon className="w-4 h-4 mr-1" />
                  Publish to {publishPlatforms.length} Platform{publishPlatforms.length !== 1 ? 's' : ''}
                </Button>
              </div>
            )}

            {/* Schedule Card */}
            <button
              onClick={() => setSelectedAction(selectedAction === 'schedule' ? null : 'schedule')}
              className={cn(
                'w-full text-left p-4 rounded-xl border-2 transition-all',
                selectedAction === 'schedule'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-stone/10 hover:border-stone/20'
              )}
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  'shrink-0 p-2 rounded-lg',
                  selectedAction === 'schedule' ? 'bg-blue-100' : 'bg-stone/5'
                )}>
                  <CalendarDaysIcon className={cn('w-5 h-5', selectedAction === 'schedule' ? 'text-blue-600' : 'text-stone')} />
                </div>
                <div>
                  <p className={cn('text-sm font-semibold', selectedAction === 'schedule' ? 'text-blue-600' : 'text-charcoal')}>
                    Schedule
                  </p>
                  <p className="text-xs text-stone">Set a date and time for publishing</p>
                </div>
              </div>
            </button>

            {selectedAction === 'schedule' && (
              <div className="ml-4 pl-4 border-l-2 border-blue-200 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-stone mb-1">
                      <CalendarDaysIcon className="w-3 h-3 inline mr-1" />
                      Date
                    </label>
                    <input
                      type="date"
                      value={scheduleDate}
                      onChange={e => setScheduleDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-stone/20 text-sm focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-stone mb-1">
                      <ClockIcon className="w-3 h-3 inline mr-1" />
                      Time
                    </label>
                    <input
                      type="time"
                      value={scheduleTime}
                      onChange={e => setScheduleTime(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-stone/20 text-sm focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none"
                    />
                  </div>
                </div>
                <Button
                  onClick={handleSchedule}
                  isLoading={actionLoading}
                  disabled={!scheduleDate || isLoading}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  <CalendarDaysIcon className="w-4 h-4 mr-1" />
                  {bulkMode && bulkCount > 1 ? `Schedule ${bulkCount} Posts` : 'Schedule Post'}
                </Button>
              </div>
            )}

            {/* Save as Draft Card */}
            <button
              onClick={handleSaveDraft}
              disabled={actionLoading || isLoading}
              className="w-full text-left p-4 rounded-xl border-2 border-stone/10 hover:border-stone/20 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="shrink-0 p-2 rounded-lg bg-stone/5">
                  <DocumentIcon className="w-5 h-5 text-stone" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-charcoal">{bulkMode && bulkCount > 1 ? `Save ${bulkCount} as Drafts` : 'Save as Draft'}</p>
                  <p className="text-xs text-stone">{bulkMode && bulkCount > 1 ? 'Save all without scheduling or publishing' : 'Save without scheduling or publishing'}</p>
                </div>
              </div>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
