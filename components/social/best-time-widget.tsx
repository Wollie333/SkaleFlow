'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import {
  ClockIcon,
  SparklesIcon,
  ArrowPathIcon,
  ChevronDownIcon,
  FireIcon,
} from '@heroicons/react/24/outline';

interface BestTimeWidgetProps {
  organizationId: string;
  platforms: string[];
  onSelectTime?: (date: string, time: string) => void;
}

interface BestTimeData {
  platform: string;
  bestTimes: { [day: string]: string[] };
  confidenceScore: number;
  sampleSize: number;
  avgEngagementByHour: { [hour: string]: number };
}

const DAYS_OF_WEEK = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

export function BestTimeWidget({
  organizationId,
  platforms,
  onSelectTime,
}: BestTimeWidgetProps) {
  const [bestTimeData, setBestTimeData] = useState<BestTimeData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    if (platforms.length > 0) {
      fetchBestTimes();
    }
  }, [platforms]);

  const fetchBestTimes = async () => {
    try {
      setIsLoading(true);
      // Fetch for primary platform
      const platform = platforms[0];
      const response = await fetch(`/api/social/best-times?platform=${platform}`);

      if (!response.ok) {
        const error = await response.json();
        if (error.needsAnalysis) {
          // No data yet
          setBestTimeData(null);
        }
        return;
      }

      const { data } = await response.json();
      setBestTimeData(data);
    } catch (error) {
      console.error('Error fetching best times:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnalyze = async () => {
    try {
      setIsAnalyzing(true);
      const platform = platforms[0];
      const response = await fetch('/api/social/best-times/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform }),
      });

      if (!response.ok) {
        const error = await response.json();
        if (error.needsMoreData) {
          alert('Not enough data to analyze. Please publish at least 10 posts first.');
        } else {
          alert('Failed to analyze posting times');
        }
        return;
      }

      const { data } = await response.json();
      setBestTimeData(data);
      alert('Analysis complete!');
    } catch (error) {
      console.error('Error analyzing:', error);
      alert('Failed to analyze posting times');
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (platforms.length === 0) {
    return null;
  }

  return (
    <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl border border-purple/20 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-cream/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
            <ClockIcon className="w-5 h-5 text-white" />
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-charcoal flex items-center gap-2">
              Best Time to Post
              <SparklesIcon className="w-4 h-4 text-purple-500" />
            </h3>
            <p className="text-xs text-stone">AI-powered optimal posting times</p>
          </div>
        </div>
        <ChevronDownIcon
          className={cn(
            'w-5 h-5 text-stone transition-transform',
            isExpanded && 'rotate-180'
          )}
        />
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="px-6 pb-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
            </div>
          ) : !bestTimeData ? (
            <div className="text-center py-6">
              <p className="text-sm text-stone mb-4">
                No analysis available yet. Analyze your posting history to find optimal times.
              </p>
              <button
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                className={cn(
                  'flex items-center gap-2 mx-auto px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                  isAnalyzing
                    ? 'bg-stone/10 text-stone/40 cursor-not-allowed'
                    : 'bg-purple-500 text-white hover:bg-purple-600'
                )}
              >
                {isAnalyzing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <SparklesIcon className="w-4 h-4" />
                    Analyze Now
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Confidence Score */}
              <div className="flex items-center justify-between p-3 bg-cream-warm/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-xs font-medium text-charcoal">Confidence Score</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-stone/20 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-green-500 to-teal-500"
                      style={{ width: `${bestTimeData.confidenceScore * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-teal">
                    {(bestTimeData.confidenceScore * 100).toFixed(0)}%
                  </span>
                </div>
              </div>

              {/* Best Times by Day */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-stone uppercase tracking-wider">
                  Peak Times by Day
                </h4>
                <div className="space-y-1.5">
                  {DAYS_OF_WEEK.map((day) => {
                    const times = bestTimeData.bestTimes[day];
                    if (!times || times.length === 0) return null;

                    return (
                      <div
                        key={day}
                        className="flex items-center justify-between p-2 bg-cream-warm rounded-lg border border-purple/10"
                      >
                        <span className="text-sm font-medium text-charcoal capitalize">
                          {day.substring(0, 3)}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {times.slice(0, 3).map((time, index) => (
                            <div
                              key={time}
                              className={cn(
                                'px-2 py-1 rounded text-xs font-medium',
                                index === 0 && 'bg-purple-100 text-purple-700',
                                index === 1 && 'bg-blue-500/10 text-blue-400',
                                index === 2 && 'bg-indigo-100 text-indigo-700'
                              )}
                            >
                              {time}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Sample Size */}
              <div className="flex items-center justify-between text-xs text-stone pt-3 border-t border-purple/20">
                <span>Based on {bestTimeData.sampleSize} published posts</span>
                <button
                  onClick={handleAnalyze}
                  disabled={isAnalyzing}
                  className="flex items-center gap-1 text-purple-600 hover:text-purple-700 font-medium"
                >
                  <ArrowPathIcon className={cn('w-3 h-3', isAnalyzing && 'animate-spin')} />
                  Re-analyze
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
