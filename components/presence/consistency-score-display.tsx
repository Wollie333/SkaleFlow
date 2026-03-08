'use client';

interface ConsistencyScoreDisplayProps {
  score: number;
  className?: string;
}

function getScoreColor(score: number): string {
  if (score >= 90) return 'text-green-600';
  if (score >= 75) return 'text-teal-600';
  if (score >= 60) return 'text-gold-600';
  if (score >= 40) return 'text-orange-600';
  return 'text-red-600';
}

function getScoreLabel(score: number): string {
  if (score >= 90) return 'Excellent';
  if (score >= 75) return 'Strong';
  if (score >= 60) return 'Developing';
  if (score >= 40) return 'Needs Work';
  return 'Critical';
}

function getScoreBgColor(score: number): string {
  if (score >= 90) return 'bg-green-100';
  if (score >= 75) return 'bg-teal-100';
  if (score >= 60) return 'bg-gold-100';
  if (score >= 40) return 'bg-orange-100';
  return 'bg-red-100';
}

export function ConsistencyScoreDisplay({ score, className = '' }: ConsistencyScoreDisplayProps) {
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className={`bg-white rounded-xl border border-stone-200 p-6 ${className}`}>
      <h3 className="text-sm font-semibold text-dark-900 mb-4">Cross-Platform Consistency Score</h3>

      <div className="flex items-center gap-6">
        {/* Circular gauge */}
        <div className="relative w-28 h-28 flex-shrink-0">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="#e5e7eb"
              strokeWidth="8"
            />
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className={`${getScoreColor(score)} transition-all duration-1000`}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-2xl font-bold ${getScoreColor(score)}`}>{score}</span>
            <span className="text-xs text-stone-500">/100</span>
          </div>
        </div>

        <div>
          <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getScoreBgColor(score)} ${getScoreColor(score)}`}>
            {getScoreLabel(score)}
          </span>
          <p className="text-sm text-stone-500 mt-2">
            {score >= 90
              ? 'Your profiles are professional, consistent, and client-attracting.'
              : score >= 75
                ? 'Strong presence with minor gaps. Quick wins available.'
                : score >= 60
                  ? 'Notable inconsistencies across platforms. Targeted improvements needed.'
                  : 'Significant gaps need attention. Follow the activation plan.'}
          </p>
        </div>
      </div>
    </div>
  );
}
