'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import {
  XMarkIcon,
  SparklesIcon,
  ClockIcon,
  CalendarIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

interface AutoScheduleModalProps {
  platforms: string[];
  currentDate?: string;
  organizationId: string;
  onSchedule: (date: string, time: string) => void;
  onCancel: () => void;
}

interface BestTimeSuggestion {
  suggestedDate: string;
  suggestedTime: string;
  reason: string;
  confidenceScore: number;
  expectedEngagementRate: number;
}

export function AutoScheduleModal({
  platforms,
  currentDate,
  organizationId,
  onSchedule,
  onCancel,
}: AutoScheduleModalProps) {
  const [suggestion, setSuggestion] = useState<BestTimeSuggestion | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSuggestion();
  }, [platforms, currentDate]);

  const fetchSuggestion = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/social/best-times/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platforms,
          preferredDate: currentDate,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.needsMoreData) {
          setError('Not enough historical data. Please publish at least 10 posts first.');
        } else {
          setError('Failed to get suggestion');
        }
        return;
      }

      const { data } = await response.json();
      setSuggestion(data);
    } catch (err) {
      console.error('Error fetching suggestion:', err);
      setError('Failed to fetch suggestion');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirm = () => {
    if (suggestion) {
      onSchedule(suggestion.suggestedDate, suggestion.suggestedTime);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-50" onClick={onCancel} />

      {/* Modal */}
      <div className="fixed inset-4 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-lg bg-white rounded-xl shadow-2xl z-50 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
              <SparklesIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-charcoal">Schedule at Best Time</h2>
              <p className="text-xs text-stone">AI-powered optimal posting time</p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="p-2 text-stone hover:text-charcoal hover:bg-stone/10 rounded-lg transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-12 h-12 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mb-4" />
              <p className="text-sm text-stone">Analyzing your posting history...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 bg-red-50 rounded-full flex items-center justify-center">
                <XMarkIcon className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-lg font-semibold text-charcoal mb-2">No Data Available</h3>
              <p className="text-sm text-stone mb-6">{error}</p>
              <button
                onClick={onCancel}
                className="px-4 py-2 bg-stone/10 text-charcoal rounded-lg hover:bg-stone/20 transition-colors text-sm font-medium"
              >
                Close
              </button>
            </div>
          ) : suggestion ? (
            <div className="space-y-6">
              {/* Suggested Time Card */}
              <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-6 border border-purple/20">
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircleIcon className="w-5 h-5 text-purple-600" />
                  <h3 className="font-semibold text-charcoal">Recommended Time</h3>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  {/* Date */}
                  <div className="bg-white rounded-lg p-4 border border-purple/10">
                    <div className="flex items-center gap-2 mb-2">
                      <CalendarIcon className="w-4 h-4 text-purple-600" />
                      <span className="text-xs font-medium text-stone uppercase tracking-wider">
                        Date
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-charcoal">
                      {formatDate(suggestion.suggestedDate)}
                    </p>
                  </div>

                  {/* Time */}
                  <div className="bg-white rounded-lg p-4 border border-purple/10">
                    <div className="flex items-center gap-2 mb-2">
                      <ClockIcon className="w-4 h-4 text-purple-600" />
                      <span className="text-xs font-medium text-stone uppercase tracking-wider">
                        Time
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-charcoal">
                      {formatTime(suggestion.suggestedTime)}
                    </p>
                  </div>
                </div>

                {/* Reason */}
                <div className="bg-white/50 rounded-lg p-3 border border-purple/10">
                  <p className="text-xs text-stone">{suggestion.reason}</p>
                </div>
              </div>

              {/* Performance Metrics */}
              <div className="grid grid-cols-2 gap-4">
                {/* Confidence Score */}
                <div className="bg-white rounded-xl p-4 border border-stone/10">
                  <p className="text-xs text-stone mb-2">Confidence Score</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-stone/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-green-500 to-teal-500"
                        style={{ width: `${suggestion.confidenceScore * 100}%` }}
                      />
                    </div>
                    <span className="text-lg font-bold text-teal">
                      {(suggestion.confidenceScore * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>

                {/* Expected Engagement */}
                <div className="bg-white rounded-xl p-4 border border-stone/10">
                  <p className="text-xs text-stone mb-2">Expected Engagement</p>
                  <p className="text-lg font-bold text-purple-600">
                    {suggestion.expectedEngagementRate.toFixed(2)}%
                  </p>
                </div>
              </div>

              {/* Info */}
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <p className="text-xs text-blue-900">
                  <strong>💡 How it works:</strong> This recommendation is based on analyzing your
                  historical post performance to find when your audience is most engaged on{' '}
                  {platforms.join(', ')}.
                </p>
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer */}
        {!isLoading && !error && suggestion && (
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-stone/10">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-stone hover:text-charcoal border border-stone/20 rounded-lg hover:bg-stone/5 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              className="px-4 py-2 text-sm font-medium bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg hover:from-purple-600 hover:to-blue-600 transition-colors"
            >
              Schedule at This Time
            </button>
          </div>
        )}
      </div>
    </>
  );
}
