'use client';

import { cn } from '@/lib/utils';

interface SentimentIndicatorProps {
  sentiment: 'positive' | 'neutral' | 'negative' | 'question' | null;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export function SentimentIndicator({
  sentiment,
  size = 'md',
  showLabel = false,
}: SentimentIndicatorProps) {
  if (!sentiment) return null;

  const config = {
    positive: {
      emoji: '😊',
      label: 'Positive',
      color: 'bg-green-100 text-green-700 border-green-200',
    },
    neutral: {
      emoji: '😐',
      label: 'Neutral',
      color: 'bg-stone-100 text-stone-700 border-stone-200',
    },
    negative: {
      emoji: '😞',
      label: 'Negative',
      color: 'bg-red-100 text-red-700 border-red-200',
    },
    question: {
      emoji: '❓',
      label: 'Question',
      color: 'bg-blue-100 text-blue-700 border-blue-200',
    },
  };

  const { emoji, label, color } = config[sentiment];

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border font-medium',
        color,
        sizeClasses[size]
      )}
    >
      <span>{emoji}</span>
      {showLabel && <span>{label}</span>}
    </span>
  );
}
