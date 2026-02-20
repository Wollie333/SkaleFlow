'use client';

import { ScoreGauge } from './score-gauge';
import { CategoryCard } from './category-card';
import { ExecutiveSummary } from './executive-summary';
import { TrafficLight } from './traffic-light';
import { CATEGORY_ORDER } from '@/lib/brand-audit/types';
import type { BrandAuditCategory, BrandAuditRating } from '@/types/database';
import { Button } from '@/components/ui/button';
import { ArrowPathIcon, DocumentArrowDownIcon } from '@heroicons/react/24/outline';

interface Score {
  id: string;
  category: string;
  score: number;
  rating: string;
  analysis: string | null;
  key_finding: string | null;
  actionable_insight: string | null;
}

interface Audit {
  id: string;
  overall_score: number | null;
  overall_rating: string | null;
  executive_summary: string | null;
  status: string;
}

interface ResultsDashboardProps {
  audit: Audit;
  scores: Score[];
  onRegenerate?: () => void;
}

export function ResultsDashboard({ audit, scores, onRegenerate }: ResultsDashboardProps) {
  // Sort scores by category order
  const sortedScores = CATEGORY_ORDER
    .map((cat) => scores.find((s) => s.category === cat))
    .filter((s): s is Score => !!s);

  const trafficLightData = sortedScores.map((s) => ({
    category: s.category,
    rating: s.rating,
  }));

  return (
    <div className="space-y-6">
      {/* Top row: Overall score + traffic light + actions */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-6">
          <div className="relative">
            <ScoreGauge
              score={audit.overall_score || 0}
              rating={audit.overall_rating || 'red'}
              size={140}
            />
          </div>
          <div>
            <h2 className="text-xl font-bold text-charcoal">Overall Brand Health</h2>
            <div className="mt-2">
              <TrafficLight ratings={trafficLightData} />
            </div>
            <p className="text-xs text-stone mt-2">
              {sortedScores.filter((s) => s.rating === 'green').length} strong
              {' · '}
              {sortedScores.filter((s) => s.rating === 'amber').length} needs work
              {' · '}
              {sortedScores.filter((s) => s.rating === 'red').length} critical
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onRegenerate && (
            <Button variant="outline" size="sm" onClick={onRegenerate}>
              <ArrowPathIcon className="w-4 h-4 mr-1" /> Re-score
            </Button>
          )}
          <Button size="sm" className="bg-teal hover:bg-teal-dark text-white"
            onClick={() => window.location.href = `/api/brand-audits/${audit.id}/report`}
          >
            <DocumentArrowDownIcon className="w-4 h-4 mr-1" /> Generate Report
          </Button>
        </div>
      </div>

      {/* Executive Summary */}
      <ExecutiveSummary
        summary={audit.executive_summary || ''}
        auditId={audit.id}
      />

      {/* Category cards — 2x3 grid */}
      <div>
        <h3 className="font-semibold text-charcoal mb-4">Category Scores</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sortedScores.map((score) => (
            <CategoryCard
              key={score.category}
              category={score.category as BrandAuditCategory}
              score={score.score}
              rating={score.rating as BrandAuditRating}
              analysis={score.analysis}
              keyFinding={score.key_finding}
              actionableInsight={score.actionable_insight}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
