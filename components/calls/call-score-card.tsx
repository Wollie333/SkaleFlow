'use client';

import { getScoringDimensions } from '@/lib/calls/post-call/scoring-config';
import type { CallType } from '@/types/database';

interface ScoreDimension {
  key: string;
  label: string;
  score: number;
  justification: string;
}

interface NewScoreFormat {
  overall: number;
  dimensions: ScoreDimension[];
}

interface CallScoreCardProps {
  score: Record<string, unknown>;
  callType?: string;
}

// Legacy labels for old flat-format scores
const LEGACY_LABELS: Record<string, string> = {
  overall: 'Overall Score',
  frameworkAdherence: 'Framework Adherence',
  talkRatio: 'Talk Ratio (Host %)',
  questionQuality: 'Question Quality',
  objectionHandling: 'Objection Handling',
  closingEffectiveness: 'Closing Effectiveness',
};

function getScoreColor(score: number): string {
  if (score >= 80) return 'text-green-600 bg-green-500/10';
  if (score >= 60) return 'text-yellow-600 bg-yellow-100';
  return 'text-red-600 bg-red-500/10';
}

function getBarColor(score: number): string {
  if (score >= 80) return 'bg-green-500';
  if (score >= 60) return 'bg-yellow-500';
  return 'bg-red-500';
}

function isNewFormat(score: Record<string, unknown>): boolean {
  return Array.isArray(score.dimensions);
}

export function CallScoreCard({ score, callType }: CallScoreCardProps) {
  if (isNewFormat(score)) {
    return <NewScoreCard score={score as unknown as NewScoreFormat} callType={callType} />;
  }
  return <LegacyScoreCard score={score as Record<string, number>} />;
}

function NewScoreCard({ score, callType }: { score: NewScoreFormat; callType?: string }) {
  const overall = score.overall || 0;
  const dimensions = score.dimensions || [];

  // Get config descriptions as fallback
  const configDimensions = callType
    ? getScoringDimensions(callType as CallType)
    : [];

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

      {/* Dimensions */}
      <div className="bg-cream-warm rounded-xl border border-stone/10 p-5">
        <h3 className="text-sm font-semibold text-charcoal mb-4">Score Breakdown</h3>
        <div className="space-y-5">
          {dimensions.map(dim => {
            const configDim = configDimensions.find(c => c.key === dim.key);
            return (
              <div key={dim.key}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-charcoal font-medium">{dim.label}</span>
                  <span className={`text-sm font-semibold ${dim.score >= 80 ? 'text-green-600' : dim.score >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                    {dim.score}
                  </span>
                </div>
                <div className="w-full h-2 bg-cream rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${getBarColor(dim.score)}`}
                    style={{ width: `${Math.min(dim.score, 100)}%` }}
                  />
                </div>
                {dim.justification && (
                  <p className="text-xs text-stone mt-1 italic">{dim.justification}</p>
                )}
                {!dim.justification && configDim && (
                  <p className="text-xs text-stone mt-0.5">{configDim.description}</p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function LegacyScoreCard({ score }: { score: Record<string, number> }) {
  const overall = score.overall || 0;

  return (
    <div className="space-y-6">
      <div className="bg-cream-warm rounded-xl border border-stone/10 p-6 text-center">
        <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full text-2xl font-bold ${getScoreColor(overall)}`}>
          {overall}
        </div>
        <p className="text-sm font-medium text-charcoal mt-3">Overall Call Score</p>
        <p className="text-xs text-stone mt-1">
          {overall >= 80 ? 'Excellent call!' : overall >= 60 ? 'Good call with room for improvement' : 'Review the breakdown below for improvement areas'}
        </p>
      </div>

      <div className="bg-cream-warm rounded-xl border border-stone/10 p-5">
        <h3 className="text-sm font-semibold text-charcoal mb-4">Score Breakdown</h3>
        <div className="space-y-4">
          {Object.entries(score)
            .filter(([key]) => key !== 'overall')
            .map(([key, value]) => (
              <div key={key}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-charcoal">{LEGACY_LABELS[key] || key}</span>
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
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
