'use client';

import { cn } from '@/lib/utils';

interface SentimentChartProps {
  sentimentCounts: {
    positive: number;
    neutral: number;
    negative: number;
  };
  totalMentions: number;
}

export function SentimentChart({ sentimentCounts, totalMentions }: SentimentChartProps) {
  const calculatePercentage = (count: number) => {
    if (totalMentions === 0) return 0;
    return ((count / totalMentions) * 100).toFixed(1);
  };

  const positive = sentimentCounts.positive;
  const neutral = sentimentCounts.neutral;
  const negative = sentimentCounts.negative;

  const positivePercentage = calculatePercentage(positive);
  const neutralPercentage = calculatePercentage(neutral);
  const negativePercentage = calculatePercentage(negative);

  // Calculate donut chart segments (using SVG circle with stroke-dasharray)
  const radius = 70;
  const circumference = 2 * Math.PI * radius;

  const positiveLength = (positive / totalMentions) * circumference;
  const neutralLength = (neutral / totalMentions) * circumference;
  const negativeLength = (negative / totalMentions) * circumference;

  const positiveOffset = 0;
  const neutralOffset = positiveLength;
  const negativeOffset = positiveLength + neutralLength;

  return (
    <div className="bg-cream-warm rounded-xl border border-stone/10 p-6">
      <h3 className="font-semibold text-charcoal mb-6">Sentiment Overview</h3>

      {totalMentions === 0 ? (
        <div className="text-center py-12">
          <p className="text-sm text-stone">No sentiment data available</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Donut Chart */}
          <div className="flex items-center justify-center">
            <div className="relative w-48 h-48">
              {/* SVG Donut Chart */}
              <svg viewBox="0 0 160 160" className="transform -rotate-90">
                {/* Background circle */}
                <circle
                  cx="80"
                  cy="80"
                  r={radius}
                  fill="none"
                  stroke="#f5f5f4"
                  strokeWidth="20"
                />

                {/* Positive segment */}
                {positive > 0 && (
                  <circle
                    cx="80"
                    cy="80"
                    r={radius}
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="20"
                    strokeDasharray={`${positiveLength} ${circumference}`}
                    strokeDashoffset={-positiveOffset}
                    className="transition-all duration-300"
                  />
                )}

                {/* Neutral segment */}
                {neutral > 0 && (
                  <circle
                    cx="80"
                    cy="80"
                    r={radius}
                    fill="none"
                    stroke="#6b7280"
                    strokeWidth="20"
                    strokeDasharray={`${neutralLength} ${circumference}`}
                    strokeDashoffset={-neutralOffset}
                    className="transition-all duration-300"
                  />
                )}

                {/* Negative segment */}
                {negative > 0 && (
                  <circle
                    cx="80"
                    cy="80"
                    r={radius}
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth="20"
                    strokeDasharray={`${negativeLength} ${circumference}`}
                    strokeDashoffset={-negativeOffset}
                    className="transition-all duration-300"
                  />
                )}
              </svg>

              {/* Center text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-3xl font-bold text-charcoal">{totalMentions}</p>
                <p className="text-xs text-stone">Total Mentions</p>
              </div>
            </div>
          </div>

          {/* Legend & Stats */}
          <div className="flex flex-col justify-center space-y-4">
            {/* Positive */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full bg-green-500" />
                <div>
                  <p className="text-sm font-medium text-charcoal">Positive</p>
                  <p className="text-xs text-stone">{positive} mentions</p>
                </div>
              </div>
              <span className="text-lg font-bold text-green-600">{positivePercentage}%</span>
            </div>

            {/* Neutral */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full bg-cream0" />
                <div>
                  <p className="text-sm font-medium text-charcoal">Neutral</p>
                  <p className="text-xs text-stone">{neutral} mentions</p>
                </div>
              </div>
              <span className="text-lg font-bold text-stone">{neutralPercentage}%</span>
            </div>

            {/* Negative */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full bg-red-500" />
                <div>
                  <p className="text-sm font-medium text-charcoal">Negative</p>
                  <p className="text-xs text-stone">{negative} mentions</p>
                </div>
              </div>
              <span className="text-lg font-bold text-red-600">{negativePercentage}%</span>
            </div>

            {/* Overall sentiment score */}
            <div className="pt-4 border-t border-stone/10">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-stone">Overall Sentiment</span>
                <span
                  className={cn(
                    'text-lg font-bold',
                    positive > negative ? 'text-green-600' : negative > positive ? 'text-red-600' : 'text-stone'
                  )}
                >
                  {positive > negative ? '😊 Positive' : negative > positive ? '😞 Negative' : '😐 Neutral'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
