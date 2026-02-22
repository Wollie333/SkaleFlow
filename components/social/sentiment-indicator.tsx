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
      color: 'bg-green-600/10 text-green-600 border-green-600/20',
    },
    neutral: {
      emoji: '😐',
      label: 'Neutral',
      color: 'bg-cream text-charcoal border-stone/10',
    },
    negative: {
      emoji: '😞',
      label: 'Negative',
      color: 'bg-red-600/10 text-red-600 border-red-600/20',
    },
    question: {
      emoji: '❓',
      label: 'Question',
      color: 'bg-teal/10 text-teal border-teal/20',
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
