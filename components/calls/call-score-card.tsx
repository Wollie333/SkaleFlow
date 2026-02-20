'use client';

interface CallScoreCardProps {
  score: Record<string, number>;
}

const SCORE_LABELS: Record<string, string> = {
  overall: 'Overall Score',
  frameworkAdherence: 'Framework Adherence',
  talkRatio: 'Talk Ratio (Host %)',
  questionQuality: 'Question Quality',
  objectionHandling: 'Objection Handling',
  closingEffectiveness: 'Closing Effectiveness',
};

const SCORE_DESCRIPTIONS: Record<string, string> = {
  overall: 'Combined score across all dimensions',
  frameworkAdherence: 'How well the call template was followed',
  talkRatio: 'Host speaking percentage (ideal: ~40% for discovery)',
  questionQuality: 'Percentage of suggested questions used',
  objectionHandling: 'How well objections were addressed',
  closingEffectiveness: 'Effectiveness of the call closing',
};

function getScoreColor(score: number): string {
  if (score >= 80) return 'text-green-600 bg-green-100';
  if (score >= 60) return 'text-yellow-600 bg-yellow-100';
  return 'text-red-600 bg-red-100';
}

function getBarColor(score: number): string {
  if (score >= 80) return 'bg-green-500';
  if (score >= 60) return 'bg-yellow-500';
  return 'bg-red-500';
}

export function CallScoreCard({ score }: CallScoreCardProps) {
  const overall = score.overall || 0;

  return (
    <div className="space-y-6">
      {/* Overall Score */}
      <div className="bg-cream-warm rounded-xl border border-stone/10 p-6 text-center">
        <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full text-2xl font-bold ${getScoreColor(overall)}`}>
          {overall}
        </div>
        <p className="text-sm font-medium text-charcoal mt-3">Overall Call Score</p>
        <p className="text-xs text-stone mt-1">
          {overall >= 80 ? 'Excellent call!' : overall >= 60 ? 'Good call with room for improvement' : 'Review the breakdown below for improvement areas'}
        </p>
      </div>

      {/* Breakdown */}
      <div className="bg-cream-warm rounded-xl border border-stone/10 p-5">
        <h3 className="text-sm font-semibold text-charcoal mb-4">Score Breakdown</h3>
        <div className="space-y-4">
          {Object.entries(score)
            .filter(([key]) => key !== 'overall')
            .map(([key, value]) => (
              <div key={key}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-charcoal">{SCORE_LABELS[key] || key}</span>
                  <span className={`text-sm font-semibold ${value >= 80 ? 'text-green-600' : value >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                    {key === 'talkRatio' ? `${value}%` : value}
                  </span>
                </div>
                <div className="w-full h-2 bg-cream rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${getBarColor(value)}`}
                    style={{ width: `${Math.min(value, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-stone mt-0.5">{SCORE_DESCRIPTIONS[key] || ''}</p>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
