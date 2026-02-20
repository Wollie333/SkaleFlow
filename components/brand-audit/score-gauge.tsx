'use client';

interface ScoreGaugeProps {
  score: number;
  rating: string;
  size?: number;
  showLabel?: boolean;
}

export function ScoreGauge({ score, rating, size = 120, showLabel = true }: ScoreGaugeProps) {
  const color = rating === 'green' ? '#10B981' : rating === 'amber' ? '#F59E0B' : '#EF4444';
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  const center = size / 2;

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth={8}
        />
        {/* Score arc */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={8}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center" style={{ width: size, height: size }}>
        <span className="text-2xl font-bold" style={{ color }}>{Math.round(score)}</span>
        <span className="text-xs text-stone">/100</span>
      </div>
      {showLabel && (
        <span className="mt-2 text-xs font-medium capitalize" style={{ color }}>
          {rating === 'green' ? 'Strong' : rating === 'amber' ? 'Needs Work' : 'Critical'}
        </span>
      )}
    </div>
  );
}
